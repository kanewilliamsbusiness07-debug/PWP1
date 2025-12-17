# FinCalc Pro Development Startup Script
# This script sets the required environment variables and starts the development server

# Set environment variables (AWS-based storage)
$env:AWS_S3_BUCKET="your-local-s3-bucket-name"
$env:DDB_CLIENTS_TABLE="ClientsTable"
$env:DDB_PDF_EXPORTS_TABLE="PdfExportsTable"
$env:DDB_USERS_TABLE="UsersTable"
$env:NEXTAUTH_SECRET="development-nextauth-secret-key-32-chars"
$env:NEXTAUTH_URL="http://localhost:3000"
$env:JWT_SECRET="development-jwt-secret-key-32-characters"
$env:ENCRYPTION_KEY="32-character-encryption-key-for-dev"
$env:CRON_SECRET="local-cron-secret"

# Optional email settings (use environment-safe placeholders)
$env:SMTP_HOST="smtp.office365.com"
$env:SMTP_USER="admin@pwp2026.com.au"
$env:SMTP_PASSWORD="your-email-password"
$env:SMTP_FROM="admin@pwp2026.com.au"
$env:SMTP_FROM_NAME="Perpetual Wealth Partners"
$env:SMTP_PORT="587"

Write-Host "Environment variables set. Starting development server..."
Write-Host "Storage bucket: $env:AWS_S3_BUCKET"
Write-Host "DynamoDB Clients Table: $env:DDB_CLIENTS_TABLE"
Write-Host "NextAuth URL: $env:NEXTAUTH_URL"
Write-Host ""

# Start the development server
npm run dev