# AWS Amplify Environment Variable Setup Guide

## Critical: SSM Path Issue Resolution

The logs show that Amplify is trying to load SSM secrets from:
```
/amplify/d3ry622jxpwz6/fix-amplify-deploy/
```

This happens because **Amplify automatically constructs SSM paths based on the branch name**.

## Solution: Use Amplify Console Environment Variables (Recommended)

Instead of using SSM Parameter Store, configure environment variables directly in the Amplify Console:

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

## Alternative: Fix SSM Path (If Using SSM)

If you must use SSM Parameter Store, you have two options:

### Option A: Rename Branch
Rename your branch from `fix-amplify-deploy` to `prod` or `main`. Amplify will then look for:
```
/amplify/d3ry622jxpwz6/prod/
```

### Option B: Create SSM Parameters at Branch-Specific Path
Create SSM parameters at the path Amplify expects:
```
/amplify/d3ry622jxpwz6/fix-amplify-deploy/DATABASE_URL
/amplify/d3ry622jxpwz6/fix-amplify-deploy/NEXTAUTH_SECRET
... (etc for all variables)
```

## Backend Environment Name Issue

The error "BackendEnvironment name fix-amplify-deploy for app d3ry622jxpwz6 is invalid" occurs because:
- Branch names with hyphens cannot be used as backend environment names
- Amplify generates random names (like "crissy") as fallback

**Solution:** This is a warning only. The build will continue. If you need a backend environment, configure it separately in Amplify Console.

## Verification

After setting environment variables, verify they're loaded:
1. Check build logs for "✔ All required environment variables are set"
2. If you see warnings, the variables will be injected at runtime by Amplify

