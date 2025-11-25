/**
 * Appointment Reminder System
 * 
 * Sends automated appointment reminders to both client and account email
 */

import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email/email-service';
import { format } from 'date-fns';

/**
 * Send appointment reminders for upcoming appointments
 * Should be called by a cron job or scheduled task
 */
export async function sendAppointmentReminders() {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

  // Find appointments that need reminders
  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'SCHEDULED',
      reminderSent: false,
      startDateTime: {
        gte: now,
        lte: reminderWindow
      }
    },
    include: {
      client: true,
      user: true
    }
  });

  for (const appointment of appointments) {
    try {
      const recipients: string[] = [];

      // Add client email if available
      if (appointment.client.email) {
        recipients.push(appointment.client.email);
      }

      // Add account email
      recipients.push(appointment.user.email);

      if (recipients.length === 0) {
        console.warn(`No email recipients for appointment ${appointment.id}`);
        continue;
      }

      const formattedDate = format(appointment.startDateTime, 'EEEE, MMMM d, yyyy');
      const formattedTime = format(appointment.startDateTime, 'h:mm a');

      const subject = `Appointment Reminder: ${appointment.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Reminder</h2>
          <p>This is a reminder for your upcoming appointment:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Title:</strong> ${appointment.title}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            ${appointment.description ? `<p><strong>Description:</strong> ${appointment.description}</p>` : ''}
            ${appointment.client ? `<p><strong>Client:</strong> ${appointment.client.firstName} ${appointment.client.lastName}</p>` : ''}
          </div>
          ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
        </div>
      `;

      await sendEmail(appointment.userId, {
        to: recipients,
        subject,
        html
      });

      // Mark reminder as sent
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          reminderSent: true,
          reminderSentAt: new Date()
        }
      });

      console.log(`Reminder sent for appointment ${appointment.id}`);
    } catch (error) {
      console.error(`Error sending reminder for appointment ${appointment.id}:`, error);
    }
  }

  return { sent: appointments.length };
}

