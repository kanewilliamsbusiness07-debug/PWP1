# Perpetual Wealth Partners - Professional Financial Planning Application

A comprehensive financial planning platform designed for Australian financial advisors, built with Next.js, TypeScript, and PostgreSQL. Helping clients improve their financial position and plan for retirement.

## 🚀 Features

### Core Functionality
- **Client Management**: Dual client comparison with encrypted PII storage, account-scoped data isolation
- **Financial Projections**: Advanced retirement planning with deficit/surplus analysis
- **Investment Property Analysis**: Property serviceability and negative gearing calculations
- **Tax Optimization**: Current Australian tax calculations with optimization strategies
- **PDF Generation**: Professional reports with automated email delivery
- **Full CRM**: Complete client relationship management with appointment scheduling, email integration, and recent clients tracking
- **Database-Backed Authentication**: Secure login system with account-scoped data access
- **Email Integration**: OAuth and IMAP/SMTP email integration per account
- **Appointment Scheduling**: Full appointment CRUD with automated reminders
- **Canonical Field Mapping**: Unified field naming system for consistent data storage

### Security & Compliance
- **Field-level Encryption**: AES-GCM encryption for sensitive data
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- **Role-based Access Control**: Master admin, advisor, and viewer roles
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: Brute force protection with account lockout

### Technical Features
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Real-time Updates**: Live calculations and form validation
- **Comprehensive Testing**: Unit, integration, and E2E test coverage
- **Docker Deployment**: Production-ready containerized deployment

## 🛠 Tech Stack

- **Frontend**: Next.js 13+, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, AWS DynamoDB (+ S3 for file storage)
- **Storage**: DynamoDB for metadata and S3 for file artifacts (Redis optional for caching)
- **Authentication**: JWT with refresh tokens, bcrypt password hashing
- **PDF Generation**: Puppeteer for server-side PDF creation
- **Email**: SMTP/SendGrid integration
- **Testing**: Jest, Playwright for E2E testing
- **Deployment**: Docker, docker-compose

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+ (optional, for caching)
- Docker and docker-compose (for containerized deployment)

## 🚀 Quick Start

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-bolt-sb1-derrkza2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev:local
   ```
   
   This will automatically set up the required environment variables and start the development server.

4. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with default credentials:
     - **Email:** `allan@pwp2026.com.au`
     - **Password:** `123456`

### Alternative: Manual Environment Setup

If you prefer to set environment variables manually for local development (or when using LocalStack):

```powershell
$env:AWS_REGION="us-east-1"
$env:AWS_S3_BUCKET="local-pdf-bucket"
$env:DDB_CLIENTS_TABLE="ClientsTable"
$env:DDB_PDF_EXPORTS_TABLE="PdfExportsTable"
$env:NEXTAUTH_SECRET="development-nextauth-secret-key-32-chars"
$env:NEXTAUTH_URL="http://localhost:3000"
$env:JWT_SECRET="development-jwt-secret-key-32-characters"
npm run dev
```

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/fincalc-pro.git
cd fincalc-pro
npm install
```

### 2. Environment Setup

```bash
cp env.example .env.local
```

Update the environment variables in `.env.local`:

```bash
# Required Configuration
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-pdf-bucket-name"
DDB_CLIENTS_TABLE="ClientsTable"
DDB_PDF_EXPORTS_TABLE="PdfExportsTable"
NEXTAUTH_SECRET="your-32-character-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-32-character-jwt-secret"
ENCRYPTION_KEY="your-32-character-encryption-key"
CRON_SECRET="your-cron-secret-key"

# Email Configuration
SMTP_HOST="smtp.sendgrid.net"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM="noreply@yourdomain.com"
SMTP_PORT="587"
```

### 3. Storage Setup

This project uses **DynamoDB** (metadata) and **S3** (file storage). For local development you can either configure AWS credentials to use real resources, or mock AWS services with LocalStack.

