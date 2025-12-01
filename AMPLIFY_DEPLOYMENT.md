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

Amplify should automatically detect the root-level `amplify.yml`. Set **App root** to `/`. The backend environment name is hard-coded to `prod` in the configuration.

**Build settings (already committed):**
```yaml
version: 1
applications:
  - appRoot: .
    backend:
      phases:
        build:
          commands:
            - amplifyInit --envName prod
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
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

1. Create parameters at `/amplify/d3ry622jxpwz6/prod/YOUR_KEY` (hard-coded prod path).
2. Ensure the Amplify service role has `ssm:GetParametersByPath`.
3. The SSM path is hard-coded to `/amplify/d3ry622jxpwz6/prod/` for the prod environment.

## Step 5: Database Migrations

### Initial Setup

Before the first deployment, run migrations manually:

```bash
# Connect to your database and run:
npx prisma migrate deploy
```

**Note:** Database migrations should be run manually before the first deployment. The build process will generate the Prisma client but will not run migrations automatically.

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

## Environment Configuration

The application uses a single production environment (`prod`). Configure the following environment variables in Amplify Console:

```
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-minimum-32-characters
JWT_SECRET=your-jwt-secret-minimum-32-characters
ENCRYPTION_KEY=your-encryption-key-32-characters
CRON_SECRET=your-cron-secret
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

