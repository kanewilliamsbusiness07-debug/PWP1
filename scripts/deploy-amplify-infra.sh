#!/usr/bin/env bash
# Deploy CloudFormation templates used by Amplify deployment
# Usage: ./scripts/deploy-amplify-infra.sh <bucket-name>

set -euo pipefail

BUCKET_NAME="$1"
if [ -z "$BUCKET_NAME" ]; then
  echo "Usage: $0 <unique-bucket-name>" >&2
  exit 1
fi

STACK_DDB="fincalc-dynamodb"
STACK_S3="fincalc-pdf-bucket"

echo "Deploying DynamoDB stack ($STACK_DDB)..."
aws cloudformation deploy --template-file infrastructure/dynamodb-tables.yaml --stack-name "$STACK_DDB" --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

echo "Deploying S3 stack ($STACK_S3) with bucket name: $BUCKET_NAME..."
aws cloudformation deploy --template-file infrastructure/s3-pdf-bucket.yaml --stack-name "$STACK_S3" --parameter-overrides BucketName="$BUCKET_NAME" --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

echo "Deployment complete. Remember to set Amplify environment variables: AWS_S3_BUCKET=$BUCKET_NAME and DDB_* table names to the created table names."
