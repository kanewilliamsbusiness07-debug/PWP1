#!/usr/bin/env node

/**
 * Environment variable validation script
 * Ensures all required environment variables are set before build
 */

const requiredAlways = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'JWT_SECRET'
];

const requiredProduction = [
  'ENCRYPTION_KEY',
  'CRON_SECRET'
];

const optionalButRecommended = [
  'NEXT_PUBLIC_SITE_URL'
];

const isProduction = process.env.NODE_ENV === 'production' || 
                     Boolean(process.env.AMPLIFY_APP_ID) ||
                     Boolean(process.env.CODEBUILD_BUILD_ID);

const missing = requiredAlways.filter((key) => !process.env[key]);
const missingProd = isProduction 
  ? requiredProduction.filter((key) => !process.env[key])
  : [];

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.error('\nAdd these variables in AWS Amplify → App settings → Environment variables.');
  process.exit(1);
}

if (missingProd.length > 0) {
  console.error('❌ Missing required production environment variables:');
  missingProd.forEach(key => console.error(`   - ${key}`));
  console.error('\nAdd these variables in AWS Amplify → App settings → Environment variables.');
  process.exit(1);
}

const missingOptional = optionalButRecommended.filter((key) => !process.env[key]);
if (missingOptional.length > 0) {
  console.warn('⚠️  Optional but recommended environment variables not set:');
  missingOptional.forEach(key => console.warn(`   - ${key}`));
}

console.log('✔ All required environment variables are set');
process.exit(0);

