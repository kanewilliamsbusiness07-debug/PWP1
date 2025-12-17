/**
 * Migration helper: Copy selected legacy database models into DynamoDB and S3 keys.
 * This script optionally uses a Prisma client when present to read legacy Postgres data;
 * if Prisma is not available it becomes a no-op for the Prisma-backed sources.
 *
 * Usage examples:
 *  - Dry-run migrate PDFs and clients only:
 *      node scripts/migrate-prisma-to-dynamodb.js --dry-run --models=pdfs,clients
 *  - Full migrate all supported models:
 *      node scripts/migrate-prisma-to-dynamodb.js --models=all
 *
 * The script will not overwrite existing DynamoDB items (idempotent by id) unless --force is passed.
 */
const path = require('path');
const fs = require('fs');
const { PutCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { PrismaClient } = (() => {
  try { return require('@prisma/client'); } catch (e) { return null; }
})();

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const ddbClient = new DynamoDBClient({ region });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const argv = process.argv.slice(2);
const args = {
  dryRun: argv.includes('--dry-run'),
  force: argv.includes('--force'),
  models: null
};
for (const a of argv) {
  if (a.startsWith('--models=')) {
    args.models = a.split('=')[1].split(',').map(s => s.trim());
  }
}
if (!args.models) args.models = ['pdfs', 'clients', 'users', 'templates', 'emailIntegrations', 'appointments', 'recentAccess'];

async function migrate() {
  const prisma = PrismaClient ? new PrismaClient() : null;
  const report = { migrated: {}, skipped: {}, errors: [] };

  const bucket = process.env.AWS_S3_BUCKET;
  const pdfTable = process.env.DDB_PDF_EXPORTS_TABLE;
  const clientTable = process.env.DDB_CLIENTS_TABLE;
  const usersTable = process.env.DDB_USERS_TABLE;
  const templatesTable = process.env.DDB_EMAIL_TEMPLATES_TABLE;
  const integrationsTable = process.env.DDB_EMAIL_INTEGRATIONS_TABLE;
  const apptTable = process.env.DDB_APPOINTMENTS_TABLE;
  const recentTable = process.env.DDB_RECENT_CLIENT_ACCESS_TABLE;

  console.log('Migration started', { dryRun: args.dryRun, force: args.force, models: args.models });

  try {
    // PDFs
    if (args.models.includes('pdfs')) {
      report.migrated.pdfs = 0; report.skipped.pdfs = 0;
      if (!prisma) {
        console.warn('Prisma client not available; skipping PDF export migration');
      } else if (!pdfTable) {
        console.warn('DDB_PDF_EXPORTS_TABLE not configured; skipping PDFs');
      } else {
        const exports = await prisma.pdfExport.findMany();
        for (const e of exports) {
          try {
            // Check if exists
            const exists = await ddbDocClient.send(new GetCommand({ TableName: pdfTable, Key: { id: e.id } }));
            if (exists && exists.Item && !args.force) {
              report.skipped.pdfs++;
              if (args.dryRun) console.log('[DRY] Would skip existing PDF', e.id);
              continue;
            }

            const item = {
              id: e.id,
              userId: e.userId,
              clientId: e.clientId || null,
              fileName: e.fileName,
              s3Key: e.s3Key || null,
              fileSize: e.fileSize,
              mimeType: e.mimeType,
              createdAt: e.createdAt.toISOString()
            };

            // Upload local file to S3 if present
            if (e.filePath && e.filePath.startsWith('/uploads')) {
              const candidatePath = path.join(process.cwd(), e.filePath);
              if (fs.existsSync(candidatePath)) {
                const buffer = fs.readFileSync(candidatePath);
                const s3Key = `pdfs/${e.userId}/${path.basename(candidatePath)}`;
                if (!args.dryRun) {
                  await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: s3Key, Body: buffer, ContentType: e.mimeType || 'application/pdf' }));
                } else {
                  console.log('[DRY] Would upload', candidatePath, 'to S3 key', s3Key);
                }
                item.s3Key = s3Key;
              }
            }

            if (!args.dryRun) {
              await ddbDocClient.send(new PutCommand({ TableName: pdfTable, Item: item }));
            }
            report.migrated.pdfs++;
            console.log('Migrated PDF export', e.id);
          } catch (err) {
            report.errors.push({ model: 'pdfs', id: e.id, error: String(err) });
          }
        }
      }
    }

    // Clients
    if (args.models.includes('clients')) {
      report.migrated.clients = 0; report.skipped.clients = 0;
      if (!prisma) {
        console.warn('Prisma client not available; skipping clients migration');
      } else if (!clientTable) {
        console.warn('DDB_CLIENTS_TABLE not configured; skipping clients');
      } else {
        const clients = await prisma.client.findMany();
        for (const c of clients) {
          try {
            const exists = await ddbDocClient.send(new GetCommand({ TableName: clientTable, Key: { id: c.id } }));
            if (exists && exists.Item && !args.force) {
              report.skipped.clients++;
              if (args.dryRun) console.log('[DRY] Would skip existing client', c.id);
              continue;
            }
            const item = { id: c.id, userId: c.userId, firstName: c.firstName, lastName: c.lastName, email: c.email, createdAt: c.createdAt.toISOString() };
            if (!args.dryRun) await ddbDocClient.send(new PutCommand({ TableName: clientTable, Item: item }));
            report.migrated.clients++;
            console.log('Migrated client', c.id);
          } catch (err) {
            report.errors.push({ model: 'clients', id: c.id, error: String(err) });
          }
        }
      }
    }

    // Users
    if (args.models.includes('users')) {
      report.migrated.users = 0; report.skipped.users = 0;
      if (!prisma) {
        console.warn('Prisma client not available; skipping users migration');
      } else if (!usersTable) {
        console.warn('DDB_USERS_TABLE not configured; skipping users');
      } else {
        const users = await prisma.user.findMany();
        for (const u of users) {
          try {
            const exists = await ddbDocClient.send(new GetCommand({ TableName: usersTable, Key: { id: u.id } }));
            if (exists && exists.Item && !args.force) { report.skipped.users++; if (args.dryRun) console.log('[DRY] Would skip user', u.id); continue; }
            const item = { id: u.id, email: u.email, name: u.name, isActive: u.isActive, role: u.role, createdAt: u.createdAt.toISOString() };
            if (!args.dryRun) await ddbDocClient.send(new PutCommand({ TableName: usersTable, Item: item }));
            report.migrated.users++;
            console.log('Migrated user', u.id);
          } catch (err) { report.errors.push({ model: 'users', id: u.id, error: String(err) }); }
        }
      }
    }

    // Email templates
    if (args.models.includes('templates')) {
      report.migrated.templates = 0; report.skipped.templates = 0;
      if (!prisma) console.warn('Prisma client not available; skipping templates migration');
      else if (!templatesTable) console.warn('DDB_EMAIL_TEMPLATES_TABLE not configured; skipping templates');
      else {
        const templates = await prisma.emailTemplate.findMany();
        for (const t of templates) {
          try {
            const exists = await ddbDocClient.send(new GetCommand({ TableName: templatesTable, Key: { id: t.id } }));
            if (exists && exists.Item && !args.force) { report.skipped.templates++; if (args.dryRun) console.log('[DRY] Would skip template', t.id); continue; }
            const item = { id: t.id, userId: t.userId, name: t.name, subject: t.subject, body: t.body, createdAt: t.createdAt.toISOString() };
            if (!args.dryRun) await ddbDocClient.send(new PutCommand({ TableName: templatesTable, Item: item }));
            report.migrated.templates++;
            console.log('Migrated template', t.id);
          } catch (err) { report.errors.push({ model: 'templates', id: t.id, error: String(err) }); }
        }
      }
    }

    // Email integrations
    if (args.models.includes('emailIntegrations')) {
      report.migrated.emailIntegrations = 0; report.skipped.emailIntegrations = 0;
      if (!prisma) console.warn('Prisma client not available; skipping email integrations migration');
      else if (!integrationsTable) console.warn('DDB_EMAIL_INTEGRATIONS_TABLE not configured; skipping email integrations');
      else {
        const integrations = await prisma.emailIntegration.findMany();
        for (const it of integrations) {
          try {
            const exists = await ddbDocClient.send(new GetCommand({ TableName: integrationsTable, Key: { id: it.id } }));
            if (exists && exists.Item && !args.force) { report.skipped.emailIntegrations++; if (args.dryRun) console.log('[DRY] Would skip integration', it.id); continue; }
            const item = { id: it.id, userId: it.userId, provider: it.provider, email: it.email, encryptedPassword: it.encryptedPassword, smtpHost: it.smtpHost, smtpPort: it.smtpPort, smtpUser: it.smtpUser, imapHost: it.imapHost, imapPort: it.imapPort, imapUser: it.imapUser, isActive: it.isActive, lastSyncAt: it.lastSyncAt ? it.lastSyncAt.toISOString() : null };
            if (!args.dryRun) await ddbDocClient.send(new PutCommand({ TableName: integrationsTable, Item: item }));
            report.migrated.emailIntegrations++;
            console.log('Migrated email integration', it.id);
          } catch (err) { report.errors.push({ model: 'emailIntegrations', id: it.id, error: String(err) }); }
        }
      }
    }

    // Appointments
    if (args.models.includes('appointments')) {
      report.migrated.appointments = 0; report.skipped.appointments = 0;
      if (!prisma) console.warn('Prisma client not available; skipping appointments migration');
      else if (!apptTable) console.warn('DDB_APPOINTMENTS_TABLE not configured; skipping appointments');
      else {
        const appts = await prisma.appointment.findMany();
        for (const a of appts) {
          try {
            const exists = await ddbDocClient.send(new GetCommand({ TableName: apptTable, Key: { id: a.id } }));
            if (exists && exists.Item && !args.force) { report.skipped.appointments++; if (args.dryRun) console.log('[DRY] Would skip appointment', a.id); continue; }
            const item = { id: a.id, userId: a.userId, clientId: a.clientId, title: a.title, description: a.description, startDateTime: a.startDateTime.toISOString(), endDateTime: a.endDateTime.toISOString(), status: a.status, notes: a.notes || null, reminderSent: a.reminderSent || false, createdAt: a.createdAt.toISOString() };
            if (!args.dryRun) await ddbDocClient.send(new PutCommand({ TableName: apptTable, Item: item }));
            report.migrated.appointments++;
            console.log('Migrated appointment', a.id);
          } catch (err) { report.errors.push({ model: 'appointments', id: a.id, error: String(err) }); }
        }
      }
    }

    // Recent access (simple migration)
    if (args.models.includes('recentAccess')) {
      report.migrated.recentAccess = 0; report.skipped.recentAccess = 0;
      if (!prisma) console.warn('Prisma client not available; skipping recent access migration');
      else if (!recentTable) console.warn('DDB_RECENT_CLIENT_ACCESS_TABLE not configured; skipping recent access');
      else {
        const ra = await prisma.recentClientAccess.findMany();
        for (const r of ra) {
          try {
            const key = { userId: r.userId, clientId: r.clientId };
            const exists = await ddbDocClient.send(new GetCommand({ TableName: recentTable, Key: key }));
            if (exists && exists.Item && !args.force) { report.skipped.recentAccess++; if (args.dryRun) console.log('[DRY] Would skip recent access', key); continue; }
            const item = { userId: r.userId, clientId: r.clientId, accessedAt: r.accessedAt.toISOString() };
            if (!args.dryRun) await ddbDocClient.send(new PutCommand({ TableName: recentTable, Item: item }));
            report.migrated.recentAccess++;
            console.log('Migrated recent access', `${r.userId}-${r.clientId}`);
          } catch (err) { report.errors.push({ model: 'recentAccess', id: `${r.userId}-${r.clientId}`, error: String(err) }); }
        }
      }
    }

    // Write a summary report
    const outPath = path.join(process.cwd(), 'tmp', `migration-report-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(outPath))) fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log('Migration summary written to', outPath);

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed', err);
    report.errors.push({ error: String(err) });
    const outPath = path.join(process.cwd(), 'tmp', `migration-report-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

migrate().catch(err => { console.error('Unhandled migration error', err); process.exit(1); });
