# AWS Amplify Authentication Fix Guide

## Issue: "Authentication failed" when trying to login

This guide will help you fix authentication issues on AWS Amplify.

## Root Causes

The authentication failure is typically caused by:
1. **Missing environment variables** in Amplify Console
2. **Incorrect NEXTAUTH_URL** (doesn't match your Amplify domain)
3. **Database connection issues** (DATABASE_URL not set or incorrect)
4. **Missing or incorrect secrets** (NEXTAUTH_SECRET, JWT_SECRET)

## Step 1: Verify Environment Variables in Amplify Console

1. Go to **AWS Amplify Console** → Your App → **App settings** → **Environment variables**

2. **Required variables** (must be set for each branch/environment):

```
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
NEXTAUTH_SECRET=<generated-secret-32-chars>
NEXTAUTH_URL=https://your-app-id.amplifyapp.com
NEXT_PUBLIC_SITE_URL=https://your-app-id.amplifyapp.com
JWT_SECRET=<generated-secret-32-chars>
ENCRYPTION_KEY=<generated-key-32-chars>
CRON_SECRET=<any-secret-string>
NODE_ENV=production
```

### Important Notes:
- **NEXTAUTH_URL** must match your **exact Amplify domain** (e.g., `https://main.d1234567890.amplifyapp.com`)
- If you have a custom domain, use that instead
- **Never** use `http://localhost:3000` in production

## Step 2: Generate Secure Secrets

Run these commands to generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Generate JWT_SECRET (32+ characters)  
openssl rand -base64 32

# Generate ENCRYPTION_KEY (32+ characters)
openssl rand -hex 32
```

**Copy each generated value** and paste it into the corresponding environment variable in Amplify Console.

## Step 3: Verify Database Connection

1. **Check DATABASE_URL format:**
   ```
   postgresql://username:password@host:port/database?schema=public
   ```

2. **Verify database is accessible:**
   - Database must be accessible from AWS (check security groups for RDS)
   - If using RDS, ensure security group allows connections from Amplify
   - Test connection from your local machine first

3. **Run database migrations:**
   ```bash
   # Connect to your database and run:
   npx prisma migrate deploy
   npx prisma db seed
   ```

## Step 4: Check Your Amplify Domain

1. In Amplify Console, go to your app
2. Find your **App URL** (e.g., `https://main.d1234567890.amplifyapp.com`)
3. **Update NEXTAUTH_URL** to match exactly:
   ```
   NEXTAUTH_URL=https://main.d1234567890.amplifyapp.com
   ```
4. If you have a custom domain, use that instead

## Step 5: Verify Database Has Users

The seed script creates a default user:
- **Email:** `allan@pwp2026.com.au`
- **Password:** `123456`

To verify or create users:
```bash
# Connect to your database and run:
npx prisma db seed
```

Or manually create a user through your database client.

## Step 6: Redeploy After Changes

After updating environment variables:
1. Go to Amplify Console → Your App
2. Click **Redeploy this version** (or trigger a new deployment)
3. Wait for build to complete
4. Test login again

## Step 7: Check Build Logs

1. Go to Amplify Console → Your App → **Deployments**
2. Click on the latest deployment
3. Check **Build logs** for errors:
   - Look for "Authentication error" messages
   - Check for database connection errors
   - Verify environment variables are loaded

## Step 8: Check Runtime Logs

1. Go to AWS CloudWatch → Log groups
2. Find your Amplify app's log group
3. Look for authentication-related errors
4. The improved error handling will now show specific error messages

## Common Issues and Solutions

### Issue: "NEXTAUTH_SECRET is not set"
**Solution:** Add `NEXTAUTH_SECRET` environment variable in Amplify Console with a 32+ character secret.

### Issue: "Database connection not configured"
**Solution:** 
- Verify `DATABASE_URL` is set correctly
- Check database security groups allow Amplify connections
- Test database connection from your local machine

### Issue: "Invalid email or password"
**Solution:**
- Verify user exists in database: run `npx prisma db seed`
- Check if account is locked (too many failed attempts)
- Verify password hash is correct

### Issue: "NEXTAUTH_URL mismatch"
**Solution:**
- Ensure `NEXTAUTH_URL` exactly matches your Amplify domain
- Include `https://` protocol
- No trailing slash

### Issue: Cookies not working
**Solution:**
- Ensure you're using HTTPS (Amplify provides this automatically)
- Check browser console for cookie errors
- Verify `trustHost: true` is set (already configured in code)

## Testing After Fix

1. Clear browser cookies for your Amplify domain
2. Navigate to your login page
3. Try logging in with:
   - Email: `allan@pwp2026.com.au`
   - Password: `123456`
4. Check browser console (F12) for any errors
5. Check CloudWatch logs for detailed error messages

## Verification Checklist

- [ ] All required environment variables are set in Amplify Console
- [ ] `NEXTAUTH_URL` matches your exact Amplify domain
- [ ] `DATABASE_URL` is correct and database is accessible
- [ ] Secrets (NEXTAUTH_SECRET, JWT_SECRET) are 32+ characters
- [ ] Database migrations have been run
- [ ] Database has been seeded with default user
- [ ] App has been redeployed after environment variable changes
- [ ] Build logs show no errors
- [ ] Runtime logs show no authentication errors

## Still Having Issues?

If authentication still fails after following these steps:

1. **Check CloudWatch logs** for specific error messages (improved error handling will show detailed errors)
2. **Verify environment variables** are actually loaded at runtime (check build logs)
3. **Test database connection** from a local script using the same DATABASE_URL
4. **Check NextAuth debug mode** - set `NODE_ENV=development` temporarily to see detailed logs

## Code Improvements Made

The following improvements have been made to help diagnose issues:

1. **Better error handling** in `lib/auth/auth.ts`:
   - Database connection errors are caught and reported
   - More specific error messages
   - Better logging for debugging

2. **Improved error messages** in login page:
   - User-friendly error messages
   - Better handling of different error types

3. **Enhanced logging**:
   - All authentication errors are logged to console
   - Database errors are specifically identified

These improvements will help identify the exact cause of authentication failures.

