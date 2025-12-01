#!/usr/bin/env node

/**
 * Amplify derives its backend environment name from the Git branch. Branch
 * names containing slashes (e.g. feature/foo) or other special characters
 * cause the platform to fall back to a random environment and emit errors
 * such as "BackendEnvironment name ... is invalid". Surface a clear message
 * during the prebuild phase so the branch can be renamed before retrying.
 */
const branch =
  process.env.AWS_BRANCH ||
  process.env.AMPLIFY_BRANCH ||
  process.env.BRANCH ||
  '';

if (!branch) {
  console.log(
    '[check-amplify-env] No AWS branch information found; skipping validation.'
  );
  process.exit(0);
}

const validBranchPattern = /^[A-Za-z0-9-_]+$/;

if (!validBranchPattern.test(branch)) {
  console.error(
    `[check-amplify-env] The branch name "${branch}" contains characters that Amplify cannot map to a backend environment.\n` +
      'Please rename the branch to use only letters, numbers, hyphens, or underscores (e.g. "fix-amplify-deploy").'
  );
  process.exit(1);
}

console.log(
  `[check-amplify-env] Branch "${branch}" is compatible with Amplify backend environment naming rules.`
);

