import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const region = process.env.AWS_REGION || process.env.APP_AWS_REGION || 'ap-southeast-2';
const client = new DynamoDBClient({ region });

async function describe(tableName: string) {
  try {
    const res = await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`${tableName}: ${res.Table?.TableStatus} (arn: ${res.Table?.TableArn}, items: ${res.Table?.ItemCount})`);
  } catch (err: any) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`${tableName}: NOT FOUND`);
      return;
    }
    console.error(`${tableName}: ERROR`, err.message || err);
  }
}

async function main() {
  await describe('UsersTable');
  await describe('PdfExportsTable');
  await describe('ClientsTable');
}

main();
