#!/usr/bin/env bash
set -euo pipefail

# Builds the PDF generator Docker image and pushes to ECR.
# Required env vars: AWS_ACCOUNT_ID, AWS_REGION, ECR_REPO (name), IMAGE_TAG (optional)

ECR_REPO=${ECR_REPO:-pdf-generator}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-}
IMAGE_TAG=${IMAGE_TAG:-latest}

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  echo "ERROR: Set AWS_ACCOUNT_ID environment variable"
  exit 1
fi

REPO_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}

echo "Logging in to ECR ${AWS_REGION}..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Create ECR repo if it doesn't exist
if ! aws ecr describe-repositories --repository-names ${ECR_REPO} --region ${AWS_REGION} >/dev/null 2>&1; then
  echo "Creating ECR repo: ${ECR_REPO}"
  aws ecr create-repository --repository-name ${ECR_REPO} --region ${AWS_REGION} || true
fi

echo "Building Docker image..."
docker build -t ${ECR_REPO}:${IMAGE_TAG} -f amplify/backend/pdf-generator/Dockerfile .

echo "Tagging and pushing image to ECR: ${REPO_URI}:${IMAGE_TAG}"
docker tag ${ECR_REPO}:${IMAGE_TAG} ${REPO_URI}:${IMAGE_TAG}
docker push ${REPO_URI}:${IMAGE_TAG}

echo "Image pushed: ${REPO_URI}:${IMAGE_TAG}"

echo "You can configure your Lambda to use this container image and set CHROMIUM_PATH if needed."
