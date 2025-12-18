import fetch from 'node-fetch';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { IAMClient, CreatePolicyCommand, ListPoliciesCommand, AttachRolePolicyCommand } from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

async function main() {
  try {
    console.log('Fetching runtime env-check to discover function name and resources...');
    const envRes = await fetch('https://main.d3ry622jxpwz6.amplifyapp.com/api/env-check');
    if (!envRes.ok) throw new Error('Failed to fetch env-check: ' + envRes.status);
    const envJson = await envRes.json();

    // Derive values
    const lambdaFn = envJson.allRelevant?.AWS_LAMBDA_FUNCTION_NAME || envJson.allRelevant?.AWS_LAMBDA_FUNCTION || envJson.allRelevant?.AWS_LAMBDA_FUNCTION_NAME;
    const region = envJson.required?.AWS_REGION || process.env.AWS_REGION || 'ap-southeast-2';
    const bucket = envJson.required?.AWS_S3_BUCKET && envJson.required.AWS_S3_BUCKET !== 'NOT SET' ? envJson.required.AWS_S3_BUCKET : (envJson.allRelevant?.AWS_S3_BUCKET || process.env.APP_AWS_S3_BUCKET);
    const usersTable = envJson.required?.DDB_USERS_TABLE || process.env.DDB_USERS_TABLE;
    const pdfTable = envJson.required?.DDB_PDF_EXPORTS_TABLE || process.env.DDB_PDF_EXPORTS_TABLE;
    const clientsTable = envJson.required?.DDB_CLIENTS_TABLE || process.env.DDB_CLIENTS_TABLE;

    if (!lambdaFn) throw new Error('Could not determine Lambda function name from env-check');
    if (!usersTable || !pdfTable || !clientsTable) throw new Error('Required DDB table names not found in env-check');
    if (!bucket) throw new Error('S3 bucket name not found in env-check');

    console.log('Discovered:', { lambdaFn, region, bucket, usersTable, pdfTable, clientsTable });

    // Init clients
    const sts = new STSClient({ region });
    const caller = await sts.send(new GetCallerIdentityCommand({}));
    const accountId = caller.Account;
    if (!accountId) throw new Error('Could not determine account id');
    console.log('Account:', accountId);

    const lambda = new LambdaClient({ region });
    const fnRes = await lambda.send(new GetFunctionCommand({ FunctionName: lambdaFn }));
    const roleArn = fnRes.Configuration?.Role;
    if (!roleArn) throw new Error('Could not determine function role ARN');
    console.log('Function role ARN:', roleArn);

    const roleName = roleArn.split('/').pop();
    console.log('Role name:', roleName);

    // Prepare policy document
    const policyName = 'PWP-Compute-Access';
    const policyDoc = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'DynamoDBTablesAccess',
          Effect: 'Allow',
          Action: [
            'dynamodb:DescribeTable',
            'dynamodb:ListTables',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem'
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
          Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:DeleteObject'],
          Resource: [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`]
        },
        {
          Sid: 'SSMRead',
          Effect: 'Allow',
          Action: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
          Resource: [`arn:aws:ssm:${region}:${accountId}:parameter/*`]
        }
      ]
    };

    // Create or reuse policy
    const iam = new IAMClient({ region });
    console.log('Checking for existing policy...');
    const list = await iam.send(new ListPoliciesCommand({ Scope: 'Local' }));
    const existing = list.Policies?.find(p => p.PolicyName === policyName);
    let policyArn: string | undefined;
    if (existing) {
      policyArn = existing.Arn!;
      console.log('Reusing existing policy ARN:', policyArn);
    } else {
      console.log('Creating policy', policyName);
      const createRes = await iam.send(new CreatePolicyCommand({ PolicyName: policyName, PolicyDocument: JSON.stringify(policyDoc) }));
      policyArn = createRes.Policy?.Arn;
      console.log('Created policy ARN:', policyArn);
    }

    if (!policyArn) throw new Error('Policy ARN not determined');

    // Attach policy to role
    console.log(`Attaching policy ${policyArn} to role ${roleName}...`);
    await iam.send(new AttachRolePolicyCommand({ RoleName: roleName!, PolicyArn: policyArn }));
    console.log('Policy attached.');

    console.log('Done: policy attached. Please allow a few seconds for IAM propagation and then test /api/auth/test-db');

  } catch (err: any) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
