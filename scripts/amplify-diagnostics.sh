#!/usr/bin/env bash
set -euo pipefail

DIAG_DIR="diagnostics"
mkdir -p "${DIAG_DIR}"

echo "=== GIT STATUS ===" > "${DIAG_DIR}/git.txt"
git status >> "${DIAG_DIR}/git.txt"
git rev-parse --abbrev-ref HEAD >> "${DIAG_DIR}/git.txt" 2>&1

echo "=== AWS SSM CHECK ===" > "${DIAG_DIR}/ssm.txt"

# Hard-coded SSM path for prod environment
SSM_PATH="/amplify/d3ry622jxpwz6/prod/"

if [[ -n "${SSM_PATH}" ]]; then
  if command -v aws >/dev/null 2>&1; then
    aws ssm get-parameters-by-path \
      --path "${SSM_PATH}" \
      --region "${AWS_REGION:-us-east-1}" \
      --recursive >> "${DIAG_DIR}/ssm.txt" 2>&1 || true
  else
    echo "aws CLI not available; skipping SSM lookup" >> "${DIAG_DIR}/ssm.txt"
  fi
else
  echo "No SSM path configured; relying on Amplify environment variables" >> "${DIAG_DIR}/ssm.txt"
fi

echo "=== NODE & NPM ===" > "${DIAG_DIR}/node.txt"
node -v >> "${DIAG_DIR}/node.txt"
npm -v >> "${DIAG_DIR}/node.txt"
