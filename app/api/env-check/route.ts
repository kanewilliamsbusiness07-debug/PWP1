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
  const sensitiveKeys = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'JWT_SECRET', 'ENCRYPTION_KEY', 'CRON_SECRET', 'SMTP_PASSWORD'];
  
  Object.keys(allEnvVars).forEach(key => {
    if (key.includes('DATABASE') || 
        key.includes('NEXTAUTH') || 
        key.includes('JWT') || 
        key.includes('ENCRYPTION') || 
        key.includes('CRON') ||
        key.includes('NODE') ||
        key.includes('AMPLIFY') ||
        key.includes('NEXT') ||
        key.includes('SMTP')) {
      if (sensitiveKeys.includes(key)) {
        relevantVars[key] = allEnvVars[key] ? 'SET (value hidden)' : 'NOT SET';
      } else {
        relevantVars[key] = allEnvVars[key] || 'NOT SET';
      }
    }
  });

  // Check Amplify-specific environment variables
  // AWS_AMPLIFY_DEPLOYMENT_ID is set when running on Amplify
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

  return NextResponse.json({
    success: true,
    summary: {
      totalEnvironmentVariables: totalEnvVars,
      isAmplify: isRunningOnAmplify,
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      publicVarsAvailable: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      serverVarsAvailable: Boolean(process.env.DATABASE_URL),
      diagnosis: !process.env.DATABASE_URL 
        ? 'Server-side environment variables are NOT SET. Only NEXT_PUBLIC_* variables are available, which means server-side variables need to be configured in Amplify Console.'
        : 'Environment variables appear to be configured correctly.',
    },
    amplify: amplifyVars,
    required: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (value hidden)' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'SET' : 'NOT SET',
      CRON_SECRET: process.env.CRON_SECRET ? 'SET' : 'NOT SET',
    },
    allRelevant: relevantVars,
    troubleshooting: {
      issue: process.env.DATABASE_URL 
        ? 'Environment variables appear to be set correctly' 
        : 'CRITICAL: Server-side environment variables are NOT SET. Only NEXT_PUBLIC_SITE_URL is available, which means server-side variables (DATABASE_URL, NEXTAUTH_SECRET, etc.) are missing.',
      currentStatus: {
        publicVariables: 'Available (NEXT_PUBLIC_SITE_URL is set)',
        serverVariables: 'MISSING (DATABASE_URL, NEXTAUTH_SECRET, etc. are not set)',
        explanation: 'NEXT_PUBLIC_* variables are embedded at build time and available to both client and server. Server-side variables must be set in Amplify Console and are only available at runtime after redeployment.'
      },
      steps: [
        '1. Go to AWS Amplify Console → Your App → App settings → Environment variables',
        '2. Click "Manage variables" or "Add variable"',
        '3. IMPORTANT: Look for a branch/environment selector - ensure "fix-amplify-deploy" is selected',
        '4. Add ALL server-side variables (see list below)',
        '5. After adding ALL variables, click "Save"',
        '6. CRITICAL: Go to Deployments → Click "Redeploy this version" on latest deployment',
        '7. Wait for deployment to complete (5-10 minutes)',
        '8. Check this endpoint again - all variables should show "SET"',
      ],
      requiredVariables: [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'JWT_SECRET',
        'ENCRYPTION_KEY',
        'CRON_SECRET',
        'NODE_ENV=production'
      ],
      note: 'Environment variables are ONLY loaded when a new deployment starts. You MUST redeploy after adding/updating variables. The fact that NEXT_PUBLIC_SITE_URL is set but server variables are not suggests they were not configured in Amplify Console or the app was not redeployed after setting them.'
    }
  });
}

