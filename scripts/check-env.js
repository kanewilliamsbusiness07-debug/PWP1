const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const envFileExists = fs.existsSync(path.join(projectRoot, '.env'));
const runningInAmplify = Boolean(process.env.AMPLIFY_APP_ID);
const runningInCI = process.env.CI === 'true' || Boolean(process.env.CODEBUILD_BUILD_ID);
const productionLike = runningInAmplify || runningInCI || process.env.NODE_ENV === 'production';

if (!envFileExists && !productionLike) {
  console.warn('⚠️  No .env file detected. Copy .env.example -> .env to enable local credentials.');
  process.exit(0);
}

const requiredAlways = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'JWT_SECRET'];
const requiredProdOnly = ['ENCRYPTION_KEY', 'CRON_SECRET'];

const missing = requiredAlways.filter((key) => !process.env[key]);
const missingProd = productionLike
  ? requiredProdOnly.filter((key) => !process.env[key])
  : [];

if (missing.length || missingProd.length) {
  const messages = [];
  if (missing.length) {
    messages.push(`Missing required env vars: ${missing.join(', ')}`);
  }
  if (missingProd.length) {
    messages.push(`Missing production env vars: ${missingProd.join(', ')}`);
  }
  console.error(`❌ ${messages.join(' | ')}`);
  process.exit(1);
}

const smtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
const missingSmtp = smtpKeys.filter((key) => !process.env[key]);
if (missingSmtp.length) {
  console.warn(`⚠️  SMTP fallback is not fully configured (${missingSmtp.join(', ')}). Emails will only work for users who set up their own integration.`);
}

if (!process.env.ENCRYPTION_KEY && !productionLike) {
  console.warn('⚠️  ENCRYPTION_KEY is not set. Development builds will generate a transient key, but production must define one.');
}

console.log('✔ environment check ok');
