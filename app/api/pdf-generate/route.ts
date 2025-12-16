import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import prisma from '@/lib/prisma';
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

    // Launch Puppeteer
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

    // Save PDF to uploads and create DB record
    const uploadsDir = join(process.cwd(), 'uploads', 'pdfs');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const client = clientId
      ? await prisma.client.findFirst({ where: { id: clientId, userId: session.user.id } })
      : null;

    const time = new Date();
    const clientName = client ? `${client.firstName || ''}_${client.lastName || ''}`.replace(/\s+/g, '_') : 'Client';
    const date = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`;
    const safeFileName = fileName || `Financial_Summary_${clientName}_${date}.pdf`;
    const sanitized = safeFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${sanitized}`;
    const filePath = join(uploadsDir, uniqueName);

    await writeFile(filePath, pdfBuffer);

    // Create DB record only if client is found
    if (client) {
      const pdfExport = await prisma.pdfExport.create({
        data: {
          userId: session.user.id,
          clientId: client.id,
          fileName: sanitized,
          filePath: `/uploads/pdfs/${uniqueName}`,
          fileSize: pdfBuffer.length,
          mimeType: 'application/pdf'
        }
      });

      return NextResponse.json({ success: true, pdfExport });
    }

    // If client not saved to DB, return success but do not create DB record
    return NextResponse.json({ success: true, filePath: `/uploads/pdfs/${uniqueName}`, fileSize: pdfBuffer.length });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
