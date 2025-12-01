import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { sendEmail } from '@/lib/email/email-service';

// POST /api/email/send-summary - Send summary report to client and account email
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(auth)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientEmail, subject, message, summaryData } = await req.json();

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

    // Create email HTML
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Financial Planning Summary Report</h2>
        ${message ? `<p>${message}</p>` : ''}
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          ${summaryData ? `
            <h3>Summary</h3>
            <p><strong>Client:</strong> ${summaryData.clientName || 'N/A'}</p>
            <p><strong>Net Worth:</strong> $${summaryData.netWorth?.toLocaleString() || '0'}</p>
            <p><strong>Monthly Cash Flow:</strong> $${summaryData.monthlyCashFlow?.toLocaleString() || '0'}</p>
            <p><strong>Tax Savings:</strong> $${summaryData.taxSavings?.toLocaleString() || '0'}</p>
            <p><strong>Retirement Status:</strong> ${summaryData.isRetirementDeficit ? 'Deficit' : 'Surplus'}</p>
          ` : ''}
        </div>
        <p>This is an automated email from AOK Perpetual Group Financial Planning System.</p>
      </div>
    `;

    // Send email
    await sendEmail(session.user.id, {
      to: recipients,
      subject: subject || 'Your Financial Planning Report - AOK Perpetual Group',
      html
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully to both client and account email'
    });
  } catch (error) {
    console.error('Error sending summary email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

