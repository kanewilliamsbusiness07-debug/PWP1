#!/usr/bin/env node

/**
 * Environment variable validation script
 * Ensures all required environment variables are set before build
 */

const requiredAlways = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SITE_URL'
];

// Scan for additional env vars used in the codebase
const additionalRequired = [
  'NEXTAUTH_URL',
  'JWT_SECRET'
];

const requiredProduction = [
  'ENCRYPTION_KEY',
  'CRON_SECRET'
];

const isProduction = process.env.NODE_ENV === 'production' || 
                     Boolean(process.env.AMPLIFY_APP_ID) ||
                     Boolean(process.env.CODEBUILD_BUILD_ID);

const allRequired = isProduction 
  ? [...requiredAlways, ...additionalRequired, ...requiredProduction]
  : [...requiredAlways, ...additionalRequired];

const missing = allRequired.filter((key) => !process.env[key]);

if (missing.length > 0) {
  missing.forEach(key => {
    console.error(`Missing ENV: ${key}`);
  });
  process.exit(1);
}

console.log('✔ All required environment variables are set');
process.exit(0);
