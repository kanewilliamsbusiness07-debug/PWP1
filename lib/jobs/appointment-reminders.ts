/**
 * Appointment Reminder System
 * 
 * Sends automated appointment reminders to both client and account email
 */

import { ddbDocClient } from '@/lib/aws/clients';
import { sendEmail } from '@/lib/email/email-service';
import * as formatModule from 'date-fns/format';
import { ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { GetCommand as S3GetCommand } from '@aws-sdk/lib-dynamodb';
const format: (date: Date | number, fmt: string) => string = (formatModule as any).default ?? (formatModule as any);

/**
 * Send appointment reminders for upcoming appointments
 * Should be called by a cron job or scheduled task
 */
export async function sendAppointmentReminders() {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

  // Find appointments that need reminders using a scan (small dataset expected)
  const apptTable = process.env.DDB_APPOINTMENTS_TABLE;
  if (!apptTable) {
    console.warn('DDB_APPOINTMENTS_TABLE not configured');
    return { sent: 0 };
  }

  const scanRes: any = await ddbDocClient.send(new ScanCommand({ TableName: apptTable } as any));
  const all = scanRes.Items || [];
  const appointments = (all || []).filter((a: any) => {
    try {
      if (a.status !== 'SCHEDULED') return false;
      if (a.reminderSent) return false;
      const sd = new Date(a.startDateTime);
      return sd >= now && sd <= reminderWindow;
    } catch (err) { return false; }
  });

  for (const appointment of appointments) {
    try {
      const recipients: string[] = [];

      // Fetch client details
      if (appointment.clientId) {
        const clientsTable = process.env.DDB_CLIENTS_TABLE;
        if (clientsTable) {
          try {
            const cRes: any = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: appointment.clientId } } as any));
            if (cRes && cRes.Item && cRes.Item.email) {
              recipients.push(cRes.Item.email);
              appointment.client = cRes.Item;
            }
          } catch (cErr) { /* ignore */ }
        }
      }

      // Fetch user email
      const usersTable = process.env.DDB_USERS_TABLE;
      if (usersTable) {
        try {
          const uRes: any = await ddbDocClient.send(new GetCommand({ TableName: usersTable, Key: { id: appointment.userId } } as any));
          if (uRes && uRes.Item && uRes.Item.email) recipients.push(uRes.Item.email);
        } catch (uErr) { /* ignore */ }
      }

      if (recipients.length === 0) {
        console.warn(`No email recipients for appointment ${appointment.id}`);
        continue;
      }

      const formattedDate = format(new Date(appointment.startDateTime), 'EEEE, MMMM d, yyyy');
      const formattedTime = format(new Date(appointment.startDateTime), 'h:mm a');

      const subject = `Appointment Reminder: ${appointment.title}`;
      const html = `...REMINDER-TEMPLATE...`;

      await sendEmail(appointment.userId, {
        to: recipients,
        subject,
        html
      });

      // Mark reminder as sent via UpdateCommand
      await ddbDocClient.send(new UpdateCommand({ TableName: apptTable, Key: { id: appointment.id }, UpdateExpression: 'SET reminderSent = :rs, reminderSentAt = :rsa', ExpressionAttributeValues: { ':rs': true, ':rsa': new Date().toISOString() } } as any));

      console.log(`Reminder sent for appointment ${appointment.id}`);
    } catch (error) {
      console.error(`Error sending reminder for appointment ${appointment.id}:`, error);
    }
  }

  return { sent: appointments.length };
}

