#!/usr/bin/env node

/**
 * Determines the Amplify environment name from branch name or environment variables
 * Returns the branch name as-is for use with Amplify Console environment variables
 */

const branchName = process.env.AWS_BRANCH || process.env.GIT_BRANCH || 'main';
const amplifyEnv = process.env.AMPLIFY_ENV;

// If explicit environment is set, use it
if (amplifyEnv) {
  console.log(amplifyEnv);
  process.exit(0);
}

// Normalize branch name (remove refs/heads/ prefix if present)
const normalizedBranch = branchName.replace(/^refs\/heads\//, '');

// Use branch name directly - Amplify Console environment variables are keyed by branch
console.log(normalizedBranch);
process.exit(0);