```bash
# Copy environment template and fill required AWS vars
cp env.example .env.local
# Set at minimum:
# AWS_REGION, AWS_S3_BUCKET, DDB_CLIENTS_TABLE, DDB_PDF_EXPORTS_TABLE

# Optional: run the migration dry-run to generate a report
npm run migrate:prisma-to-ddb:dry
# Review the generated report in tmp/migration-report-*.json

# If you manage infrastructure with CloudFormation, you can use the included helper to deploy templates in `infrastructure/` before running real migrations:
# npm run infra:deploy:amplify:sh -- <your-unique-bucket-name>  # Linux/Mac
# npm run infra:deploy:amplify -- -BucketName <your-unique-bucket-name>  # Windows (PowerShell)
```
### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### Default Accounts

After seeding, a default admin account is created. **IMPORTANT**: Change the default seed account credentials immediately in production by:
1. Creating a new admin user with secure credentials
2. Disabling or deleting the seed account
3. Never committing seed account credentials to the repository

### New Features

#### Login System
The system now uses database-backed authentication. Each user account is isolated, and all data (clients, appointments, emails) is scoped to the logged-in account.

#### Email Integration
Users can configure their email integration in Settings:
- **OAuth Providers**: Gmail, Outlook (coming soon)
- **IMAP/SMTP**: Custom email server configuration
- All email credentials are encrypted at rest
- Email sending uses the account's integrated email address

#### Appointment Scheduling
- Create, edit, delete, and view appointments
- Automatic conflict detection
- Automated reminders sent 24 hours before appointments
- Reminders sent to both client email and account email

#### Recent Clients
- Automatically tracks recently accessed clients per account
- Click any recent client to instantly load their full details
- Account-isolated: each user only sees their own recent clients

#### Canonical Field Mapping
The system normalizes field names to ensure consistency:
- `grossSalary`, `grossIncome`, `employmentIncome` → `annualIncome`
- All synonyms are automatically normalized on save
- Data remains consistent across the entire application

