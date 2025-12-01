# AWS Amplify Environment Variable Setup Guide

## Overview

This guide explains how to configure environment variables for AWS Amplify deployments.

## Recommended: Use Amplify Console Environment Variables

The simplest and most reliable method is to configure environment variables directly in the Amplify Console.

### Steps:

1. Go to **AWS Amplify Console** → Your App → **App settings** → **Environment variables**

2. Add the following required variables:

```
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
NEXTAUTH_SECRET=your-32-character-secret-here
NEXTAUTH_URL=https://your-app-id.amplifyapp.com
NEXT_PUBLIC_SITE_URL=https://your-app-id.amplifyapp.com
JWT_SECRET=your-32-character-jwt-secret
ENCRYPTION_KEY=your-32-character-encryption-key
CRON_SECRET=your-cron-secret
NODE_ENV=production
AMPLIFY_HOSTING=true
```

3. **Generate secrets:**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate JWT_SECRET
   openssl rand -base64 32
   
   # Generate ENCRYPTION_KEY
   openssl rand -hex 32
   ```

## Using AWS Systems Manager Parameter Store

If you prefer to use SSM Parameter Store, follow these guidelines:

### Valid Environment Names

Amplify environment names **MUST** be:
- Lowercase only (a-z)
- Alphanumeric only (a-z, 0-9)
- **NO hyphens, underscores, or special characters**

Valid examples: `prod`, `dev`, `stage`, `main`, `master`

Invalid examples: `fix-amplify-deploy`, `dev-env`, `staging_1`

### SSM Parameter Path Format

SSM parameters should be created at:
```
/amplify/<AMPLIFY_APP_ID>/<ENV_NAME>/<KEY>
```

Where:
- `<AMPLIFY_APP_ID>` is your Amplify app ID (e.g., `d3ry622jxpwz6`)
- `<ENV_NAME>` is a valid environment name (e.g., `prod`)
- `<KEY>` is the environment variable name (e.g., `DATABASE_URL`)

### Example SSM Parameters

For app ID `d3ry622jxpwz6` and environment `prod`:

```
/amplify/d3ry622jxpwz6/prod/DATABASE_URL
/amplify/d3ry622jxpwz6/prod/NEXTAUTH_SECRET
/amplify/d3ry622jxpwz6/prod/NEXTAUTH_URL
/amplify/d3ry622jxpwz6/prod/NEXT_PUBLIC_SITE_URL
/amplify/d3ry622jxpwz6/prod/JWT_SECRET
/amplify/d3ry622jxpwz6/prod/ENCRYPTION_KEY
/amplify/d3ry622jxpwz6/prod/CRON_SECRET
```

### Creating SSM Parameters

1. Go to AWS Systems Manager → Parameter Store
2. Click "Create parameter"
3. Use the path format above
4. Set type to "SecureString" for sensitive values
5. Enter the parameter value
6. Ensure the Amplify service role has `ssm:GetParametersByPath` permission

### Important Notes

- **Branch names with hyphens cannot be used as environment names**
- If Amplify detects an invalid environment name, it will generate a random name (e.g., "crissy", "jada")
- To avoid this, use valid branch names (`main`, `master`, `prod`) or configure environment variables in the Amplify Console instead

## Verification

After setting environment variables:

1. Check build logs for: `✔ All required environment variables are set`
2. If you see warnings, the variables will be injected at runtime by Amplify
3. Verify runtime behavior by checking application logs in CloudWatch

## Troubleshooting

### "BackendEnvironment name ... is invalid"

This error occurs when:
- Branch name contains hyphens or special characters
- Branch name is used as an environment name

**Solution:**
- Use Amplify Console environment variables (recommended)
- Or rename branch to a valid name (lowercase, alphanumeric only)
- Or create SSM parameters using a valid environment name like `prod`

### SSM Parameters Not Found

If Amplify cannot find SSM parameters:
- Verify the path format matches: `/amplify/<APP_ID>/<ENV_NAME>/<KEY>`
- Ensure `<ENV_NAME>` is valid (lowercase, alphanumeric only)
- Check that the Amplify service role has SSM permissions
- Consider using Amplify Console environment variables instead
