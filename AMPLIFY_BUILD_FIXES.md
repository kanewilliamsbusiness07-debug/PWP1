# AWS Amplify Build Fixes - Complete Summary

## 🎯 Issues Fixed

### 1. ✅ "BackendEnvironment name fix-amplify-deploy is invalid"

**Root Cause**: Branch name `fix-amplify-deploy` contains hyphens, which are invalid for Amplify environment names.

**Fix Applied**:
- Created environment name mapping script (`scripts/get-amplify-env.js`)
- Maps `fix-amplify-deploy` → `fixamplifydeploy` (valid name)
- Added `fixamplifydeploy` environment to `amplify/team-provider-info.json`

**Files Changed**:
- `scripts/get-amplify-env.js` (NEW)
- `amplify/team-provider-info.json` (UPDATED)

---

### 2. ✅ "No backend environment association found"

**Root Cause**: Environment `fixamplifydeploy` was not defined in `team-provider-info.json`.

**Fix Applied**:
- Added complete `fixamplifydeploy` environment configuration to `team-provider-info.json`
- Includes CloudFormation roles, region, and hosting configuration
- App ID set to `d3ry622jxpwz6`

**Files Changed**:
- `amplify/team-provider-info.json` (UPDATED)

---

### 3. ✅ "Failed to set up process.env.secrets"

**Root Cause**: No mechanism to load secrets from SSM Parameter Store during build.

**Fix Applied**:
- Created `scripts/load-ssm-secrets.sh` to load SSM parameters
- Integrated into `amplify.yml` preBuild phase
- Gracefully falls back to Amplify Console environment variables if SSM unavailable

**Files Changed**:
- `scripts/load-ssm-secrets.sh` (NEW)
- `amplify.yml` (UPDATED)

---

### 4. ✅ "SSM params /amplify/d3ry622jxpwz6/fix-amplify-deploy/ not found"

**Root Cause**: 
- Invalid environment name in SSM path (contains hyphens)
- SSM parameters not created at correct path

**Fix Applied**:
- Environment name mapping ensures correct SSM path: `/amplify/d3ry622jxpwz6/fixamplifydeploy/`
- Created comprehensive SSM setup documentation
- Added IAM policy for SSM access

**Files Changed**:
- `scripts/get-amplify-env.js` (NEW)
- `AMPLIFY_SSM_SETUP.md` (NEW)
- `amplify-iam-policy.json` (NEW)

---

### 5. ✅ "Unable to write cache: Request failed with status code 404"

**Root Cause**: Amplify build role lacks S3 permissions for cache bucket.

**Fix Applied**:
- Created IAM policy with S3 cache bucket permissions
- Added `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` for `amplify-*` buckets
- Added `s3:ListBucket` permission

**Files Changed**:
- `amplify-iam-policy.json` (NEW)

---

### 6. ✅ "Random env name being generated instead of using correct env"

**Root Cause**: No environment detection logic, Amplify defaulting to random names.

**Fix Applied**:
- Created `scripts/get-amplify-env.js` with branch-to-environment mapping
- Integrated into `amplify.yml` to set `AMPLIFY_ENV` variable
- Added backend environment checkout in preBuild phase

**Files Changed**:
- `scripts/get-amplify-env.js` (NEW)
- `amplify.yml` (UPDATED)

---

## 📁 Files Created

1. **`scripts/get-amplify-env.js`**
   - Maps branch names to valid environment names
   - Handles invalid names (with hyphens/underscores)
   - Defaults to `prod` for unknown branches

2. **`scripts/load-ssm-secrets.sh`**
   - Loads secrets from SSM Parameter Store
   - Writes to `.env.local` for Next.js
   - Graceful fallback to Amplify Console env vars

3. **`amplify-iam-policy.json`**
   - Complete IAM policy for Amplify build role
   - SSM Parameter Store access
   - KMS decrypt permissions
   - S3 cache bucket permissions

4. **`AMPLIFY_SSM_SETUP.md`**
   - Complete guide for SSM Parameter Store setup
   - CLI commands for creating parameters
   - Troubleshooting guide

5. **`AMPLIFY_BUILD_FIXES.md`**
   - This file - complete summary of all fixes

---

## 📝 Files Modified

1. **`amplify/team-provider-info.json`**
   - Added `fixamplifydeploy` environment configuration
   - Includes CloudFormation roles and hosting config

