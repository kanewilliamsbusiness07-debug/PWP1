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

interface SummaryData {
  clientName: string;
  netWorth: number;
  monthlyCashFlow: number;
  taxSavings: number;
  isRetirementDeficit: boolean;
  retirementDeficitSurplus: number;
  projectedRetirementLumpSum: number;
  projectedRetirementMonthlyCashFlow: number;
}

/**
 * Generate professional HTML email template
 */
function generateEmailHTML(
  clientName: string,
  comments: string | undefined,
  reportDate: string,
  summaryData: SummaryData | undefined,
  hasPdfAttachment: boolean
): string {
  const formattedNetWorth = summaryData?.netWorth?.toLocaleString() || '0';
  const formattedCashFlow = summaryData?.monthlyCashFlow?.toLocaleString() || '0';
  const formattedTaxSavings = summaryData?.taxSavings?.toLocaleString() || '0';
  const formattedRetirementLumpSum = summaryData?.projectedRetirementLumpSum?.toLocaleString() || '0';
  const formattedMonthlyIncome = summaryData?.projectedRetirementMonthlyCashFlow?.toLocaleString() || '0';
  const retirementStatus = summaryData?.isRetirementDeficit ? 'Action Required' : 'On Track';
  const retirementStatusColor = summaryData?.isRetirementDeficit ? '#dc2626' : '#16a34a';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Financial Planning Report</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .header p {
          margin: 8px 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
          color: #1a1a1a;
        }
        .message-box {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
        .comments-box {
          background: #fefce8;
          padding: 15px 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #eab308;
        }
        .comments-box strong {
          color: #854d0e;
          display: block;
          margin-bottom: 8px;
        }
        .comments-box p {
          margin: 0;
          color: #713f12;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .summary-item {
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
        }
        .summary-item label {
          display: block;
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .summary-item .value {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }
        .summary-item .value.positive { color: #16a34a; }
        .summary-item .value.negative { color: #dc2626; }
        .summary-item .value.neutral { color: #3b82f6; }
        .report-includes {
          margin: 25px 0;
        }
        .report-includes h3 {
          color: #1e293b;
          font-size: 16px;
          margin-bottom: 12px;
        }
        .report-includes ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .report-includes li {
          padding: 8px 0 8px 28px;
          position: relative;
          color: #475569;
          border-bottom: 1px solid #f1f5f9;
        }
        .report-includes li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #16a34a;
          font-weight: bold;
        }
        .report-includes li:last-child {
          border-bottom: none;
        }
        .attachment-note {
          background: #eff6ff;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .attachment-note .icon {
          font-size: 20px;
        }
        .attachment-note p {
          margin: 0;
          color: #1e40af;
          font-size: 14px;
        }
        .cta-section {
          text-align: center;
          padding: 25px 0;
        }
        .cta-section p {
          color: #64748b;
          margin-bottom: 15px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        .signature {
          margin-top: 20px;
        }
        .signature .name {
          font-weight: 600;
          color: #1e293b;
        }
        .signature .company {
          color: #64748b;
          font-size: 14px;
        }
        .signature .email {
          color: #3b82f6;
          font-size: 14px;
          text-decoration: none;
        }
        .disclaimer {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 25px;
          padding-top: 15px;
          border-top: 1px solid #f1f5f9;
          font-style: italic;
          line-height: 1.5;
        }
        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>📊 Financial Planning Report</h1>
          <p>Perpetual Wealth Partners</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${clientName || 'Valued Client'},
          </div>
          
          <div class="message-box">
            <p style="margin: 0 0 10px;">
              Please find attached your comprehensive Financial Planning Report dated <strong>${reportDate}</strong>.
            </p>
            <p style="margin: 0;">
              This report contains a detailed analysis of your current financial position and 
              projections for your retirement planning goals.
            </p>
          </div>
          
          ${comments ? `
            <div class="comments-box">
              <strong>💬 Additional Comments:</strong>
              <p>${comments}</p>
            </div>
          ` : ''}
          
          ${summaryData ? `
            <div class="summary-grid">
              <div class="summary-item">
                <label>Current Net Worth</label>
                <div class="value neutral">$${formattedNetWorth}</div>
              </div>
              <div class="summary-item">
                <label>Monthly Surplus</label>
                <div class="value ${summaryData.monthlyCashFlow >= 0 ? 'positive' : 'negative'}">$${formattedCashFlow}</div>
              </div>
              <div class="summary-item">
                <label>Projected Retirement</label>
                <div class="value neutral">$${formattedRetirementLumpSum}</div>
              </div>
              <div class="summary-item">
                <label>Tax Savings Potential</label>
                <div class="value positive">$${formattedTaxSavings}</div>
              </div>
              <div class="summary-item" style="grid-column: span 2;">
                <label>Retirement Status</label>
                <div class="value" style="color: ${retirementStatusColor};">${retirementStatus}</div>
              </div>
            </div>
          ` : ''}
          
          <div class="report-includes">
            <h3>The report includes:</h3>
            <ul>
              <li>Executive Summary of your financial position</li>
              <li>Detailed cash flow analysis</li>
              <li>Investment property potential assessment</li>
              <li>Retirement projection with growth scenarios</li>
              <li>Tax optimization strategies</li>
              <li>Personalized recommendations and action items</li>
            </ul>
          </div>
          
          ${hasPdfAttachment ? `
            <div class="attachment-note">
              <span class="icon">📎</span>
              <p><strong>Note:</strong> A detailed PDF report is attached to this email.</p>
            </div>
          ` : ''}
          
          <div class="cta-section">
            <p>
              If you have any questions about the report or would like to discuss any of the 
              recommendations in detail, please don't hesitate to contact us.
            </p>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p style="margin: 0 0 5px;">Best regards,</p>
              <p class="name">Perpetual Wealth Partners</p>
              <p class="company">Financial Planning Team</p>
              <a href="mailto:admin@pwp2026.com.au" class="email">admin@pwp2026.com.au</a>
            </div>
            
            <div class="disclaimer">
              This report is confidential and intended solely for the use of the individual to whom it is addressed. 
              If you have received this email in error, please notify us immediately. The information provided 
              is general in nature and does not constitute financial advice. Please consult with a qualified 
              financial advisor before making any financial decisions.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * POST /api/email/send-report - Send financial planning report to client
 */
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      clientEmail,
      clientId,
      clientName,
      subject,
      message,
      summaryData,
      pdfId,
      reportDate,
    } = await req.json();

    // Validate required fields
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    if (!session.user.email) {
      return NextResponse.json(
        { error: 'Account email not found. Please ensure you are logged in with a valid email.' },
        { status: 400 }
      );
    }

    // Prepare email recipients (client + account holder)
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
            const bucket = process.env.AWS_S3_BUCKET || process.env.APP_AWS_S3_BUCKET || process.env.S3_BUCKET;
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
              contentType: pdfExport.mimeType || 'application/pdf',
            };
          } catch (error) {
            console.error('Error fetching PDF from S3:', error);
            // Continue without attachment if fetch fails
          }
        }
      }
    }

    // Generate the formatted date for the email
    const formattedDate = reportDate || new Date().toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create email HTML using the professional template
    const html = generateEmailHTML(
      clientName,
      message,
      formattedDate,
      summaryData,
      !!pdfAttachment
    );

    // Send email with optional PDF attachment
    await sendEmail(session.user.id, {
      to: recipients,
      subject: subject || `Your Financial Planning Report - ${formattedDate}`,
      html,
      attachments: pdfAttachment ? [pdfAttachment] : undefined,
    });

    // Log the email sending for audit purposes
    console.log(`Financial report email sent to ${clientEmail} by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${clientEmail}${pdfAttachment ? ' with PDF attachment' : ''}`,
    });
  } catch (error) {
    console.error('Error sending report email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
