const { spawnSync } = require('child_process');

const skip = process.env.CI === 'true' || Boolean(process.env.AMPLIFY_APP_ID);

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

