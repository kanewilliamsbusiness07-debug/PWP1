# Database Seeding for AWS Amplify

## Overview

The database is automatically seeded during the Amplify build process. This ensures that a default admin user is always available for first-time login.

## How It Works

### Automatic Seeding During Build

1. **During Amplify Build** (`amplify.yml`):
   - After infrastructure is provisioned (DynamoDB tables & S3)
   - Optional: Run migration dry-run to validate data transfer
   - The seed script runs: `npm run seed:dynamodb`

2. **Seed Script** (`scripts/seed-users.ts`):
   - Creates/updates the default admin user in the `Users` DynamoDB table
   - Safe to run multiple times (updates password hash and active status)
   - Will not overwrite unrelated fields unless necessary

### Default User Created

After seeding, you can login with:

- **Email:** `allan@pwp2026.com.au`
- **Password:** `123456`

**⚠️ IMPORTANT:** Change this password immediately after first login in production!

## Prerequisites

### 1. Environment Variables Must Be Set

The seed script requires AWS environment variables to be set in Amplify Console:

1. Go to **AWS Amplify Console** → Your App → **App settings** → **Environment variables**
2. Ensure the following are set for your branch (see `env.production.example`):
   - `AWS_REGION`
   - `AWS_S3_BUCKET`
   - `DDB_CLIENTS_TABLE`
   - `DDB_PDF_EXPORTS_TABLE`
   - `DDB_USERS_TABLE`
   - `NEXTAUTH_SECRET`

### 2. Database Must Be Accessible

- Database must be accessible from AWS Amplify
- For Prisma Data Platform, ensure connection string is correct
- For RDS, check security groups allow Amplify connections

## Build Process

The seeding happens in this order:

```yaml
1. Install dependencies (npm ci)
2. Ensure infrastructure is deployed (DynamoDB tables & S3)
3. Optionally run migration dry-run to generate report (`npm run migrate:prisma-to-ddb:dry`)
4. Seed Users table (npm run seed:dynamodb) ← Creates default user here
5. Build Next.js app (npm run build)
```

## Verification

### Check if Seeding Worked

After deployment, visit:
```
https://your-app.amplifyapp.com/api/auth/test-db
```

You should see:
- `totalUsers: 1` (or more if you've added users)
- Database connection: `connected: true`

### Check Specific User

To verify the default user exists:
```
https://your-app.amplifyapp.com/api/auth/test-db?email=allan@pwp2026.com.au
```

You should see:
- `exists: true`
- `isActive: true`
- User details

## Troubleshooting

### Seed Script Doesn't Run

**Symptoms:**
- No users in database after deployment
- Build logs show "Warning: Database seeding failed"

**Solutions:**

1. **Check AWS env vars are set:**
   - Verify in Amplify Console → Environment variables (see `env.production.example`)
   - Ensure they're set for the correct branch
   - Redeploy after setting variables

2. **Check build logs:**
   - Go to Amplify Console → Deployments → Latest build
   - Look for seed script output
   - Check for error messages

3. **Verify table access:**
   - Test access using AWS Console or the seeder script (`npm run seed:dynamodb`)
   - Ensure IAM permissions and region are correct

### Seed Script Runs But User Not Created

**Symptoms:**
- Build logs show seed completed
- But user doesn't exist in database

**Solutions:**

1. **Check seed script output in build logs:**
   - Look for `✅ Users seed completed successfully!`
   - Check for any error messages

2. **Manually run seed:**
   ```bash
   # Ensure AWS env vars and tables exist
   npm run seed:dynamodb
   ```

3. **Check table directly:**
   - Use the DynamoDB Console to inspect the Users table
   - Confirm an item exists with `email = 'allan@pwp2026.com.au'`

### Seed Script Fails Silently

The seed script is designed to **not fail the build** if seeding fails. This is intentional so that:
- Builds can complete even if database is temporarily unavailable
- You can fix database issues and redeploy
- Build logs will show warnings but deployment continues

**To see seed errors:**
- Check Amplify build logs
- Look for `❌` or `⚠️` messages
- Check CloudWatch logs for runtime errors

## Manual Seeding

If automatic seeding doesn't work, you can seed manually:

### Manual Seeding Options

If automatic seeding does not work during build, you can seed the Users table manually:

Option A: **Use the seeder script**

```bash
# Ensure AWS env vars and tables exist
npm run seed:dynamodb
```

Option B: **Use the AWS Console**

- Open the DynamoDB Console → select the Users table
- Create a new item with the required attributes:
  - `id` (uuid)
  - `email`: `allan@pwp2026.com.au`
  - `passwordHash`: (generate with bcrypt)
  - `name`: `Allan Kutup`
  - `role`: `ADVISOR`
  - `isMasterAdmin`: `true`
  - `isActive`: `true`

Option C: **Use a one-off script (recommended for automation)**

- Use `scripts/seed-users.ts` as a reference for creating/updating the default user.


## Seed Script Features

The seed script (`scripts/seed-users.ts`) includes:

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Error handling**: Won't fail build if tables are unavailable
- ✅ **Detailed logging**: Shows what's happening
- ✅ **Environment check**: Verifies required AWS env vars are set
- ✅ **User count**: Logs total users after seeding

## Customization

To modify the default user or add more users:

1. Edit `scripts/seed-users.ts`
2. Add more `PutCommand` calls for additional users or adjust the seeder logic
3. Commit and push to trigger new deployment
4. Seed will run automatically on next build

## Security Notes

- ⚠️ Default password is `123456` - **change immediately in production**
- ⚠️ Seed script logs the password - check build logs are secure
- ⚠️ Consider disabling seed script in production after initial setup
- ✅ Uses `upsert` so won't create duplicate users
- ✅ Password is properly hashed with bcrypt (12 rounds)

## Next Steps After First Deployment

1. ✅ Verify seed worked: Check `/api/auth/test-db`
2. ✅ Login with default credentials
3. ✅ **Change default password immediately**
4. ✅ Create additional admin users if needed
5. ✅ Consider disabling seed script for production (optional)

