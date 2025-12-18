import { IAMClient, AttachRolePolicyCommand } from '@aws-sdk/client-iam';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import fetch from 'node-fetch';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

async function main() {
  try {
    console.log('Fetching env-check to discover resources...');
    const envRes = await fetch('https://main.d3ry622jxpwz6.amplifyapp.com/api/env-check');
    if (!envRes.ok) throw new Error('Failed to fetch env-check: ' + envRes.status);
    const envJson = await envRes.json();

    const region = envJson.required?.AWS_REGION || process.env.AWS_REGION || 'ap-southeast-2';
    const bucket = envJson.required?.AWS_S3_BUCKET && envJson.required.AWS_S3_BUCKET !== 'NOT SET' ? envJson.required.AWS_S3_BUCKET : (envJson.allRelevant?.AWS_S3_BUCKET || process.env.APP_AWS_S3_BUCKET);
    const usersTable = envJson.required?.DDB_USERS_TABLE || process.env.DDB_USERS_TABLE;
    const pdfTable = envJson.required?.DDB_PDF_EXPORTS_TABLE || process.env.DDB_PDF_EXPORTS_TABLE;
    const clientsTable = envJson.required?.DDB_CLIENTS_TABLE || process.env.DDB_CLIENTS_TABLE;

    if (!usersTable || !pdfTable || !clientsTable) throw new Error('DynamoDB table names not found');
    if (!bucket) throw new Error('S3 bucket not found');
    console.log({ region, bucket, usersTable, pdfTable, clientsTable });

    const deploymentRegion = 'us-east-1'; // Assume deployment region is us-east-1

    const sts = new STSClient({ region: deploymentRegion });
    const caller = await sts.send(new GetCallerIdentityCommand({}));
    const accountId = caller.Account;
    console.log('Account', accountId);

    const functionName = envJson.allRelevant?.AWS_LAMBDA_FUNCTION_NAME;
    if (!functionName) throw new Error('Lambda function name not found in env-check');

    console.log('Getting execution role from Lambda function:', functionName);
    const lambdaClient = new LambdaClient({ region: deploymentRegion });
    const funcRes = await lambdaClient.send(new GetFunctionCommand({ FunctionName: functionName }));
    const roleArn = funcRes.Configuration?.Role;
    if (!roleArn) throw new Error('Could not get role ARN from Lambda function');
    const roleName = roleArn.split('/').pop()!;
    console.log('Execution role:', roleName);

    const iam = new IAMClient({ region: deploymentRegion });

    const policyName = 'PWP-Compute-Access';
    const policyDoc = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'DynamoDBTables',
          Effect: 'Allow',
          Action: [
            'dynamodb:DescribeTable','dynamodb:ListTables','dynamodb:Query','dynamodb:Scan','dynamodb:GetItem','dynamodb:PutItem','dynamodb:UpdateItem'
          ],
          Resource: [
            `arn:aws:dynamodb:${region}:${accountId}:table/${usersTable}`,
            `arn:aws:dynamodb:${region}:${accountId}:table/${pdfTable}`,
            `arn:aws:dynamodb:${region}:${accountId}:table/${clientsTable}`
          ]
        },
        {
          Sid: 'S3Access',
          Effect: 'Allow',
          Action: ['s3:GetObject','s3:PutObject','s3:ListBucket','s3:DeleteObject'],
          Resource: [`arn:aws:s3:::${bucket}`,'`arn:aws:s3:::${bucket}/*`'.replace(/`/g,'')]
        },
        {
          Sid: 'SSMRead',
          Effect: 'Allow',
          Action: ['ssm:GetParameter','ssm:GetParameters','ssm:GetParametersByPath'],
          Resource: [`arn:aws:ssm:${region}:${accountId}:parameter/*`]
        }
      ]
    };

    console.log('Checking for existing local policy');
    // Skip listing policies since permissions may be limited
    const policyArn = `arn:aws:iam::${accountId}:policy/${policyName}`;
    console.log('Assuming policy exists:', policyArn);
    console.log('Attaching policy to role', roleName);
    await iam.send(new AttachRolePolicyCommand({ RoleName: roleName!, PolicyArn: policyArn }));
    console.log('Policy attached successfully.');

    console.log('DONE: Policy attached. Wait a few seconds then re-test /api/auth/test-db');
  } catch (err: any) {
    console.error('Failed:', err.message || err);
    process.exit(1);
  }
}

main();
