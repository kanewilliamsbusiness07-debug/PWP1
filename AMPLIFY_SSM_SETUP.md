# AWS Amplify SSM Parameter Store Setup

## Overview

This guide explains how to set up AWS Systems Manager (SSM) Parameter Store for AWS Amplify deployments.

## Environment Name Mapping

The branch `fix-amplify-deploy` is automatically mapped to the valid environment name `fixamplifydeploy` (hyphens removed).

### Valid Environment Names

Amplify environment names **MUST** be:
- Lowercase only (a-z)
- Alphanumeric only (a-z, 0-9)
- **NO hyphens, underscores, or special characters**

**Branch Name** → **Environment Name**
- `fix-amplify-deploy` → `fixamplifydeploy`
- `dev-env` → `dev`
- `staging-1` → `stage`
- `main` → `prod`
- `master` → `prod`

## SSM Parameter Path Format

SSM parameters must be created at:

```
/amplify/<AMPLIFY_APP_ID>/<ENV_NAME>/<KEY>
```

Where:
- `<AMPLIFY_APP_ID>` = `d3ry622jxpwz6`
- `<ENV_NAME>` = Valid environment name (e.g., `fixamplifydeploy`, `prod`, `dev`)
- `<KEY>` = Environment variable name (e.g., `DATABASE_URL`)

## Required SSM Parameters

For the `fixamplifydeploy` environment, create these parameters:

```
/amplify/d3ry622jxpwz6/fixamplifydeploy/DATABASE_URL
/amplify/d3ry622jxpwz6/fixamplifydeploy/NEXTAUTH_SECRET
/amplify/d3ry622jxpwz6/fixamplifydeploy/NEXTAUTH_URL
/amplify/d3ry622jxpwz6/fixamplifydeploy/NEXT_PUBLIC_SITE_URL
/amplify/d3ry622jxpwz6/fixamplifydeploy/JWT_SECRET
/amplify/d3ry622jxpwz6/fixamplifydeploy/ENCRYPTION_KEY
/amplify/d3ry622jxpwz6/fixamplifydeploy/CRON_SECRET
```

## Creating SSM Parameters via AWS CLI

### 1. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"

# Generate JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate ENCRYPTION_KEY
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

# Generate CRON_SECRET
CRON_SECRET=$(openssl rand -base64 24)
echo "CRON_SECRET=$CRON_SECRET"
```

### 2. Create SSM Parameters

```bash
# Set variables
APP_ID="d3ry622jxpwz6"
ENV_NAME="fixamplifydeploy"
REGION="us-east-1"

# Create parameters (replace placeholder values with actual secrets)
aws ssm put-parameter \
  --region $REGION \
  --name "/amplify/$APP_ID/$ENV_NAME/DATABASE_URL" \
  --value "postgresql://username:password@host:port/database?schema=public" \
  --type "SecureString" \
  --description "Database connection string for $ENV_NAME environment"

aws ssm put-parameter \
  --region $REGION \
  --name "/amplify/$APP_ID/$ENV_NAME/NEXTAUTH_SECRET" \
  --value "YOUR_NEXTAUTH_SECRET_HERE" \
  --type "SecureString" \
  --description "NextAuth secret for $ENV_NAME environment"

aws ssm put-parameter \
  --region $REGION \
  --name "/amplify/$APP_ID/$ENV_NAME/NEXTAUTH_URL" \
  --value "https://your-app-id.amplifyapp.com" \
  --type "String" \
  --description "NextAuth URL for $ENV_NAME environment"

aws ssm put-parameter \
  --region $REGION \
  --name "/amplify/$APP_ID/$ENV_NAME/NEXT_PUBLIC_SITE_URL" \
  --value "https://your-app-id.amplifyapp.com" \
  --type "String" \
  --description "Public site URL for $ENV_NAME environment"

aws ssm put-parameter \
  --region $REGION \
  --name "/amplify/$APP_ID/$ENV_NAME/JWT_SECRET" \
  --value "YOUR_JWT_SECRET_HERE" \
  --type "SecureString" \
  --description "JWT secret for $ENV_NAME environment"

