#!/usr/bin/env node

/**
 * Environment variable validation script
 * Ensures all required environment variables are set before build
 * 
 * In Amplify, environment variables are injected at runtime, so this
 * script warns but doesn't fail the build in Amplify environments.
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

const isAmplify = Boolean(process.env.AMPLIFY_APP_ID) || Boolean(process.env.CODEBUILD_BUILD_ID);
const isProduction = process.env.NODE_ENV === 'production' || isAmplify;

const allRequired = isProduction 
  ? [...requiredAlways, ...additionalRequired, ...requiredProduction]
  : [...requiredAlways, ...additionalRequired];

const missing = allRequired.filter((key) => !process.env[key]);

if (missing.length > 0) {
  if (isAmplify) {
    // In Amplify, env vars are injected at runtime, so warn but don't fail
    console.warn('⚠️  Warning: The following environment variables are not set:');
    missing.forEach(key => console.warn(`   - ${key}`));
    console.warn('   These should be configured in AWS Amplify Console → App settings → Environment variables.');
    console.warn('   Build will continue, but the app may fail at runtime if these are not set.');
    process.exit(0); // Don't fail build in Amplify
  } else {
    // In local/CI environments, fail if required vars are missing
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`Missing ENV: ${key}`);
    });
    process.exit(1);
  }
} else {
  console.log('✔ All required environment variables are set');
  process.exit(0);
}
