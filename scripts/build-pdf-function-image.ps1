param(
  [string]$ECR_REPO = 'pdf-generator',
  [string]$AWS_REGION = 'us-east-1',
  [string]$IMAGE_TAG = 'latest'
)

if (-not $env:AWS_ACCOUNT_ID) { Write-Error 'Set AWS_ACCOUNT_ID env var'; exit 1 }
$AWS_ACCOUNT_ID = $env:AWS_ACCOUNT_ID
$REPO_URI = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

Write-Output "Logging in to ECR $AWS_REGION..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Create repo if not exists
try { aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION | Out-Null } catch { aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION }

Write-Output 'Building Docker image...'
docker build -t "$ECR_REPO:$IMAGE_TAG" -f amplify/backend/pdf-generator/Dockerfile .

Write-Output "Tagging and pushing image to ECR: $REPO_URI:$IMAGE_TAG"
docker tag "$ECR_REPO:$IMAGE_TAG" "$REPO_URI:$IMAGE_TAG"
docker push "$REPO_URI:$IMAGE_TAG"

Write-Output "Image pushed: $REPO_URI:$IMAGE_TAG"
