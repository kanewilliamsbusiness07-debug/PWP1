/**
 * Environment Variables Diagnostic Endpoint
 * Shows all environment variables available at runtime
 * Access: GET /api/env-check
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Get all environment variables
  const allEnvVars = process.env;
  
  // Filter to show only relevant ones (hide sensitive values)
  const relevantVars: Record<string, string> = {};
  const sensitiveKeys = ['AWS_S3_BUCKET', 'NEXTAUTH_SECRET', 'JWT_SECRET', 'ENCRYPTION_KEY', 'CRON_SECRET', 'SMTP_PASSWORD'];
  
  Object.keys(allEnvVars).forEach(key => {
    if (key.includes('AWS') || 
        key.includes('NEXTAUTH') || 
        key.includes('JWT') || 
        key.includes('ENCRYPTION') || 
        key.includes('CRON') ||
        key.includes('NODE') ||
        key.includes('AMPLIFY') ||
        key.includes('NEXT') ||
        key.includes('SMTP') ||
        key.includes('DDB')) {
      if (sensitiveKeys.includes(key)) {
        relevantVars[key] = allEnvVars[key] ? 'SET (value hidden)' : 'NOT SET';
      } else {
        relevantVars[key] = allEnvVars[key] || 'NOT SET';
      }
    }
  });

  // Check Amplify-specific environment variables
  const isRunningOnAmplify = Boolean(process.env.AWS_AMPLIFY_DEPLOYMENT_ID || process.env.AMPLIFY_APP_ID || process.env.CODEBUILD_BUILD_ID);
  
  const amplifyVars = {
    AWS_AMPLIFY_DEPLOYMENT_ID: process.env.AWS_AMPLIFY_DEPLOYMENT_ID || 'NOT SET',
    AMPLIFY_APP_ID: process.env.AMPLIFY_APP_ID || 'NOT SET',
    AMPLIFY_BRANCH: process.env.AMPLIFY_BRANCH || 'NOT SET',
    AMPLIFY_ENV: process.env.AMPLIFY_ENV || 'NOT SET',
    CODEBUILD_BUILD_ID: process.env.CODEBUILD_BUILD_ID ? 'SET' : 'NOT SET',
  };

  // Count total environment variables
  const totalEnvVars = Object.keys(allEnvVars).length;

  const s3Bucket = process.env.AWS_S3_BUCKET || process.env.APP_AWS_S3_BUCKET || process.env.S3_BUCKET;
  const regionVal = process.env.AWS_REGION || process.env.APP_AWS_REGION || process.env.REGION || 'NOT SET';

  const serverReady = Boolean(s3Bucket && process.env.DDB_CLIENTS_TABLE);

  return NextResponse.json({
    success: true,
    summary: {
      totalEnvironmentVariables: totalEnvVars,
      isAmplify: isRunningOnAmplify,
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      publicVarsAvailable: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      serverVarsAvailable: serverReady,
      diagnosis: !serverReady 
        ? 'Server-side environment variables are NOT SET or storage tables are missing. Ensure S3_BUCKET and DDB_* variables are configured and that DynamoDB/S3 are provisioned.'
        : 'Environment variables and storage configuration appear to be correct.',
    },
    amplify: amplifyVars,
    required: {
      AWS_REGION: regionVal,
      AWS_S3_BUCKET: s3Bucket ? 'SET (value hidden)' : 'NOT SET',
      APP_AWS_S3_BUCKET: process.env.APP_AWS_S3_BUCKET ? 'SET (value hidden)' : 'NOT SET',
      DDB_CLIENTS_TABLE: process.env.DDB_CLIENTS_TABLE || 'NOT SET',
      DDB_PDF_EXPORTS_TABLE: process.env.DDB_PDF_EXPORTS_TABLE || 'NOT SET',
      DDB_USERS_TABLE: process.env.DDB_USERS_TABLE || 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'SET' : 'NOT SET',
      CRON_SECRET: process.env.CRON_SECRET ? 'SET' : 'NOT SET',
    },
    allRelevant: relevantVars,
    troubleshooting: {
      issue: serverReady 
        ? 'Environment variables appear to be set correctly' 
        : 'CRITICAL: Server-side environment variables or storage tables are not configured. Check AWS_S3_BUCKET and DDB_* variables and ensure infrastructure is provisioned.',
      currentStatus: {
        publicVariables: 'Available (NEXT_PUBLIC_SITE_URL is set)',
        serverVariables: serverReady ? 'Available' : 'MISSING (AWS_S3_BUCKET or DDB_* not set)',
        explanation: 'NEXT_PUBLIC_* variables are embedded at build time and are often available; server-side variables and storage configuration must be set in Amplify Console and infrastructure must be provisioned.'
      },
      steps: [
        '1. Go to AWS Amplify Console → Your App → App settings → Environment variables',
        '2. Click "Manage variables" or "Add variable"',
        '3. IMPORTANT: Look for a branch/environment selector - ensure the correct branch is selected',
        '4. Add ALL server-side variables (see list below)',
        '5. After adding ALL variables, click "Save"',
        '6. Ensure DynamoDB tables and S3 bucket are provisioned (deploy CloudFormation or run `amplify push`)',
        '7. CRITICAL: Go to Deployments → Click "Redeploy this version" on latest deployment',
        '8. Wait for deployment to complete (5-10 minutes)',
        '9. Check this endpoint again - all variables should show "SET"',
      ],
      requiredVariables: [
        'AWS_REGION',
        'APP_AWS_REGION',
        'AWS_S3_BUCKET',
        'APP_AWS_S3_BUCKET',
        'DDB_CLIENTS_TABLE',
        'DDB_PDF_EXPORTS_TABLE',
        'DDB_USERS_TABLE',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'JWT_SECRET',
        'ENCRYPTION_KEY',
        'CRON_SECRET'
      ],
      note: 'Environment variables are ONLY loaded when a new deployment starts. You MUST redeploy after adding/updating variables. The fact that NEXT_PUBLIC_SITE_URL is set but server variables are not suggests they were not configured in Amplify Console or the app was not redeployed after setting them.'
    }
  });
}

