# How to Redeploy Your Amplify App

## Why Redeploy?

Environment variables are **ONLY loaded when a new deployment starts**. Even though you've set them in Amplify Console, they won't be available until you redeploy.

## Step-by-Step: Redeploy

### Method 1: Redeploy from Amplify Console (Recommended)

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify
   - Click on your app (ID: `d3ry622jxpwz6`)

2. **Open Deployments**
   - In the left sidebar, click **"Deployments"**
   - You'll see a list of all deployments

3. **Find Latest Deployment**
   - Look for the most recent deployment (usually at the top)
   - It should show status "Succeeded" or "In progress"

4. **Redeploy**
   - Click the **three dots (⋯)** menu on the latest deployment
   - OR look for a **"Redeploy this version"** button
   - Click it and confirm

5. **Wait for Deployment**
   - Deployment will start automatically
   - This takes 5-10 minutes
   - You can watch the progress in real-time

### Method 2: Trigger via Git Push

If your app is connected to GitHub:

1. Make a small change to any file (or just add a comment)
2. Commit and push to your branch (`fix-amplify-deploy`)
3. Amplify will automatically trigger a new deployment

## Verify Deployment Started

After clicking "Redeploy", you should see:
- A new deployment appears in the list
- Status shows "In progress" or "Provisioning"
- Build logs start appearing

## After Deployment Completes

### Step 1: Check Build Logs

1. Click on the new deployment
2. Click **"Build logs"** or **"View logs"**
3. Look for:
   - ✅ Environment variables being loaded
   - ✅ Seed script running (`npm run seed:dynamodb`) if configured
   - ✅ Build completing successfully

### Step 2: Verify Environment Variables

Visit this URL:
```
https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com/api/env-check
```

**You should see:**
```json
{
  "required": {
    "AWS_REGION": "SET",
    "AWS_S3_BUCKET": "SET",
    "DDB_CLIENTS_TABLE": "SET",
    "DDB_PDF_EXPORTS_TABLE": "SET",
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

### Step 3: Test Database Connection

Visit:
```
https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com/api/auth/test-db
```

**You should see:**
- `"success": true`
- `"database": { "connected": true }`
- User count or user details

### Step 4: Test Login

1. Go to: `https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com/auth/login`
2. Login with:
   - Email: `allan@pwp2026.com.au`
   - Password: `123456`
3. Login should work!

## Troubleshooting

### Deployment Fails

If deployment fails:
1. Check build logs for errors
2. Look for environment variable warnings
3. Verify all variables are set correctly in Amplify Console
4. Check that variable names are exact (case-sensitive)

### Variables Still Not Showing

If after redeploy, variables still show "NOT SET":
1. **Double-check Amplify Console:**
   - Go back to App settings → Environment variables
   - Verify all 7 variables are listed
   - Check they're set for the correct branch

2. **Check build logs:**
   - Look for any warnings about environment variables
   - Check if variables are being loaded during build

3. **Try redeploying again:**
   - Sometimes a second redeploy is needed
   - Make sure deployment fully completes

### Build Logs Show Warnings

If you see warnings about storage env vars (e.g., `AWS_S3_BUCKET`, `DDB_*`) not set in build logs:
- This can be expected during build time
- Variables are injected at runtime; verify them via the `/api/env-check` endpoint after deployment
- Ensure infra (DynamoDB & S3) is provisioned and variables are set in Amplify Console

## Expected Timeline

- **Redeploy trigger:** Immediate
- **Build phase:** 3-5 minutes
- **Deploy phase:** 2-5 minutes
- **Total:** 5-10 minutes

## What Happens During Deployment

1. **Build Phase:**
   - Installs dependencies
   - Optionally runs migration dry-run and seed script
   - Builds Next.js app

2. **Deploy Phase:**
   - Deploys to Amplify hosting
   - Environment variables are injected
   - App becomes available

## Success Indicators

✅ Deployment status shows "Succeeded"  
✅ `/api/env-check` shows all variables as "SET"  
✅ `/api/auth/test-db` shows database connected  
✅ Login page works  
✅ Can login with default credentials  

## Next Steps After Successful Deployment

1. ✅ Verify all environment variables are loaded
2. ✅ Test database connection
3. ✅ Test login functionality
4. ✅ Change default password (important for security!)
5. ✅ Create additional users if needed

