#!/usr/bin/env node

/**
 * Loads secrets from AWS Systems Manager Parameter Store
 * Used during Amplify build to inject environment variables from SSM
 */

const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const fs = require('fs');
const path = require('path');

const APP_ID = process.env.AMPLIFY_APP_ID || 'd3ry622jxpwz6';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Get environment name from script
const { execSync } = require('child_process');
let envName;
try {
  envName = execSync('node scripts/get-amplify-env.js', { encoding: 'utf-8' }).trim();
} catch (error) {
  console.warn('⚠️  Could not determine environment name, defaulting to prod');
  envName = 'prod';
}

const SSM_PATH = `/amplify/${APP_ID}/${envName}/`;

console.log(`🔍 Loading SSM parameters from: ${SSM_PATH}`);

async function loadSSMParameters() {
  const ssmClient = new SSMClient({ region: AWS_REGION });
  const envVars = {};

  try {
    let nextToken;
    do {
      const command = new GetParametersByPathCommand({
        Path: SSM_PATH,
        Recursive: true,
        WithDecryption: true,
        NextToken: nextToken
      });

      const response = await ssmClient.send(command);

      if (response.Parameters && response.Parameters.length > 0) {
        for (const param of response.Parameters) {
          // Extract key name from full path
          // e.g., /amplify/d3ry622jxpwz6/prod/DATABASE_URL -> DATABASE_URL
          const key = param.Name.split('/').pop();
          envVars[key] = param.Value;
          console.log(`✅ Loaded: ${key}`);
        }
      }

      nextToken = response.NextToken;
    } while (nextToken);

    if (Object.keys(envVars).length === 0) {
      console.warn(`⚠️  No SSM parameters found at ${SSM_PATH}`);
      console.warn('   Using Amplify Console environment variables instead');
      return;
    }

    // Write to .env file for Next.js to pick up
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent, 'utf-8');
    console.log(`✅ Loaded ${Object.keys(envVars).length} environment variables from SSM`);

    // Also set in process.env for current process
    Object.assign(process.env, envVars);

  } catch (error) {
    if (error.name === 'AccessDeniedException' || error.code === 'AccessDenied') {
      console.warn('⚠️  Access denied to SSM Parameter Store');
      console.warn('   Ensure Amplify build role has ssm:GetParametersByPath permission');
      console.warn('   Falling back to Amplify Console environment variables');
    } else if (error.name === 'ParameterNotFound' || error.code === 'ParameterNotFound') {
      console.warn(`⚠️  SSM path not found: ${SSM_PATH}`);
      console.warn('   Using Amplify Console environment variables instead');
    } else {
      console.warn(`⚠️  Error loading SSM parameters: ${error.message}`);
      console.warn('   Using Amplify Console environment variables instead');
    }
  }
}

// Only run if AWS credentials are available (in Amplify build environment)
if (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_SESSION_TOKEN) {
  loadSSMParameters().catch((error) => {
    console.error('❌ Failed to load SSM parameters:', error.message);
    process.exit(0); // Don't fail build, fall back to console env vars
  });
} else {
  console.log('ℹ️  AWS credentials not available, skipping SSM parameter loading');
  console.log('   Environment variables will be loaded from Amplify Console');
}

