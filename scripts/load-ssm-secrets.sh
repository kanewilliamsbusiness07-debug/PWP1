#!/usr/bin/env bash
set -euo pipefail

# Loads secrets from AWS Systems Manager Parameter Store
# Used during Amplify build to inject environment variables from SSM

APP_ID="${AMPLIFY_APP_ID:-d3ry622jxpwz6}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Get environment name from script
if [ -f "scripts/get-amplify-env.js" ]; then
  ENV_NAME=$(node scripts/get-amplify-env.js)
else
  ENV_NAME="${AMPLIFY_ENV:-prod}"
fi

SSM_PATH="/amplify/${APP_ID}/${ENV_NAME}/"

echo "🔍 Loading SSM parameters from: ${SSM_PATH}"

# Check if AWS CLI is available
if ! command -v aws >/dev/null 2>&1; then
  echo "⚠️  AWS CLI not available, skipping SSM parameter loading"
  echo "   Environment variables will be loaded from Amplify Console"
  exit 0
fi

# Check if we have AWS credentials
if [ -z "${AWS_ACCESS_KEY_ID:-}" ] && [ -z "${AWS_SESSION_TOKEN:-}" ]; then
  echo "ℹ️  AWS credentials not available, skipping SSM parameter loading"
  echo "   Environment variables will be loaded from Amplify Console"
  exit 0
fi

# Create .env.local file
ENV_FILE=".env.local"
touch "${ENV_FILE}"

# Get parameters from SSM
PARAMS_JSON=$(aws ssm get-parameters-by-path \
  --path "${SSM_PATH}" \
  --recursive \
  --region "${AWS_REGION}" \
  --with-decryption \
  --output json 2>&1) || {
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 254 ] || echo "${PARAMS_JSON}" | grep -q "AccessDenied"; then
    echo "⚠️  Access denied to SSM Parameter Store"
    echo "   Ensure Amplify build role has ssm:GetParametersByPath permission"
    echo "   Falling back to Amplify Console environment variables"
    exit 0
  elif echo "${PARAMS_JSON}" | grep -q "ParameterNotFound\|InvalidParameter"; then
    echo "⚠️  SSM path not found: ${SSM_PATH}"
    echo "   Using Amplify Console environment variables instead"
    exit 0
  else
    echo "⚠️  Error loading SSM parameters: ${PARAMS_JSON}"
    echo "   Using Amplify Console environment variables instead"
    exit 0
  fi
}

# Parse parameters and write to .env.local
PARAM_COUNT=$(echo "${PARAMS_JSON}" | jq -r '.Parameters | length' 2>/dev/null || echo "0")

if [ "${PARAM_COUNT}" = "0" ] || [ "${PARAM_COUNT}" = "null" ]; then
  echo "⚠️  No SSM parameters found at ${SSM_PATH}"
  echo "   Using Amplify Console environment variables instead"
  exit 0
fi

# Extract parameters and write to .env.local
echo "${PARAMS_JSON}" | jq -r '.Parameters[] | "\(.Name | split("/") | .[-1])=\(.Value)"' >> "${ENV_FILE}" 2>/dev/null || {
  # Fallback if jq is not available - use basic parsing
  echo "${PARAMS_JSON}" | grep -o '"Name":"[^"]*"' | sed 's/"Name":"//;s/"$//' | while read -r param_name; do
    param_key=$(echo "${param_name}" | awk -F'/' '{print $NF}')
    param_value=$(aws ssm get-parameter --name "${param_name}" --region "${AWS_REGION}" --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo "")
    if [ -n "${param_value}" ]; then
      echo "${param_key}=${param_value}" >> "${ENV_FILE}"
      echo "✅ Loaded: ${param_key}"
    fi
  done
}

LOADED_COUNT=$(wc -l < "${ENV_FILE}" 2>/dev/null || echo "0")
if [ "${LOADED_COUNT}" -gt 0 ]; then
  echo "✅ Loaded ${LOADED_COUNT} environment variables from SSM"
else
  echo "⚠️  No parameters were loaded, using Amplify Console environment variables"
  rm -f "${ENV_FILE}"
fi