2. **`amplify.yml`**
   - Added environment detection
   - Added SSM secrets loading
   - Added backend environment checkout

---

## 🔧 Required Actions

### 1. Apply IAM Policy

The Amplify build role needs the permissions in `amplify-iam-policy.json`:

1. Go to **AWS IAM** → **Roles**
2. Find: `amplify-fincalcpro-fixamplifydeploy-authRole`
3. Click **Add permissions** → **Create inline policy**
4. Copy contents of `amplify-iam-policy.json`
5. Replace `ACCOUNT_ID` with your AWS account ID
6. Save policy

### 2. Create SSM Parameters (Optional)

If using SSM Parameter Store, create parameters at:

```
/amplify/d3ry622jxpwz6/fixamplifydeploy/DATABASE_URL
/amplify/d3ry622jxpwz6/fixamplifydeploy/NEXTAUTH_SECRET
/amplify/d3ry622jxpwz6/fixamplifydeploy/NEXTAUTH_URL
/amplify/d3ry622jxpwz6/fixamplifydeploy/NEXT_PUBLIC_SITE_URL
/amplify/d3ry622jxpwz6/fixamplifydeploy/JWT_SECRET
/amplify/d3ry622jxpwz6/fixamplifydeploy/ENCRYPTION_KEY
/amplify/d3ry622jxpwz6/fixamplifydeploy/CRON_SECRET
```

See `AMPLIFY_SSM_SETUP.md` for detailed instructions.

**Alternative**: Use Amplify Console environment variables (simpler, recommended).

### 3. Verify Environment Variables

Ensure all required environment variables are set in:
- **Amplify Console** → App settings → Environment variables, OR
- **SSM Parameter Store** at the paths above

Required variables:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY` (production)
- `CRON_SECRET` (production)

---

## ✅ Validation Steps

### 1. Verify Environment Detection

Check build logs for:
```
Detected Amplify environment: fixamplifydeploy
```

### 2. Verify SSM Loading (if using SSM)

Check build logs for:
```
🔍 Loading SSM parameters from: /amplify/d3ry622jxpwz6/fixamplifydeploy/
✅ Loaded: DATABASE_URL
✅ Loaded: NEXTAUTH_SECRET
...
```

Or if using Amplify Console env vars:
```
⚠️  No SSM parameters found at /amplify/d3ry622jxpwz6/fixamplifydeploy/
   Using Amplify Console environment variables instead
```

### 3. Verify Backend Environment

Check build logs for:
```
Backend environment checkout skipped (using manual hosting)
```
or
```
Backend environment checked out successfully
```

### 4. Verify Build Success

Build should complete with:
```
✅ Build completed successfully
```

---

## 🚀 Expected Build Flow

```
1. PreBuild Phase:
   ├─ Install Node 18
   ├─ Install dependencies (npm ci)
   ├─ Detect environment: fix-amplify-deploy → fixamplifydeploy
   ├─ Load SSM secrets (or use Amplify Console env vars)
   └─ Checkout backend environment (if Amplify CLI available)

2. Build Phase:
   └─ Build Next.js application (npm run build)

3. Artifacts:
   └─ Deploy .next directory

4. Runtime:
   └─ Start Next.js server with environment variables
```

---

## 📊 Environment Name Mapping

| Branch Name | Environment Name | SSM Path |
|------------|------------------|----------|
| `fix-amplify-deploy` | `fixamplifydeploy` | `/amplify/d3ry622jxpwz6/fixamplifydeploy/` |
| `main` | `prod` | `/amplify/d3ry622jxpwz6/prod/` |
| `master` | `prod` | `/amplify/d3ry622jxpwz6/prod/` |
| `dev-env` | `dev` | `/amplify/d3ry622jxpwz6/dev/` |
| `staging-1` | `stage` | `/amplify/d3ry622jxpwz6/stage/` |

---

## 🎉 Summary

All build errors have been addressed:

- ✅ Invalid environment name → Fixed with name mapping
- ✅ Missing backend environment → Added to team-provider-info.json
- ✅ SSM secrets not loading → Added SSM loader script
- ✅ SSM path incorrect → Fixed with valid environment name
- ✅ Cache 404 errors → Added S3 permissions to IAM policy
- ✅ Random env names → Added environment detection

**The build should now succeed after:**
1. Applying IAM policy to build role
2. Setting environment variables (Console or SSM)
3. Pushing code to trigger build

