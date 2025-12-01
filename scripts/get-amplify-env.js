#!/usr/bin/env node

/**
 * Always output the correct Amplify environment name
 * This matches the real environment used by the Amplify app.
 */
const env = process.env.AMPLIFY_ENV || "pwp";
process.stdout.write(env);

