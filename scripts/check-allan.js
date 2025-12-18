const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const REGION = process.env.AWS_REGION || process.env.APP_AWS_REGION || process.env.REGION || 'us-east-1';
const USERS_TABLE = process.env.DDB_USERS_TABLE || 'UsersTable';

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

async function main() {
  try {
    const query = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': 'allan@pwp2026.com.au' },
      Limit: 1,
    });

    const res = await ddb.send(query);
    const user = res?.Items?.[0];

    console.log('User lookup result:', user);
    if (user) {
      const passwordOk = await bcrypt.compare('123456', user.passwordHash || user.passwordHash || '');
      console.log('Password 123456 valid:', passwordOk);
    } else {
      console.log('User not found');
    }
  } catch (err) {
    console.error('Error checking Allan login:', err);
    process.exit(1);
  }
}

main();

