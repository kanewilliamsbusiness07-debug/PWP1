import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const region = process.env.AWS_REGION || process.env.APP_AWS_REGION || 'ap-southeast-2';
const client = new DynamoDBClient({ region });

async function status(tableName: string) {
  try {
    const res = await client.send(new DescribeTableCommand({ TableName: tableName }));
    return res.Table?.TableStatus || 'UNKNOWN';
  } catch (err: any) {
    if (err.name === 'ResourceNotFoundException') return 'NOT_FOUND';
    throw err;
  }
}

async function main() {
  const tables = ['UsersTable', 'PdfExportsTable', 'ClientsTable'];
  const deadline = Date.now() + 5 * 60 * 1000; // 5 minutes
  while (Date.now() < deadline) {
    const results = await Promise.all(tables.map((t) => status(t)));
    console.log('Statuses:', tables.map((t, i) => `${t}=${results[i]}`).join(', '));
    if (results.every((r) => r === 'ACTIVE')) {
      console.log('All tables ACTIVE');
      return;
    }
    await new Promise((res) => setTimeout(res, 5000));
  }
  console.error('Timeout waiting for tables to become ACTIVE');
  process.exit(1);
}

main();
