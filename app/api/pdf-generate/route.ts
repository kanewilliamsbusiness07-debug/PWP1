import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
// Replaced Prisma usage with S3 + DynamoDB (via Amplify)
import { s3Client, ddbDocClient } from '@/lib/aws/clients';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import puppeteer from 'puppeteer';

// POST /api/pdf-generate
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { html, clientId, fileName } = body as { html?: string; clientId?: string; fileName?: string };

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing html content' }, { status: 400 });
    }

    // If a Lambda function name is configured, invoke it and let it produce the PDF
    const lambdaName = process.env.PDF_GENERATOR_FUNCTION_NAME || process.env.PDF_GENERATOR_LAMBDA;
    if (lambdaName) {
      // Use Lambda invoke to generate PDF server-side
      const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
      const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
      const payload = JSON.stringify({ htmlBase64: Buffer.from(html).toString('base64'), clientId, fileName, userId: session.user.id });
      const invokeRes: any = await lambda.send(new InvokeCommand({ FunctionName: lambdaName, Payload: Buffer.from(payload) }));
      // Parse response Payload
      const bodyBuf = Buffer.from(invokeRes.Payload || []);
      let parsed; try { parsed = JSON.parse(bodyBuf.toString()); } catch (e) { parsed = null; }
      if (!parsed || !parsed.s3Key) {
        console.error('Lambda invocation failed or returned no s3Key', parsed);
        return NextResponse.json({ error: 'PDF function failed' }, { status: 500 });
      }

      return NextResponse.json({ success: true, pdfExport: parsed.pdfExport || { s3Key: parsed.s3Key } });
    }

    // Fallback: Launch Puppeteer locally
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Set viewport to dashboard width
    // Use higher deviceScaleFactor for high resolution (approx 300 DPI equivalent)
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 3 });

    // Use setContent so we can render the exact HTML snapshot from the client
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for fonts and images
    await page.evaluate(async () => {
      // Wait for document fonts
      if ((document as any).fonts && (document as any).fonts.ready) {
        await (document as any).fonts.ready;
      }
      // Wait for images to load inside #summary-root if present
      const root = document.querySelector('#summary-root') || document.body;
      const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((res) => { img.onload = img.onerror = () => res(); });
      }));
    });

    // Small pause to ensure styles applied
    await new Promise((res) => setTimeout(res, 400));

    // Compute full height
    const height = await page.evaluate(() => document.documentElement.scrollHeight);

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: '1440px',
      height: `${height}px`,
      preferCSSPageSize: false,
    });

    await browser.close();

    // Upload PDF to S3
    const uploadsBucket = process.env.AWS_S3_BUCKET || process.env.APP_AWS_S3_BUCKET || process.env.S3_BUCKET;
    if (!uploadsBucket) {
      await browser.close();
      return NextResponse.json({ error: 'Server not configured: AWS_S3_BUCKET missing' }, { status: 500 });
    }

    const time = new Date();
    const date = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`;
    const safeFileName = fileName || `Financial_Summary_${clientId || 'Client'}_${date}.pdf`;
    const sanitized = safeFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${sanitized}`;
    const s3Key = `pdfs/${session.user.id}/${uniqueName}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: uploadsBucket,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    }));

    // Create metadata record in DynamoDB
    const pdfTable = process.env.DDB_PDF_EXPORTS_TABLE;
    if (pdfTable) {
      const item = {
        id: uuidv4(),
        userId: session.user.id,
        clientId: clientId || null,
        fileName: sanitized,
        s3Key,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        createdAt: new Date().toISOString()
      } as any;

      await ddbDocClient.send(new PutCommand({ TableName: pdfTable, Item: item }));

      return NextResponse.json({ success: true, pdfExport: item });
    }

    // If no DynamoDB table configured, return S3 path
    return NextResponse.json({ success: true, s3Key, fileSize: pdfBuffer.length });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
