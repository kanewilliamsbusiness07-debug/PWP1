# Authentication Troubleshooting Guide for AWS Amplify

## Quick Diagnostic Steps

### Step 1: Test Database Connection

After deploying, visit this URL in your browser (replace with your domain):
```
https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com/api/auth/test-db
```

This will show you:
- ✅ Database connection status
- ✅ Environment variables status
- ✅ Total number of users in database

### Step 2: Check if User Exists

To check if a specific user exists:
```
https://fix-amplify-deploy.d3ry622jxpwz6.amplifyapp.com/api/auth/test-db?email=allan@pwp2026.com.au
```

This will show:
- ✅ If the user exists
- ✅ User account status (active/inactive)
- ✅ If account is locked
- ✅ Login attempt count

### Step 3: Check CloudWatch Logs

1. Go to **AWS CloudWatch** → **Log groups**
2. Find your Amplify app's log group (usually named like `/aws/amplify/your-app-name`)
3. Look for log entries with `[AUTH]` prefix - these show detailed authentication flow
4. Check for errors like:
   - `[AUTH] User not found in database`
   - `[AUTH] Database error during login`
   - `[AUTH] Invalid password for user`

## Common Issues and Solutions

### Issue 1: "User not found in database"

**Symptoms:**
- Login fails with "Invalid email or password"
- Diagnostic endpoint shows `totalUsers: 0` or `exists: false`

**Solution:**
The database hasn't been seeded. You need to run the seed script:

1. **Option A: Run seed during build** (already configured in `amplify.yml`)
   - The build may automatically run a seed step. Verify build logs for the seed output
   - For DynamoDB/S3 deployment, the recommended seed is `npm run seed:dynamodb`

2. **Option B: Run seed manually**
   - Ensure your AWS env vars are set and DynamoDB tables exist (deploy templates in `infrastructure/` if needed)
   - Run: `npm run seed:dynamodb`

3. **Option C: Create user via DynamoDB**
   ```sql
   -- Connect to your PostgreSQL database and run:
   INSERT INTO "User" (id, email, "passwordHash", name, role, "isMasterAdmin", "isActive", "createdAt", "updatedAt")
   VALUES (
     'clx1234567890',
     'allan@pwp2026.com.au',
     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5Y', -- hash for '123456'
     'Allan Kutup',
     'ADVISOR',
     true,
     true,
     NOW(),
     NOW()
   );
   ```
   **Note:** You'll need to generate the password hash. Use this Node.js script:
   ```javascript
   const bcrypt = require('bcryptjs');
   bcrypt.hash('123456', 12).then(hash => console.log(hash));
   ```

### Issue 2: "Database connection failed"

**Symptoms:**
- Diagnostic endpoint shows `connected: false`
- CloudWatch logs show `Database error during login`

**Solution:**
1. Verify DynamoDB table names and AWS env vars are set in Amplify Console (e.g., `DDB_USERS_TABLE`)
2. Ensure DynamoDB is accessible from the Amplify environment and the correct region is set
3. Test table access using AWS CLI or a small local script (e.g., `npm run seed:dynamodb` with dry-run)
4. Check CloudWatch logs for detailed errors

### Issue 3: "Invalid password" (but user exists)

**Symptoms:**
- User exists in database
- Login still fails
- CloudWatch shows `[AUTH] Invalid password for user`

**Solution:**
1. The password hash might be incorrect
2. Re-seed the database: `npm run seed:dynamodb`
3. Or reset the password hash in the database

### Issue 4: "Account is locked"

**Symptoms:**
- CloudWatch shows account is locked
- Too many failed login attempts

**Solution:**
1. Reset the account in database:
   ```sql
   UPDATE "User" 
   SET "loginAttempts" = 0, "lockedUntil" = NULL 
   WHERE email = 'allan@pwp2026.com.au';
   ```

### Issue 5: Environment Variables Not Loading

**Symptoms:**
- Diagnostic endpoint shows environment variables as "NOT SET"
- But you've set them in Amplify Console

**Solution:**
1. Verify variables are set in the correct branch/environment
2. Redeploy the app after setting variables
3. Check build logs to see if variables are being injected
4. Ensure variable names match exactly (case-sensitive)

## Verification Checklist

After deploying, verify:

- [ ] Visit `/api/auth/test-db` - shows database connected
- [ ] Visit `/api/auth/test-db?email=allan@pwp2026.com.au` - shows user exists
- [ ] Check CloudWatch logs for `[AUTH]` entries
- [ ] Try logging in with:
  - Email: `allan@pwp2026.com.au`
  - Password: `123456`
- [ ] Check browser console (F12) for any client-side errors
- [ ] Verify cookies are being set (check Application tab in browser dev tools)

## Default Login Credentials

After seeding the database:
- **Email:** `allan@pwp2026.com.au`
- **Password:** `123456`

**⚠️ IMPORTANT:** Change these credentials immediately in production!

## Enhanced Logging

The authentication system now includes detailed logging with `[AUTH]` prefix. Check CloudWatch logs for:

- `[AUTH] Attempting login for email:` - Login attempt started
- `[AUTH] User lookup result:` - User found/not found
- `[AUTH] Password verification result:` - Password check result
- `[AUTH] Login successful` - Successful authentication
- `[AUTH] Authentication error:` - Any errors with full details

## Next Steps

1. **Deploy the updated code** with enhanced logging
2. **Check the diagnostic endpoint** to verify database and user
3. **Review CloudWatch logs** for detailed error messages
4. **If user doesn't exist**, seed the database
5. **Try logging in** and check logs for specific errors

## Getting Help

If you're still having issues:

1. Check CloudWatch logs for `[AUTH]` entries
2. Run the diagnostic endpoint and share the results
3. Verify the database has been seeded
4. Check that all environment variables are set correctly
5. Ensure the app has been redeployed after any changes

