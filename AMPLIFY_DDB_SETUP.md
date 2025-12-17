# Amplify / DynamoDB / S3 Setup Guide ✅

This project uses AWS DynamoDB for metadata and S3 (Amplify Storage) for PDF storage. The repository includes CloudFormation templates you can deploy via Amplify or the AWS CLI/Console.

Files added:
- `infrastructure/dynamodb-tables.yaml` — CloudFormation template to create required DynamoDB tables and GSIs.
- `infrastructure/s3-pdf-bucket.yaml` — CloudFormation template to create an S3 bucket for `pdfs/` storage with versioning and lifecycle rule.

Tip: You can deploy both templates with the included helper script:

```bash
# Linux/macOS
npm run infra:deploy:amplify:sh -- <your-unique-bucket-name>
# Windows (PowerShell)
npm run infra:deploy:amplify -- -BucketName <your-unique-bucket-name>
```

Recommended steps (Amplify-friendly)
1. Ensure you have Amplify CLI and AWS credentials configured.
   - `npm i -g @aws-amplify/cli` (if needed)
   - `amplify configure` to set up an IAM user and profile.

2. Create the S3 bucket (choose a globally unique name):
   - `aws cloudformation deploy --template-file infrastructure/s3-pdf-bucket.yaml --stack-name fincalc-pdf-bucket --parameter-overrides BucketName=your-unique-bucket-name --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM` 
   - OR use Amplify Storage: `amplify add storage` and configure a private S3 bucket, then `amplify push`.

3. Create DynamoDB tables (deploy the stack):
   - `aws cloudformation deploy --template-file infrastructure/dynamodb-tables.yaml --stack-name fincalc-dynamodb --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM`

4. After deploy: set the following environment variables in your local `.env.local` (or Amplify Console environment variables):
   - `AWS_S3_BUCKET` = your S3 bucket name
   - `DDB_PDF_EXPORTS_TABLE` = <stack-name>-pdf-exports
   - `DDB_CLIENTS_TABLE` = <stack-name>-clients
   - `DDB_USERS_TABLE` = <stack-name>-users
   - `DDB_EMAIL_TEMPLATES_TABLE` = <stack-name>-email-templates
   - `DDB_EMAIL_INTEGRATIONS_TABLE` = <stack-name>-email-integrations
   - `DDB_APPOINTMENTS_TABLE` = <stack-name>-appointments
   - `DDB_RECENT_CLIENT_ACCESS_TABLE` = <stack-name>-recent-client-access

5. Run a dry-run of the migration script:
   - `npm run migrate:prisma-to-ddb:dry -- --models=pdfs,clients` (confirm output, no writes)

6. Run the real migration (start with a small subset):
   - `npm run migrate:prisma-to-ddb -- --models=pdfs,clients`

7. Verify in AWS Console or via the `app/api/pdf-exports` endpoints that PDF exports return metadata and S3 key.

IAM notes (for Lambda/Functions/Server)
- The server (or Amplify function) requires these privileges:
  - s3:PutObject, s3:GetObject, s3:DeleteObject on the PDF bucket
  - dynamodb:PutItem, GetItem, Query, Scan, UpdateItem, DeleteItem on the tables

CI notes
- Add these env vars to Amplify Console/CI: `AWS_S3_BUCKET`, `DDB_*` table names, and AWS credentials if needed (or use an IAM role)

Need help? I can:
- Scaffold Amplify resources directly (amplify/backend/*) to integrate with `amplify push`.
- Add CloudFormation parameters for stack names and a small CloudFormation wrapper to deploy both resources in one command.
- Run a test migration of a subset of records in your account (you'll need to provide access or run locally with your AWS credentials).
