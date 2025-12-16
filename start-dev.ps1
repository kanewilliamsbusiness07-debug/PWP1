# FinCalc Pro Development Startup Script
# This script sets the required environment variables and starts the development server

# Set environment variables
$env:DATABASE_URL="postgres://bbe2e42e19dff62fe30b7dc49ade4c9d4aed1a0e40f0d9e7aeae0c6926939076:sk_zWEMokrgWkBTPV5adw6WL@db.prisma.io:5432/postgres?sslmode=require"
$env:NEXTAUTH_SECRET="development-nextauth-secret-key-32-chars"
$env:NEXTAUTH_URL="http://localhost:3000"
$env:JWT_SECRET="development-jwt-secret-key-32-characters"
$env:ENCRYPTION_KEY="32-character-encryption-key-for-dev"
$env:CRON_SECRET="local-cron-secret"

# Optional email settings
$env:SMTP_HOST="smtp.office365.com"
$env:SMTP_USER="admin@pwp2026.com.au"
$env:SMTP_PASSWORD="Allan@godaddy1963"
$env:SMTP_FROM="admin@pwp2026.com.au"
$env:SMTP_FROM_NAME="Perpetual Wealth Partners"
$env:SMTP_PORT="587"

Write-Host "Environment variables set. Starting development server..."
Write-Host "Database URL: $env:DATABASE_URL"
Write-Host "NextAuth URL: $env:NEXTAUTH_URL"
Write-Host ""

# Start the development server
npm run dev