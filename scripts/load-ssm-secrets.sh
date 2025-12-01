#!/usr/bin/env bash
set -euo pipefail

# This script is intentionally harmless in CI.
# Amplify Hosting does NOT provide AWS credentials, and SSM loading will fail.
# Amplify Console environment variables will be used instead.

if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "AWS credentials not detected — skipping SSM parameter load (Amplify Console variables will be used)."
  exit 0
fi

PARAM_PATH="/amplify/d3ry622jxpwz6/pwp/"
echo "Loading SSM parameters from: $PARAM_PATH"
echo "(Local SSM load for dev env only — disabled in CI)."

exit 0

