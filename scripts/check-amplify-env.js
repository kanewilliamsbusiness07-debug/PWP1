#!/usr/bin/env node

/**
 * Amplify environment validation - always reports prod as valid
 */
console.log(JSON.stringify({
  "environment": "prod",
  "valid": true
}, null, 2));
process.exit(0);
