import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const region = process.env.AWS_REGION || process.env.APP_AWS_REGION || 'ap-southeast-2';
const client = new DynamoDBClient({ region });

async function tableExists(tableName: string) {
  try {
    const res = await client.send(new DescribeTableCommand({ TableName: tableName }));
    return res && res.Table && res.Table.TableStatus === 'ACTIVE';
  } catch (err: any) {
    if (err.name === 'ResourceNotFoundException') return false;
    throw err;
  }
}

async function createUsersTable() {
  const tableName = 'UsersTable';
  if (await tableExists(tableName)) {
    console.log(`${tableName} already exists and is ACTIVE.`);
    return;
  }

  console.log(`Creating ${tableName}...`);
  const cmd = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    KeySchema: [ { AttributeName: 'id', KeyType: 'HASH' } ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [ { AttributeName: 'email', KeyType: 'HASH' } ],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  });

  const res = await client.send(cmd);
  console.log('CreateTable response for UsersTable:', res.TableDescription?.TableStatus);
}

async function createPdfExportsTable() {
  const tableName = 'PdfExportsTable';
  if (await tableExists(tableName)) {
    console.log(`${tableName} already exists and is ACTIVE.`);
    return;
  }

  console.log(`Creating ${tableName}...`);
  const cmd = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    KeySchema: [ { AttributeName: 'id', KeyType: 'HASH' } ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-createdAt-index',
        KeySchema: [ { AttributeName: 'userId', KeyType: 'HASH' }, { AttributeName: 'createdAt', KeyType: 'RANGE' } ],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  });

  const res = await client.send(cmd);
  console.log('CreateTable response for PdfExportsTable:', res.TableDescription?.TableStatus);
}

async function createClientsTable() {
  const tableName = 'ClientsTable';
  if (await tableExists(tableName)) {
    console.log(`${tableName} already exists and is ACTIVE.`);
    return;
  }

  console.log(`Creating ${tableName}...`);
  const cmd = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    KeySchema: [ { AttributeName: 'id', KeyType: 'HASH' } ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-index',
        KeySchema: [ { AttributeName: 'userId', KeyType: 'HASH' } ],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  });

  const res = await client.send(cmd);
  console.log('CreateTable response for ClientsTable:', res.TableDescription?.TableStatus);
}

async function main() {
  try {
    console.log('Region:', region);
    await createUsersTable();
    await createPdfExportsTable();
    await createClientsTable();
    console.log('Done.');
  } catch (err: any) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
}

main();
