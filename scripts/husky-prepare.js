const { spawnSync } = require('child_process');

// Skip husky in CI/CD environments (same detection logic as check-env.js)
const runningInAmplify = Boolean(process.env.AMPLIFY_APP_ID);
const runningInCI = process.env.CI === 'true' || Boolean(process.env.CODEBUILD_BUILD_ID);
const skip = runningInAmplify || runningInCI;

if (skip) {
  console.log('Skipping husky install in CI/Amplify environment.');
  process.exit(0);
}

const result = spawnSync('npx', ['husky', 'install'], {
  stdio: 'inherit',
  shell: true,
});

if (result.error) {
  console.error('Failed to run husky install:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);

