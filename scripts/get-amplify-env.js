#!/usr/bin/env node

/**
 * Determines the Amplify environment name from branch name or environment variables
 * Maps invalid branch names (with hyphens) to valid environment names
 */

const branchName = process.env.AWS_BRANCH || process.env.GIT_BRANCH || 'main';
const amplifyEnv = process.env.AMPLIFY_ENV;

// Map invalid branch names to valid environment names
const branchToEnvMap = {
  'fix-amplify-deploy': 'fixamplifydeploy',
  'dev-env': 'dev',
  'staging-1': 'stage',
  'staging_1': 'stage',
  'main': 'prod',
  'master': 'prod',
  'production': 'prod',
  'develop': 'dev',
  'development': 'dev'
};

// If explicit environment is set, use it
if (amplifyEnv) {
  console.log(amplifyEnv);
  process.exit(0);
}

// Normalize branch name (remove refs/heads/ prefix if present)
const normalizedBranch = branchName.replace(/^refs\/heads\//, '').toLowerCase();

// Check if branch maps to a known environment
if (branchToEnvMap[normalizedBranch]) {
  console.log(branchToEnvMap[normalizedBranch]);
  process.exit(0);
}

// If branch name is already valid (lowercase alphanumeric), use it
if (/^[a-z0-9]+$/.test(normalizedBranch)) {
  console.log(normalizedBranch);
  process.exit(0);
}

// Default to prod for unknown branches
console.log('prod');
process.exit(0);

