# YAML Buildspec Fix Notes

## Summary

This document describes the fixes applied to resolve YAML/buildspec malformation errors in AWS Amplify builds.

## Problem

The build logs showed:
```
[ERROR]: !!! CustomerError: The commands provided in the buildspec are malformed. 
Please ensure that you have properly escaped reserved YAML characters. 
If you have a ':' character in your command, encapsulate the command within quotes
```

## Root Cause

Commands in `amplify.yml` contained unquoted strings with YAML reserved characters (`:`, `||`) that were being misinterpreted by the YAML parser.

## Changes Made

### 1. Fixed `amplify.yml`

**Before:**
- Commands were unquoted, causing YAML parsing errors
- Commands with `||` operators and colons in echo messages were not properly escaped

**After:**
- All commands are now quoted with single quotes
- Removed `nvm use 18 || nvm install 18` (Node version is handled by Amplify)
- Simplified command structure while maintaining functionality

**Key Changes:**
- `- nvm use 18 || nvm install 18` → Removed (handled by Amplify)
- `- node --version` → `- 'node -v'`
- `- npm --version` → `- 'npm --version'`
- `- npm ci` → `- 'npm ci'`
- `- npx prisma generate` → `- 'npx prisma generate'`
- `- node scripts/validate-env.js || echo "..."` → `- 'node scripts/validate-env.js || echo "..."'`
- `- npm run build` → `- 'npm run build'`

### 2. Created `scripts/validate-yaml.js`

A new validation script that:
- Validates all YAML files in the repository
- Checks for unquoted commands containing reserved YAML characters
- Provides clear error messages with file paths and line numbers
- Can be run as part of CI/CD pipeline

**Installation:**
```bash
npm install --save-dev js-yaml
```

**Usage:**
```bash
node scripts/validate-yaml.js
npm run prebuild:ci
```

### 3. Updated `package.json`

**Added:**
- `"prebuild:ci": "node scripts/validate-yaml.js"` script
- `"js-yaml": "^4.1.0"` as a devDependency

### 4. Files Checked for Secrets

The following files were checked for hardcoded secrets:
- `env.example` - Contains example values only (safe)
- `docker-compose.yml` - Contains placeholder values (safe)
- No actual secrets found in repository files

All secrets should be configured via:
- AWS Amplify Console → Environment variables
- AWS Systems Manager Parameter Store
- Environment variables at runtime

## YAML Quoting Rules Applied

1. **All commands are quoted** - Prevents YAML parser from misinterpreting special characters
2. **Single quotes preferred** - Used for commands without single quotes
3. **Double quotes when needed** - Used when command contains single quotes
4. **Reserved characters handled** - All commands with `:`, `||`, `&&`, `;` are quoted

## Testing

To verify the fixes:

1. **Validate YAML syntax:**
   ```bash
   npm install
   npm run prebuild:ci
   ```

2. **Test YAML parsing:**
   ```bash
   node -e "require('js-yaml'); const fs = require('fs'); const yaml = require('js-yaml'); const doc = yaml.load(fs.readFileSync('amplify.yml', 'utf8')); console.log('✓ Valid YAML');"
   ```

3. **Check git diff:**
   ```bash
   git diff HEAD~1 amplify.yml
   ```

## Reverting Changes

If you need to revert these changes:

```bash
git log --oneline --grep="fix(ci): escape YAML"
git revert <commit-hash>
```

Or manually:
1. Restore previous `amplify.yml` from git history
2. Remove `scripts/validate-yaml.js`
3. Remove `prebuild:ci` script from `package.json`
4. Remove `js-yaml` from `devDependencies`

## Prevention

To prevent future YAML issues:

1. **Always quote commands** in YAML files that contain:
   - Colons (`:`)
   - Pipe operators (`||`, `|`)
   - Ampersands (`&&`, `&`)
   - Semicolons (`;`)
   - Other YAML reserved characters

2. **Run validation** before committing:
   ```bash
   npm run prebuild:ci
   ```

3. **Use YAML linters** in your IDE/editor

4. **Test locally** with `js-yaml` before pushing

## References

- [YAML Specification](https://yaml.org/spec/1.2.2/)
- [AWS Amplify Buildspec Reference](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html)
- [js-yaml Documentation](https://github.com/nodeca/js-yaml)

## Files Modified

1. `amplify.yml` - Fixed command quoting
2. `package.json` - Added validation script and dependency
3. `scripts/validate-yaml.js` - New validation script (created)
4. `FIX_NOTES.md` - This documentation (created)

## Commit

All changes committed with message:
```
fix(ci): escape YAML commands and harden amplify/buildspec configs to prevent malformed buildspec errors
```

