/**
 * Email Service
 * 
 * Handles sending emails using the account's integrated email provider
 */

import nodemailer from 'nodemailer';
import { ddbDocClient } from '@/lib/aws/clients';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
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
  // Try to load email integration for this user from DynamoDB
  const emailIntegrationTable = process.env.DDB_EMAIL_INTEGRATIONS_TABLE;
  let emailIntegration: any = null;
  if (emailIntegrationTable) {
    try {
      const qRes: any = await ddbDocClient.send(new QueryCommand({ TableName: emailIntegrationTable, IndexName: 'userId-index', KeyConditionExpression: 'userId = :uid', ExpressionAttributeValues: { ':uid': userId } } as any));
      emailIntegration = (qRes.Items || [])[0] || null;
    } catch (err) { /* ignore and fallback to env */ }
  }

  // If user has an active email integration, use it
  if (emailIntegration && emailIntegration.isActive) {
    // For OAuth providers (Gmail, Outlook)
    if (emailIntegration.provider === 'GMAIL' || emailIntegration.provider === 'OUTLOOK') {
      // OAuth implementation would go here
      // For now, fall back to SMTP settings from integration
    }

    // For IMAP/SMTP from integration
    if (emailIntegration.smtpHost && emailIntegration.smtpPort) {
      const password = emailIntegration.encryptedPassword
        ? decryptField(emailIntegration.encryptedPassword)
        : undefined;

      return nodemailer.createTransport({
        host: emailIntegration.smtpHost,
        port: Number(emailIntegration.smtpPort),
        secure: Number(emailIntegration.smtpPort) === 465,
        auth: {
          user: emailIntegration.smtpUser || emailIntegration.email,
          pass: password
        }
      });
    }
  }

  // Fallback to environment SMTP settings (no database integration needed)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('Email not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.');
  }

  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
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
  // Load user profile from DynamoDB
  const usersTable = process.env.DDB_USERS_TABLE;
  let user: any = null;
  if (usersTable) {
    try {
      const g: any = await ddbDocClient.send(new GetCommand({ TableName: usersTable, Key: { id: userId } } as any));
      user = g.Item;
    } catch (err) {
      console.error('Error fetching user from DynamoDB:', err);
    }
  }

  if (!user) {
    throw new Error('User not found');
  }

  const transporter = await getEmailTransporter(userId);
  
  // Determine the from email: user integration > env var > default
  const fromEmail = user.email || process.env.SMTP_FROM || process.env.SMTP_USER || 'admin@pwp2026.com.au';
  const fromName = user.name || process.env.SMTP_FROM_NAME || 'Perpetual Wealth Partners';

  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
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
  // Load template from DynamoDB templates table
  const templatesTable = process.env.DDB_EMAIL_TEMPLATES_TABLE;
  let template: any = null;
  if (templatesTable) {
    try {
      // Try a query by userId + name index if available
      const qRes: any = await ddbDocClient.send(new QueryCommand({ TableName: templatesTable, IndexName: 'userId-name-index', KeyConditionExpression: 'userId = :uid and #name = :name', ExpressionAttributeValues: { ':uid': userId, ':name': templateName }, ExpressionAttributeNames: { '#name': 'name' } } as any));
      template = (qRes.Items || [])[0] || null;
    } catch (err) {
      // Fallback to a scan (inefficient but acceptable for small sets)
      console.warn('Template query failed, falling back to scan', err);
      const scanRes: any = await ddbDocClient.send({ TableName: templatesTable } as any);
      const candidates = (scanRes.Items || []).filter((t:any) => t.userId === userId && t.name === templateName);
      template = candidates[0] || null;
    }
  }

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

