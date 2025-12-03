# ⚠️ URGENT: Set Environment Variables in Amplify Console

## Current Status
✅ Running on AWS Amplify (detected)  
❌ Server-side environment variables: **NOT SET**  
✅ Public variables: Available (NEXT_PUBLIC_SITE_URL)

## The Problem
Your app cannot connect to the database or authenticate users because server-side environment variables are missing.

## Solution: Set Variables in Amplify Console

### Step 1: Open Amplify Console
1. Go to: https://console.aws.amazon.com/amplify
2. Click on your app (ID: `d3ry622jxpwz6`)
3. In the left sidebar, click **"App settings"**
4. Click **"Environment variables"**

### Step 2: Check Branch Selection
**CRITICAL**: Look for one of these:
- A dropdown that says "All branches" or shows a branch name
- Tabs for different branches/environments
- A table with a "Branch" or "Environment" column

**Your branch is:** `fix-amplify-deploy`

**Action:**
- If you see a branch selector, select `fix-amplify-deploy`
- If you see "Apply to all branches", enable it
- If variables are in a table, check which branch they're set for

### Step 3: Add Each Variable

Click **"Add variable"** or **"Manage variables"** and add these **ONE BY ONE**:

#### Variable 1: DATABASE_URL
```
Key: DATABASE_URL
Value: postgres://bbe2e42e19dff62fe30b7dc49ade4c9d4aed1a0e40f0d9e7aeae0c6926939076:sk_0NXlA8O-TQFjlJpL0qoNo@db.prisma.io:5432/postgres?sslmode=require&pool=true
```
Click **Save**

#### Variable 2: NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: asy5i2xEWgFf1K1Kxphyfvl5gQfTtoAe
```
Click **Save**

#### Variable 3: NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com
```
Click **Save**

#### Variable 4: JWT_SECRET
```
Key: JWT_SECRET
Value: RdaLi9QbljTIRXGrZ3sY6NbP5DeKUCW9
```
Click **Save**

#### Variable 5: ENCRYPTION_KEY
```
Key: ENCRYPTION_KEY
Value: xoCYAeZXTg7THyBltBYtQSSqanNso3Zf
```
Click **Save**

#### Variable 6: CRON_SECRET
```
Key: CRON_SECRET
Value: 4f9c1b2d7e8a94f3c0b1d2e4f56789ab
```
Click **Save**

#### Variable 7: NODE_ENV
```
Key: NODE_ENV
Value: production
```
Click **Save**

### Step 4: Verify All Variables Are Listed
After adding all 7 variables, you should see a table/list showing:
- All 7 variables
- The branch/environment they're set for (should include `fix-amplify-deploy`)

### Step 5: REDEPLOY (MOST IMPORTANT!)

**⚠️ CRITICAL: Variables are ONLY loaded when a new deployment starts!**

1. In Amplify Console, click **"Deployments"** in the left sidebar
2. Find the **latest deployment** (top of the list)
3. Click the **three dots (⋯)** menu on that deployment
4. Click **"Redeploy this version"**
5. Confirm the redeploy
6. **Wait for deployment to complete** (5-10 minutes)

**DO NOT SKIP THIS STEP!** Even if variables are set, they won't be available until you redeploy.

### Step 6: Verify Variables Are Loaded

After deployment completes, visit:
```
https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com/api/env-check
```

**Expected Result:**
```json
{
  "required": {
    "DATABASE_URL": "SET (value hidden)",
    "NEXTAUTH_SECRET": "SET",
    "NEXTAUTH_URL": "https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com",
    "JWT_SECRET": "SET",
    "ENCRYPTION_KEY": "SET",
    "CRON_SECRET": "SET"
  },
  "summary": {
    "serverVarsAvailable": true
  }
}
```

## Troubleshooting

### Variables Still Not Showing After Redeploy

1. **Check build logs:**
   - Go to Deployments → Latest deployment → Build logs
   - Look for environment variable warnings
   - Check if variables are being loaded

2. **Verify branch:**
   - Make sure variables are set for `fix-amplify-deploy`
   - Check for typos in branch name

3. **Check variable names:**
   - Must be exact (case-sensitive)
   - `DATABASE_URL` not `database_url`
   - No extra spaces

4. **Try "Apply to all branches":**
   - If available, enable this option
   - This ensures variables work for all branches

### Can't Find Environment Variables Section

If you don't see "Environment variables" in App settings:
1. Make sure you're in the correct app
2. Check you have the right permissions
3. Try refreshing the page
4. Look for "Variables" or "Configuration" instead

## Quick Checklist

- [ ] Opened Amplify Console → App settings → Environment variables
- [ ] Selected branch `fix-amplify-deploy` (or "all branches")
- [ ] Added DATABASE_URL
- [ ] Added NEXTAUTH_SECRET
- [ ] Added NEXTAUTH_URL
- [ ] Added JWT_SECRET
- [ ] Added ENCRYPTION_KEY
- [ ] Added CRON_SECRET
- [ ] Added NODE_ENV
- [ ] Verified all 7 variables are listed
- [ ] **REDEPLOYED the app** (most important!)
- [ ] Checked `/api/env-check` - all show "SET"
- [ ] Tested login - should work now!

## After Variables Are Set

Once variables are loaded:
1. ✅ Database seeding will run automatically on next build
2. ✅ Default user will be created: `allan@pwp2026.com.au` / `123456`
3. ✅ Login will work immediately
4. ✅ Authentication will function properly

## Still Having Issues?

If after following all steps, variables are still not loading:

1. **Screenshot the Environment Variables page** in Amplify Console
2. **Check build logs** for any errors
3. **Verify you have admin/owner permissions** for the Amplify app
4. **Try setting variables via AWS CLI** (alternative method)

The diagnostic endpoint at `/api/env-check` will show exactly what's available at runtime.

