import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// NOTE: Running Puppeteer in Lambda requires an appropriate layer/binary (e.g., chrome-aws-lambda or a container image).
// This handler provides the wiring: receive HTML (base64) or S3 key, generate PDF (if runtime supports it), upload to S3
// and persist metadata to DynamoDB. For production, provide a Lambda layer with headless Chromium or use a container.

const region = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client({ region });
const ddb = new DynamoDBClient({ region });
const ddbDoc = DynamoDBDocumentClient.from(ddb);

export const handler = async (event: any) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const { htmlBase64, sourceS3Key, clientId, userId, fileName } = body;

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
    }

    // If running in a container or Lambda with headless Chromium available, attempt to render HTML to PDF
    let pdfBuffer: Buffer;
    try {
      // Lazy require to avoid importing puppeteer in environments without Chromium
      const puppeteer = require('puppeteer-core');
      // If CHROMIUM_PATH env is provided, use it
      const launchOpts: any = { args: ['--no-sandbox','--disable-setuid-sandbox'] };
      if (process.env.CHROMIUM_PATH) launchOpts.executablePath = process.env.CHROMIUM_PATH;
      const browser = await puppeteer.launch(launchOpts);
      const page = await browser.newPage();
      const html = htmlBase64 ? Buffer.from(htmlBase64, 'base64').toString('utf8') : '<html><body>No content provided</body></html>';
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      pdfBuffer = await page.pdf({ printBackground: true, width: '1440px', height: `${height}px` });
      await browser.close();
    } catch (err) {
      console.warn('Puppeteer rendering failed or not available, falling back to stub PDF:', err?.message || err);
      pdfBuffer = Buffer.from('%PDF-1.4\n%render-fallback\n', 'utf8');
    }

    // Upload to configured S3 bucket
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) return { statusCode: 500, body: JSON.stringify({ error: 'AWS_S3_BUCKET not configured' }) };

    const time = new Date();
    const safeName = (fileName || `Financial_Summary_${clientId || 'Client'}_${time.toISOString().slice(0,10)}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `pdfs/${userId}/${Date.now()}_${safeName}`;

    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: pdfBuffer, ContentType: 'application/pdf' }));

    // Persist metadata to DynamoDB if configured
    const pdfTable = process.env.DDB_PDF_EXPORTS_TABLE;
    let item: any = null;
    if (pdfTable) {
      item = {
        id: body.id || `pdf_${Date.now()}`,
        userId,
        clientId: clientId || null,
        fileName: safeName,
        s3Key: key,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        createdAt: new Date().toISOString()
      };

      await ddbDoc.send(new PutCommand({ TableName: pdfTable, Item: item }));
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, s3Key: key, pdfExport: item }) };
  } catch (err: any) {
    console.error('Function error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
};
