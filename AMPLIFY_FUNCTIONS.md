# Amplify Functions & PDF Generator (scaffolded)

This project now includes an Amplify Function scaffold for server-side PDF generation and upload.

Files created:
- `amplify/backend/pdf-generator/resource.ts` — function resource definition
- `amplify/backend/pdf-generator/handler.ts` — Lambda handler (uploads PDF to S3 and writes metadata to DynamoDB). Note: the handler includes a placeholder PDF generator. For production PDF rendering, provide a Lambda Layer with headless Chromium or use a container image.
- `amplify/backend.ts` — simplified backend index that registers the function

How to test locally with AMPLIFY sandbox:
1. Install ampx (if not installed): `npm i -g @amplify/cli@latest` and `npm i -g @amplify/sandbox` (or use `npx ampx`)
2. Start the sandbox: `npx ampx sandbox`
3. You can invoke the function via the sandbox local URL or via the Amplify CLI tooling.

IAM and permissions:
- The function will need the following IAM permissions (Amplify will prompt for these when adding storage or editing function policies):
  - s3:PutObject, s3:GetObject, s3:DeleteObject on the PDF bucket
  - dynamodb:PutItem, GetItem on the DDB table for PDF exports
  - If running Puppeteer in Lambda or container, ensure required permissions to log and write temporary files are available and memory/timeout settings are sufficient.

Function invocation from Next.js API:
- This repo now supports invoking the Amplify PDF function from the server via Lambda Invoke.
- Set `PDF_GENERATOR_FUNCTION_NAME` (or `PDF_GENERATOR_LAMBDA`) env var to the function name to enable invocation.
- When set, the Next.js `/api/pdf-generate` route will call the function and return `{ success: true, pdfExport }` on success.

Building & deploying a container image for full PDF rendering:
1. Ensure you have an ECR repository and `AWS_ACCOUNT_ID` + `AWS_REGION` environment variables set.
2. Build & push image (Linux/Mac):
   - `ECR_REPO=pdf-generator AWS_REGION=us-east-1 AWS_ACCOUNT_ID=123456789012 IMAGE_TAG=latest ./scripts/build-pdf-function-image.sh`
3. Or use PowerShell on Windows:
   - `setx AWS_ACCOUNT_ID "123456789012"; ./scripts/build-pdf-function-image.ps1 -ECR_REPO pdf-generator -AWS_REGION us-east-1 -IMAGE_TAG latest`
4. Update your Lambda function to use the container image (Amplify Console or AWS Console) and set `CHROMIUM_PATH` if needed (path inside image to Chromium binary).

Attaching IAM policy & role:
- A role template `amplify/backend/pdf-generator/role-template.json` is provided; you can apply it during your Amplify deployment or use CloudFormation to create the role and attach it to the function. It grants S3 + DynamoDB permissions that the function needs.

Testing locally:
- Use `npx ampx sandbox` or `npm run amplify:open` to run the function in the Amplify sandbox, but note Puppeteer rendering will fall back if Chromium isn't present in the sandbox.

Production notes:
- Puppeteer/Chromium in Lambda requires special packaging; consider using a container image or `chrome-aws-lambda` layer.
- Consider using a dedicated Lambda for heavy PDF generation and keep the Next.js API route as a thin proxy that invokes the function.
- Configure environment variables on Amplify Console: `AWS_S3_BUCKET`, `DDB_PDF_EXPORTS_TABLE`, `AWS_REGION`.

Next steps I can take:
- Add an IAM policy template for the function to the Amplify resource so `amplify push` will request correct permissions.
- Replace the Next.js `/api/pdf-generate` route to invoke the Amplify function via a REST endpoint or via direct SDK invocation.
- Create a container image builder script that packages headless Chromium for the function if you want full PDF rendering capability.
