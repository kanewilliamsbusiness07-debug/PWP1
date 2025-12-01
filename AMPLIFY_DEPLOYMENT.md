# AWS Amplify Deployment Guide

This guide will help you deploy FinCalc Pro to AWS Amplify.

## Prerequisites

1. AWS Account with Amplify access
2. PostgreSQL database (AWS RDS recommended)
3. Git repository (GitHub, GitLab, Bitbucket, or AWS CodeCommit)

## Step 1: Set Up PostgreSQL Database

> **Note:** The Prisma schema is configured for PostgreSQL. For local development with SQLite, you can temporarily change the `provider` in `prisma/schema.prisma` to `"sqlite"` and use `DATABASE_URL="file:./dev.db"`. However, for production on Amplify, PostgreSQL is required.

### Option A: AWS RDS PostgreSQL

1. Create an RDS PostgreSQL instance in AWS Console
2. Note the connection details:
   - Endpoint
   - Port (default: 5432)
   - Database name
   - Username
   - Password

### Option B: External PostgreSQL

Use any PostgreSQL database provider (e.g., Supabase, Neon, Railway).

## Step 2: Create Amplify App

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "New app" → "Host web app"
3. Connect your Git repository
4. Select your branch (usually `main` or `master`)

## Step 3: Configure Build Settings

Amplify should automatically detect the root-level `amplify.yml`. Set **App root** to `/` and keep **Backend environment** empty (no Amplify CLI backend in this repo). **Important:** use branch names that map cleanly to Amplify environment slugs—only letters, numbers, hyphens, and underscores. Names such as `fix/amplify-deploy` or `feature/foo` will be rejected by Amplify and produce the log line `BackendEnvironment name <branch> is invalid`. Rename the branch to something like `fix-amplify-deploy` before connecting it to Amplify.

**Build settings (already committed):**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - mkdir -p ~/.npm
        - npm config set cache ~/.npm --global
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - ~/.npm/**/*
      - .next/cache/**/*
```

## Step 4: Configure Environment Variables

In Amplify Console → App settings → Environment variables, add:

### Required Variables

```
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
NEXTAUTH_URL=https://your-app-id.amplifyapp.com
NEXTAUTH_SECRET=your-secret-key-minimum-32-characters
NODE_ENV=production
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Optional Variables

```
AMPLIFY_HOSTING=true  # Set to true if using Amplify Hosting (managed Next.js)
```

### Using AWS Systems Manager Parameter Store (Optional)

Amplify Hosting automatically injects the environment variables you define in the console UI. Only configure SSM if you explicitly want to source secrets from Parameter Store:

1. Create parameters at `/amplify/<AMPLIFY_APP_ID>/<BRANCH_NAME>/YOUR_KEY`.
2. Ensure the Amplify service role has `ssm:GetParametersByPath`.
3. Leave `AMPLIFY_SSM_PATH` empty unless SSM paths really exist—otherwise Amplify will log 404s while trying to write the environment cache.

## Step 5: Database Migrations

### Initial Setup

Before the first deployment, run migrations manually or add to build:

1. **Option A: Manual Migration**
   ```bash
   # Connect to your database and run:
   npx prisma migrate deploy
   ```

2. **Option B: Add to Build (Recommended)**
   
   Update `amplify.yml` to include:
   ```yaml
   backend:
     phases:
       build:
         commands:
           - npx prisma migrate deploy
   ```

### Seed Database (Optional)

After migrations, seed initial data:
```bash
npx prisma db seed
```

## Step 6: Deploy

1. Click "Save and deploy" in Amplify Console
2. Monitor the build logs
3. Once complete, your app will be available at the provided Amplify URL

## Step 7: Custom Domain (Optional)

1. In Amplify Console → Domain management
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable to match your domain

## Troubleshooting

### Build Fails with Prisma Errors

- Ensure `DATABASE_URL` is correctly set
- Verify database is accessible from Amplify (check security groups for RDS)
- Check that Prisma client is generated: `npx prisma generate`

### Database Connection Issues

- Verify RDS security group allows connections from Amplify
- Check database credentials
- Ensure database is in the same region or VPC configuration is correct

### NextAuth Issues

- Verify `NEXTAUTH_URL` matches your actual domain
- Ensure `NEXTAUTH_SECRET` is set and is at least 32 characters
- Check that cookies are working (HTTPS required in production)

### Build Timeout

- Increase build timeout in Amplify settings
- Optimize build process (cache node_modules, .next, .prisma)

## Environment-Specific Configuration

### Development Branch

Use development database and settings:
```
DATABASE_URL=postgresql://dev-user:dev-pass@dev-host:5432/dev-db
NEXTAUTH_URL=https://dev-branch.amplifyapp.com
NODE_ENV=development
```

### Production Branch

Use production database:
```
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

## Monitoring

- View build logs in Amplify Console
- Monitor application logs in CloudWatch
- Set up alerts for build failures
- Monitor database performance in RDS Console

## Security Best Practices

1. **Never commit `.env` files** - Use Amplify environment variables
2. **Use AWS Secrets Manager** for sensitive data (optional)
3. **Enable RDS encryption** for database
4. **Use HTTPS only** - Amplify provides this by default
5. **Rotate secrets regularly** - Update `NEXTAUTH_SECRET` periodically
6. **Restrict database access** - Use security groups and VPCs

## Cost Optimization

- Use Amplify's free tier for small projects
- Consider RDS t3.micro for development
- Enable Amplify caching for static assets
- Use CloudFront (included with Amplify) for CDN

## Support

For issues specific to:
- **Amplify**: [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
- **Prisma**: [Prisma Documentation](https://www.prisma.io/docs)

