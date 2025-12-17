<#
  Deploy CloudFormation templates used by Amplify deployment.

  This helper deploys the DynamoDB and S3 templates and prints the
  exported resource names. Run in an environment where AWS CLI is configured.

  Usage (PowerShell):
    powershell -ExecutionPolicy Bypass -File ./scripts/deploy-amplify-infra.ps1 -BucketName my-unique-bucket

  Note: You can also use the package.json script: `npm run infra:deploy:amplify`
#>

param(
  [Parameter(Mandatory=$false)]
  [string] $BucketName = ''
)

if (-not $BucketName) {
  Write-Host "No bucket name passed. Please provide a globally unique BucketName. Example:`n  -BucketName my-unique-bucket-name"
  exit 1
}

$stackDDB = "fincalc-dynamodb"
$stackS3  = "fincalc-pdf-bucket"

Write-Host "Deploying DynamoDB CloudFormation stack ($stackDDB)..."
aws cloudformation deploy --template-file infrastructure/dynamodb-tables.yaml --stack-name $stackDDB --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

Write-Host "Deploying S3 CloudFormation stack ($stackS3) with bucket name: $BucketName..."
aws cloudformation deploy --template-file infrastructure/s3-pdf-bucket.yaml --stack-name $stackS3 --parameter-overrides BucketName=$BucketName --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

Write-Host "Deployment complete. Use 'aws cloudformation describe-stacks --stack-name $stackDDB' to inspect outputs and table names."
Write-Host "Remember to set Amplify environment variables to match created resources (AWS_S3_BUCKET, DDB_CLIENTS_TABLE, DDB_PDF_EXPORTS_TABLE, DDB_USERS_TABLE)."
