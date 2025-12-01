/**
 * Cron endpoint for appointment reminders
 * 
 * This should be called by a cron job service (e.g., Vercel Cron, AWS EventBridge)
 * Example: Call this endpoint every hour
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentReminders } from '@/lib/jobs/appointment-reminders';

// Verify cron secret if provided
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret if configured
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sendAppointmentReminders();

    return NextResponse.json({
      success: true,
      remindersSent: result.sent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing appointment reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that use POST
export async function POST(req: NextRequest) {
  return GET(req);
}

