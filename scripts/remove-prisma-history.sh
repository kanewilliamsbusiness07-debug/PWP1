#!/usr/bin/env bash
set -euo pipefail

echo "This script rewrites Git history to remove large/legacy Prisma artifacts (prisma/, prisma migrations, dev.db)."
echo "WARNING: This is a destructive operation that rewrites history. DO NOT RUN unless you understand the impact and you coordinate with your team."
echo "Recommended tool: git-filter-repo (https://github.com/newren/git-filter-repo). If it's not installed, install it before running this script."

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo not found. Install it first: pip install git-filter-repo" >&2
  exit 1
fi

read -p "Are you sure you want to proceed and rewrite local history to remove 'prisma' related files? (type 'YES' to continue) " confirm
if [ "$confirm" != "YES" ]; then
  echo "Aborting. No changes made."; exit 0
fi

# Create a backup branch
git branch backup-before-prisma-remove

# Run filter-repo to remove the path
git filter-repo --path prisma --path-rename prisma:prisma_removed --invert-paths

echo "History rewritten locally. Review changes, then force-push the cleaned branches to origin (use --force-with-lease)."
echo "Example: git push origin --all --force-with-lease && git push origin --tags --force-with-lease"
