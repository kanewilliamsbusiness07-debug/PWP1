/**
 * Email Service
 * 
 * Handles sending emails using the account's integrated email provider
 */

import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { decryptField } from '@/lib/encryption';

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: EmailAttachment[];
}

/**
 * Get email transporter for a user's integrated email
 */
async function getEmailTransporter(userId: string) {
  const emailIntegration = await prisma.emailIntegration.findUnique({
    where: { userId }
  });

  if (!emailIntegration || !emailIntegration.isActive) {
    throw new Error('Email integration not configured or inactive');
  }

  // For OAuth providers (Gmail, Outlook)
  if (emailIntegration.provider === 'GMAIL' || emailIntegration.provider === 'OUTLOOK') {
    // OAuth implementation would go here
    // For now, fall back to SMTP
  }

  // For IMAP/SMTP
  if (emailIntegration.smtpHost && emailIntegration.smtpPort) {
    const password = emailIntegration.encryptedPassword
      ? decryptField(emailIntegration.encryptedPassword)
      : undefined;

    return nodemailer.createTransport({
      host: emailIntegration.smtpHost,
      port: emailIntegration.smtpPort,
      secure: emailIntegration.smtpPort === 465,
      auth: {
        user: emailIntegration.smtpUser || emailIntegration.email,
        pass: password
      }
    });
  }

  // Fallback to environment SMTP settings
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'apikey',
      pass: process.env.SMTP_PASSWORD
    }
  });
}

/**
 * Send email using user's integrated email
 */
export async function sendEmail(
  userId: string,
  options: EmailOptions
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emailIntegration: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const transporter = await getEmailTransporter(userId);
  const fromEmail = user.emailIntegration?.email || user.email || options.from || process.env.SMTP_FROM || 'noreply@aokperpetual.com';

  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  await transporter.sendMail({
    from: `"${user.name}" <${fromEmail}>`,
    to: recipients.join(', '),
    subject: options.subject,
    html: options.html,
    text: options.text || options.html?.replace(/<[^>]*>/g, ''),
    attachments: options.attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType
    }))
  });
}

/**
 * Send email with template and merge fields
 */
export async function sendTemplatedEmail(
  userId: string,
  templateName: string,
  mergeFields: Record<string, string>,
  to: string | string[]
): Promise<void> {
  const template = await prisma.emailTemplate.findFirst({
    where: {
      userId,
      name: templateName
    }
  });

  if (!template) {
    throw new Error(`Email template "${templateName}" not found`);
  }

  // Replace merge fields in subject and body
  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(mergeFields)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    body = body.replace(new RegExp(placeholder, 'g'), value);
  }

  await sendEmail(userId, {
    to,
    subject,
    html: body
  });
}