#### Email Results
The summary page's "Email Results" feature now sends to:
- Client email (from client information page)
- Account login email (authenticated user's email)
- Both emails are required; validation errors prevent sending if either is missing

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
# Copy and configure production environment
cp .env.example .env.production

# Deploy with production profile
docker-compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## ☁️ AWS Amplify Deployment

Deploy to AWS Amplify for managed hosting with automatic CI/CD:

1. **Create or deploy infrastructure** first (DynamoDB tables & S3 bucket). You can deploy the CloudFormation templates in `infrastructure/` or use the Amplify Console / Amplify CLI to provision resources.
2. **Connect your Git repository** to AWS Amplify Console
3. **Configure environment variables** in Amplify Console (minimum required):
   - `AWS_S3_BUCKET` - name of S3 bucket for PDFs
   - `DDB_CLIENTS_TABLE`, `DDB_PDF_EXPORTS_TABLE`, `DDB_USERS_TABLE`, etc. (see `env.production.example`)
   - `NEXTAUTH_URL` - Your Amplify app URL
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
4. **Set App root** to `project` in Amplify Console
5. **Deploy** - Amplify will automatically build and deploy on every push (ensure infra and env vars are configured first)

See [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md) for detailed instructions.

## 📊 Australian Tax Rules Configuration

FinCalc Pro uses a pluggable tax engine that must be updated with current ATO rates:

### Manual Update

1. Access Admin Panel → Tax Rules
2. Upload current tax rules JSON or paste updated rates
3. Verify calculations against ATO calculator
4. Apply updates

### Automated Update

Set up a scheduled job to fetch current rates:

```bash
# Add to cron or CI/CD pipeline
curl -X POST https://yourapp.com/api/admin/tax-rules/update \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "https://api.ato.gov.au/tax-rules"}'
```

### Tax Rules Format

```json
{
  "version": "2024-25",
  "effectiveDate": "2024-07-01",
  "incomeTaxBrackets": [...],
  "medicareLevy": {...},
  "hecsThresholds": [...],
  "negativeGearing": {...}
}
```

## 🧪 Testing

### Unit Tests

```bash
npm test
npm run test:coverage
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npx playwright install
npm run test:e2e
```

## 📈 Financial Calculations

### Implemented Formulas

1. **Loan Amortization**
   ```
   PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
   ```

2. **Future Value Projection**
   ```
   FV = PV * (1 + r)^t
   ```

3. **Retirement Deficit/Surplus**
   ```
   If (PassiveIncome - DebtPayments) < 0.7 * CurrentSalary:
     MonthlyDeficit = ((0.7 * CurrentSalary) - (PassiveIncome - DebtPayments)) / 12
   ```

4. **Property Serviceability**
   ```
   MaxBorrow = MonthlyCapacity * [(1+r)^n - 1] / [r(1+r)^n]
   ```

### Assumptions

Default assumptions are based on Australian market conditions:
- Property growth: 6.5% p.a.
- Share market return: 9.5% p.a.
- Super fund return: 7.5% p.a.
- Inflation: 2.5% p.a.
- Safe withdrawal rate: 4% p.a.

## 🔐 Security Considerations

### Data Protection

- All PII fields encrypted at rest using AES-GCM
- Passwords hashed with bcrypt (12+ salt rounds)
- JWT tokens with short expiry and secure refresh mechanism
- Rate limiting on all authentication endpoints

### Access Control

- Role-based permissions (Master Admin, Advisor, Viewer)
- Master admin impersonation with audit logging
- Session management with secure cookies
- CSRF protection on all state-changing operations

### Compliance

- Audit logs for all critical actions
- Data retention policies configurable
- GDPR/Australian Privacy Act considerations
- Secure file upload with virus scanning

## 🚨 Monitoring & Alerts

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database connectivity
curl http://localhost:3000/api/health/db

# External services
curl http://localhost:3000/api/health/email
```

### Metrics

- Response times and error rates
- Database query performance  
- PDF generation success rates
- Email delivery status
- Failed login attempts

## 📖 API Documentation

### Authentication

```bash
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/setup-2fa
POST /api/auth/verify-2fa
```

### Client Management

```bash
GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PATCH  /api/clients/:id
DELETE /api/clients/:id
```

### Financial Calculations

```bash
POST /api/calculations/retirement-projection
POST /api/calculations/tax-optimization
POST /api/calculations/property-serviceability
```

### PDF & Reports

```bash
POST /api/clients/:id/generate-pdf
POST /api/clients/:id/email-report
GET  /api/pdf-exports/:id/download
```

## 🔄 Maintenance

### Regular Tasks

1. **Tax Rules Updates**: Monthly check of ATO rates
2. **Database Backups**: Daily automated backups
3. **Security Updates**: Weekly dependency updates
4. **Performance Monitoring**: Continuous monitoring
5. **Audit Log Review**: Monthly compliance checks
6. **Appointment Reminders**: Set up cron job to call `/api/cron/appointment-reminders` hourly

### Setting Up Appointment Reminders

Configure a cron job to call the appointment reminder endpoint:

```bash
# Example cron job (runs every hour)
0 * * * * curl -X GET https://yourapp.com/api/cron/appointment-reminders -H "Authorization: Bearer $CRON_SECRET"
```

Or use Vercel Cron:
```json
{
  "crons": [{
    "path": "/api/cron/appointment-reminders",
    "schedule": "0 * * * *"
  }]
}
```

### Persistence & Maintenance

This project uses **DynamoDB** and **S3** for persistence. Typical maintenance tasks are:

- Backups: Use DynamoDB point-in-time recovery (PITR) or on-demand export to S3
- Cleanup: Use TTLs on tables or scheduled jobs to remove old audit logs
- Optimization: Monitor CloudWatch metrics (Read/Write capacity) and enable autoscaling as needed

Refer to AWS documentation for full maintenance procedures for DynamoDB and S3.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow conventional commit messages
- Ensure security review for sensitive changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [https://docs.perpetualwealthpartners.com](https://docs.perpetualwealthpartners.com)
- Issues: [GitHub Issues](https://github.com/yourusername/perpetual-wealth-partners/issues)
- Email: support@perpetualwealthpartners.com

---

**⚠️ Important Security Notice**: This application handles sensitive financial data. Ensure all environment variables are properly configured, use HTTPS in production, and regularly update tax rules to maintain compliance with current Australian taxation laws.

*Perpetual Wealth Partners - Building wealth. Securing futures. Creating legacies.*