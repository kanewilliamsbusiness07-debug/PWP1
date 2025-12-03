# Fix: DATABASE_URL Environment Variable Not Found

## Problem

You're seeing this error:
```
error: Environment variable not found: DATABASE_URL.
```

Even though you've set `DATABASE_URL` in Amplify Console.

## Root Cause

In AWS Amplify, environment variables are **branch-specific**. If your branch is `fix-amplify-deploy`, you need to ensure the environment variables are set for **that specific branch**.

## Solution

### Step 1: Verify Environment Variables Are Set for Your Branch

1. Go to **AWS Amplify Console** → Your App
2. Click on **App settings** → **Environment variables**
3. **IMPORTANT**: Check which branch/environment the variables are set for
4. If you see a dropdown or branch selector, make sure `fix-amplify-deploy` is selected
5. If variables are only set for `main` or `master`, you need to add them for `fix-amplify-deploy`

### Step 2: Set Environment Variables for Your Branch

**Option A: Set for Specific Branch**

1. In Amplify Console → App settings → Environment variables
2. Look for a branch/environment selector
3. Select `fix-amplify-deploy` (or your current branch)
4. Add all required variables:
   ```
   DATABASE_URL=postgres://bbe2e42e19dff62fe30b7dc49ade4c9d4aed1a0e40f0d9e7aeae0c6926939076:sk_0NXlA8O-TQFjlJpL0qoNo@db.prisma.io:5432/postgres?sslmode=require&pool=true
   NEXTAUTH_SECRET=asy5i2xEWgFf1K1Kxphyfvl5gQfTtoAe
   NEXTAUTH_URL=https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com
   NEXT_PUBLIC_SITE_URL=https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com
   JWT_SECRET=RdaLi9QbljTIRXGrZ3sY6NbP5DeKUCW9
   ENCRYPTION_KEY=xoCYAeZXTg7THyBltBYtQSSqanNso3Zf
   CRON_SECRET=4f9c1b2d7e8a94f3c0b1d2e4f56789ab
   NODE_ENV=production
   ```

**Option B: Set for All Branches**

1. In Amplify Console → App settings → Environment variables
2. Look for "Apply to all branches" or similar option
3. Enable it and add your variables
4. This will apply to all branches including `fix-amplify-deploy`

### Step 3: Redeploy After Setting Variables

**CRITICAL**: After adding/updating environment variables, you **MUST** redeploy:

1. Go to Amplify Console → Your App → **Deployments**
2. Click **Redeploy this version** on the latest deployment
3. OR trigger a new deployment by pushing a commit

**Environment variables are only loaded on new deployments!**

### Step 4: Verify Variables Are Loaded

After redeploying, visit:
```
https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com/api/auth/test-db
```

You should now see:
- `database.url: "SET (hidden)"` instead of `"NOT SET"`
- Database connection should succeed

## Alternative: Use AWS Systems Manager Parameter Store

If environment variables in the console aren't working, you can use SSM Parameter Store:

### Important: Environment Name Format

Your branch name `fix-amplify-deploy` contains hyphens, which **cannot be used** as an environment name in SSM.

**Solution**: Use a valid environment name like `prod` or `main`:

1. Go to **AWS Systems Manager** → **Parameter Store**
2. Create parameters with this path format:
   ```
   /amplify/d3ry622jxpwz6/prod/DATABASE_URL
   /amplify/d3ry622jxpwz6/prod/NEXTAUTH_SECRET
   /amplify/d3ry622jxpwz6/prod/NEXTAUTH_URL
   ... etc
   ```

3. **Note**: You'll need to map your branch to the environment name in Amplify settings

## Quick Checklist

- [ ] Environment variables are set in Amplify Console
- [ ] Variables are set for the correct branch (`fix-amplify-deploy`)
- [ ] All required variables are present (especially `DATABASE_URL`)
- [ ] App has been **redeployed** after setting variables
- [ ] Test endpoint shows `database.url: "SET (hidden)"`

## Still Not Working?

1. **Check Build Logs**: 
   - Go to Amplify Console → Deployments → Latest build
   - Look for environment variable warnings
   - Check if variables are being loaded

2. **Check Runtime Logs**:
   - Go to CloudWatch → Log groups
   - Find your Amplify app's log group
   - Look for `[PRISMA]` or `DATABASE_URL` messages

3. **Verify Variable Names**:
   - Ensure variable names match exactly (case-sensitive)
   - `DATABASE_URL` not `database_url` or `Database_Url`

4. **Try Setting in Build Settings**:
   - Sometimes variables need to be set in `amplify.yml` build settings
   - But this is not recommended for secrets

## Most Common Issue

**90% of the time**, the issue is that:
1. Variables are set for the wrong branch, OR
2. The app wasn't redeployed after setting variables

Make sure to **redeploy** after any environment variable changes!

