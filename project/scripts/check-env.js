const required = ['NODE_ENV', 'API_URL'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error('❌ Missing required env vars:', missing.join(', '));
  process.exit(1);
}

console.log('✔ environment check ok');

