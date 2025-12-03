# Step-by-Step: Setting Environment Variables in AWS Amplify

## Critical Issue

Your environment variables are **NOT being loaded at runtime**. This means they're either:
1. Not set in Amplify Console
2. Set for the wrong branch
3. App wasn't redeployed after setting them

## Step-by-Step Fix

### Step 1: Access Environment Variables

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click on your app (the one with ID `d3ry622jxpwz6`)
3. In the left sidebar, click **App settings**
4. Click **Environment variables**

### Step 2: Check Current Branch/Environment

**IMPORTANT**: Look for a dropdown or selector that shows which branch/environment you're configuring.

You should see something like:
- A dropdown showing "All branches" or a specific branch name
- Or tabs for different environments
- Or a list showing which branches have variables set

**Your branch is:** `fix-amplify-deploy`

### Step 3: Set Variables for Your Branch

**Option A: If you see a branch selector**

1. Select `fix-amplify-deploy` from the dropdown
2. Click **"Add variable"** or **"Manage variables"**
3. Add each variable one by one (see list below)

**Option B: If you see "Apply to all branches"**

1. Enable "Apply to all branches" if available
2. Add all variables (they'll apply to all branches including `fix-amplify-deploy`)

**Option C: If variables are shown in a table**

1. Look for a column showing which branches have variables
2. If `fix-amplify-deploy` is not listed, add variables and ensure it's selected

### Step 4: Add All Required Variables

Click **"Add variable"** and add each of these (one at a time):

#### Variable 1: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** `postgres://bbe2e42e19dff62fe30b7dc49ade4c9d4aed1a0e40f0d9e7aeae0c6926939076:sk_0NXlA8O-TQFjlJpL0qoNo@db.prisma.io:5432/postgres?sslmode=require&pool=true`
- Click **Save**

#### Variable 2: NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** `asy5i2xEWgFf1K1Kxphyfvl5gQfTtoAe`
- Click **Save**

#### Variable 3: NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com`
- Click **Save**

#### Variable 4: NEXT_PUBLIC_SITE_URL
- **Key:** `NEXT_PUBLIC_SITE_URL`
- **Value:** `https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com`
- Click **Save**

#### Variable 5: JWT_SECRET
- **Key:** `JWT_SECRET`
- **Value:** `RdaLi9QbljTIRXGrZ3sY6NbP5DeKUCW9`
- Click **Save**

#### Variable 6: ENCRYPTION_KEY
- **Key:** `ENCRYPTION_KEY`
- **Value:** `xoCYAeZXTg7THyBltBYtQSSqanNso3Zf`
- Click **Save**

#### Variable 7: CRON_SECRET
- **Key:** `CRON_SECRET`
- **Value:** `4f9c1b2d7e8a94f3c0b1d2e4f56789ab`
- Click **Save**

#### Variable 8: NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- Click **Save**

### Step 5: Verify Variables Are Set

After adding all variables, you should see a table/list showing:
- All 8 variables listed
- The branch/environment they're set for (should include `fix-amplify-deploy`)

### Step 6: REDEPLOY (CRITICAL!)

**⚠️ THIS IS THE MOST IMPORTANT STEP!**

Environment variables are **ONLY loaded when a new deployment starts**. You MUST redeploy:

1. In Amplify Console, go to **Deployments** (left sidebar)
2. Find the **latest deployment**
3. Click the **three dots (⋯)** or **"Redeploy this version"** button
4. Confirm the redeploy
5. **Wait for the deployment to complete** (this may take 5-10 minutes)

### Step 7: Verify Variables Are Loaded

After deployment completes, visit:
```
https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com/api/env-check
```

You should now see:
- All variables showing `"SET"` or `"SET (value hidden)"`
- `DATABASE_URL: "SET (value hidden)"`
- `NEXTAUTH_SECRET: "SET"`
- etc.

## Troubleshooting

### Variables Still Not Showing

If after redeploying, variables are still "NOT SET":

1. **Check build logs:**
   - Go to Deployments → Latest deployment → Build logs
   - Look for environment variable warnings
   - Check if variables are being loaded during build

2. **Verify branch name:**
   - Make sure you're setting variables for `fix-amplify-deploy`
   - Check if there's a typo in the branch name

3. **Check variable names:**
   - Ensure exact spelling (case-sensitive)
   - `DATABASE_URL` not `database_url` or `Database_Url`
   - No extra spaces before/after variable names

4. **Try setting for all branches:**
   - If available, enable "Apply to all branches"
   - This ensures variables work regardless of branch

### Alternative: Use AWS Systems Manager Parameter Store

If setting variables in the console doesn't work, you can use SSM Parameter Store:

1. Go to **AWS Systems Manager** → **Parameter Store**
2. Create parameters at: `/amplify/d3ry622jxpwz6/prod/DATABASE_URL`
   - Note: Use `prod` as environment name (not `fix-amplify-deploy` because it has hyphens)
3. Create all required parameters
4. Ensure Amplify service role has SSM permissions

## Quick Checklist

- [ ] Opened Amplify Console → App settings → Environment variables
- [ ] Selected correct branch (`fix-amplify-deploy`) or "all branches"
- [ ] Added all 8 required variables
- [ ] Verified variables are listed in the table
- [ ] **REDEPLOYED the app** (most important!)
- [ ] Checked `/api/env-check` endpoint - all variables show "SET"
- [ ] Tested login - should work now!

## After Variables Are Set

Once variables are loaded:

1. Database will be seeded automatically on next build
2. Default user will be created: `allan@pwp2026.com.au` / `123456`
3. Login should work immediately

## Still Need Help?

If variables are still not loading after following all steps:

1. Check the `/api/env-check` endpoint output
2. Share the output (it shows what's available)
3. Check Amplify build logs for any errors
4. Verify you have the correct permissions in AWS Amplify

