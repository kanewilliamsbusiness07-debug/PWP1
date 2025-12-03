# Database Seeding for AWS Amplify

## Overview

The database is automatically seeded during the Amplify build process. This ensures that a default admin user is always available for first-time login.

## How It Works

### Automatic Seeding During Build

1. **During Amplify Build** (`amplify.yml`):
   - After Prisma Client is generated
   - After database migrations are run
   - The seed script automatically runs: `npx prisma db seed`

2. **Seed Script** (`prisma/seed.ts`):
   - Creates/updates the default admin user
   - Uses `upsert` so it's safe to run multiple times
   - Won't overwrite existing data (only updates password hash if needed)

### Default User Created

After seeding, you can login with:

- **Email:** `allan@pwp2026.com.au`
- **Password:** `123456`

**⚠️ IMPORTANT:** Change this password immediately after first login in production!

## Prerequisites

### 1. Environment Variables Must Be Set

The seed script requires `DATABASE_URL` to be set in Amplify Console:

1. Go to **AWS Amplify Console** → Your App → **App settings** → **Environment variables**
2. Ensure `DATABASE_URL` is set for your branch
3. Format: `postgresql://username:password@host:port/database?sslmode=require`

### 2. Database Must Be Accessible

- Database must be accessible from AWS Amplify
- For Prisma Data Platform, ensure connection string is correct
- For RDS, check security groups allow Amplify connections

## Build Process

The seeding happens in this order:

```yaml
1. Install dependencies (npm ci)
2. Generate Prisma Client (npx prisma generate)
3. Run migrations (npx prisma migrate deploy)
4. Seed database (npx prisma db seed) ← Creates default user here
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

1. **Check DATABASE_URL is set:**
   - Verify in Amplify Console → Environment variables
   - Ensure it's set for the correct branch
   - Redeploy after setting variables

2. **Check build logs:**
   - Go to Amplify Console → Deployments → Latest build
   - Look for seed script output
   - Check for error messages

3. **Verify database connection:**
   - Test connection from your local machine using the same DATABASE_URL
   - Check database security groups/firewall rules

### Seed Script Runs But User Not Created

**Symptoms:**
- Build logs show seed completed
- But user doesn't exist in database

**Solutions:**

1. **Check seed script output in build logs:**
   - Look for `✅ Database seed completed successfully!`
   - Check for any error messages

2. **Manually run seed:**
   ```bash
   # Set DATABASE_URL
   export DATABASE_URL="your-connection-string"
   
   # Run seed
   npx prisma db seed
   ```

3. **Check database directly:**
   - Connect to your database
   - Query: `SELECT * FROM "User" WHERE email = 'allan@pwp2026.com.au';`

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

### Option 1: Using Prisma CLI

```bash
# Set DATABASE_URL
export DATABASE_URL="your-connection-string"

# Run seed
npx prisma db seed
```

### Option 2: Using Prisma Studio

```bash
# Open Prisma Studio
npx prisma studio

# Manually create user with:
# - Email: allan@pwp2026.com.au
# - Password hash: (generate using bcrypt.hash('123456', 12))
# - Name: Allan Katup
# - Role: ADVISOR
# - isMasterAdmin: true
# - isActive: true
```

### Option 3: Direct SQL

```sql
-- Generate password hash first (use Node.js):
-- const bcrypt = require('bcryptjs');
-- bcrypt.hash('123456', 12).then(hash => console.log(hash));

INSERT INTO "User" (
  id, email, "passwordHash", name, role, 
  "isMasterAdmin", "isActive", "createdAt", "updatedAt"
)
VALUES (
  'clx' || substr(md5(random()::text), 1, 10), -- Generate random ID
  'allan@pwp2026.com.au',
  '$2a$12$...', -- Your generated hash here
  'Allan Katup',
  'ADVISOR',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

## Seed Script Features

The seed script (`prisma/seed.ts`) includes:

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Error handling**: Won't fail build if database is unavailable
- ✅ **Detailed logging**: Shows what's happening
- ✅ **Environment check**: Verifies DATABASE_URL is set
- ✅ **User count**: Shows total users after seeding

## Customization

To modify the default user or add more users:

1. Edit `prisma/seed.ts`
2. Add more `upsert` calls for additional users
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