aws ssm put-parameter \
  --region $REGION \
  --name "/amplify/$APP_ID/$ENV_NAME/ENCRYPTION_KEY" \
  --value "YOUR_ENCRYPTION_KEY_HERE" \
  --type "SecureString" \
  --description "Encryption key for $ENV_NAME environment"

aws ssm put-parameter \
  --region $REGION \
  --name "/amplify/$APP_ID/$ENV_NAME/CRON_SECRET" \
  --value "YOUR_CRON_SECRET_HERE" \
  --type "SecureString" \
  --description "Cron secret for $ENV_NAME environment"
```

## Creating SSM Parameters via AWS Console

1. Go to **AWS Systems Manager** → **Parameter Store**
2. Click **Create parameter**
3. For each parameter:
   - **Name**: Use the full path (e.g., `/amplify/d3ry622jxpwz6/fixamplifydeploy/DATABASE_URL`)
   - **Type**: `SecureString` for secrets, `String` for non-sensitive values
   - **Value**: Enter the actual value
   - Click **Create parameter**

## IAM Permissions

The Amplify build role must have the following permissions:

### Required IAM Policy

See `amplify-iam-policy.json` for the complete policy document.

**Key Permissions:**
- `ssm:GetParameters`
- `ssm:GetParameter`
- `ssm:GetParametersByPath`
- `kms:Decrypt` (for encrypted SecureString parameters)
- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` (for Amplify cache)

### Applying IAM Policy

1. Go to **AWS IAM** → **Roles**
2. Find your Amplify build role (e.g., `amplify-fincalcpro-fixamplifydeploy-authRole`)
3. Click **Add permissions** → **Create inline policy**
4. Copy the contents of `amplify-iam-policy.json`
5. Paste into the policy editor
6. Replace `ACCOUNT_ID` with your AWS account ID
7. Save the policy

## Verification

### Check Parameters Exist

```bash
aws ssm get-parameters-by-path \
  --path "/amplify/d3ry622jxpwz6/fixamplifydeploy/" \
  --recursive \
  --region us-east-1
```

### Test in Build

The build process will automatically:
1. Detect environment name from branch (`fix-amplify-deploy` → `fixamplifydeploy`)
2. Load parameters from SSM path `/amplify/d3ry622jxpwz6/fixamplifydeploy/`
3. Fall back to Amplify Console environment variables if SSM is unavailable

Check build logs for:
```
🔍 Loading SSM parameters from: /amplify/d3ry622jxpwz6/fixamplifydeploy/
✅ Loaded: DATABASE_URL
✅ Loaded: NEXTAUTH_SECRET
...
```

## Troubleshooting

### "SSM params not found"

**Cause**: Parameters don't exist at the expected path

**Solution**:
1. Verify the environment name mapping (branch → env name)
2. Check parameter paths match: `/amplify/d3ry622jxpwz6/<ENV_NAME>/<KEY>`
3. Ensure parameters are created in the correct AWS region

### "Access denied to SSM Parameter Store"

**Cause**: Amplify build role lacks SSM permissions

**Solution**:
1. Apply the IAM policy from `amplify-iam-policy.json`
2. Ensure KMS decrypt permissions if using encrypted parameters
3. Verify the role ARN matches `team-provider-info.json`

### "BackendEnvironment name fix-amplify-deploy is invalid"

**Cause**: Branch name contains hyphens (invalid for Amplify environment names)

**Solution**: ✅ **FIXED** - The build process now automatically maps `fix-amplify-deploy` to `fixamplifydeploy`

### "No backend environment association found"

**Cause**: Environment not defined in `team-provider-info.json`

**Solution**: ✅ **FIXED** - Added `fixamplifydeploy` environment to `team-provider-info.json`

## Alternative: Use Amplify Console Environment Variables

If you prefer not to use SSM Parameter Store:

1. Go to **AWS Amplify Console** → Your App → **App settings** → **Environment variables**
2. Add all required variables directly in the console
3. The build will use these variables instead of SSM

**Note**: SSM Parameter Store is recommended for:
- Centralized secret management
- Sharing secrets across multiple Amplify apps
- Integration with AWS Secrets Manager rotation

