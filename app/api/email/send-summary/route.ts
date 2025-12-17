import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { sendEmail } from '@/lib/email/email-service';
import { ddbDocClient, s3Client } from '@/lib/aws/clients';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { toBuffer } from 'stream-buffers';

// POST /api/email/send-summary - Send summary report to client and account email
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientEmail, clientId, clientName, subject, message, summaryData, pdfId } = await req.json();

    // Validate that both emails are provided
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email is required' },
        { status: 400 }
      );
    }

    if (!session.user.email) {
      return NextResponse.json(
        { error: 'Account email not found. Please ensure you are logged in with a valid email.' },
        { status: 400 }
      );
    }

    // Prepare email recipients
    const recipients = [clientEmail, session.user.email];

    // Fetch PDF attachment if pdfId is provided (DynamoDB + S3)
    let pdfAttachment = null;
    if (pdfId) {
      const pdfTable = process.env.DDB_PDF_EXPORTS_TABLE;
      if (pdfTable) {
        const res: any = await ddbDocClient.send(new GetCommand({ TableName: pdfTable, Key: { id: pdfId } } as any));
        const pdfExport = res.Item;
        if (pdfExport && pdfExport.userId === session.user.id && pdfExport.s3Key) {
          try {
            const bucket = process.env.AWS_S3_BUCKET;
            const getObj = await s3Client.send(new GetObjectCommand({ Bucket: bucket!, Key: pdfExport.s3Key }));
            const body = getObj.Body as Readable;
            const buffer = await toBuffer.createWriteStream();
            await new Promise<void>((resolve, reject) => {
              body.on('data', (chunk) => buffer.write(chunk));
              body.on('end', () => { buffer.end(); resolve(); });
              body.on('error', (err) => reject(err));
            });
            const fileBuffer = buffer.getContents() as Buffer;
            pdfAttachment = {
              filename: pdfExport.fileName,
              content: fileBuffer,
              contentType: pdfExport.mimeType || 'application/pdf'
            };
          } catch (error) {
            console.error('Error fetching PDF from S3:', error);
            // Continue without attachment if fetch fails
          }
        }
      }
    }

    // Create email HTML
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Financial Planning Summary Report</h2>
        ${message ? `<p>${message}</p>` : ''}
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          ${summaryData ? `
            <h3>Summary</h3>
            <p><strong>Client:</strong> ${summaryData.clientName || clientName || 'N/A'}</p>
            <p><strong>Net Worth:</strong> $${summaryData.netWorth?.toLocaleString() || '0'}</p>
            <p><strong>Monthly Cash Flow:</strong> $${summaryData.monthlyCashFlow?.toLocaleString() || '0'}</p>
            <p><strong>Tax Savings:</strong> $${summaryData.taxSavings?.toLocaleString() || '0'}</p>
            <p><strong>Retirement Status:</strong> ${summaryData.isRetirementDeficit ? 'Deficit' : 'Surplus'}</p>
          ` : ''}
        </div>
        ${pdfAttachment ? '<p><strong>Note:</strong> A detailed PDF report is attached to this email.</p>' : ''}
        <p>This is an automated email from Perpetual Wealth Partners Financial Planning System.</p>
      </div>
    `;

    // Send email with optional PDF attachment
    await sendEmail(session.user.id, {
      to: recipients,
      subject: subject || 'Your Financial Planning Report - Perpetual Wealth Partners',
      html,
      attachments: pdfAttachment ? [pdfAttachment] : undefined
    });

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to both client and account email${pdfAttachment ? ' with PDF attachment' : ''}`
    });
  } catch (error) {
    console.error('Error sending summary email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

