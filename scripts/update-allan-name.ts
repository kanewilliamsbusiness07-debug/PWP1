/**
 * Script to update Allan's name from "Allan Chambers" to "Allan Kutup"
 * Run with: npx tsx scripts/update-allan-name.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * Script to update Allan's name from "Allan Chambers" to "Allan Kutup" using DynamoDB
 * Run with: npx tsx scripts/update-allan-name.ts
 */

const REGION = process.env.AWS_REGION || process.env.APP_AWS_REGION || process.env.REGION || 'us-east-1';
const USERS_TABLE = process.env.DDB_USERS_TABLE || 'UsersTable';

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

async function main() {
  try {
    console.log('🔍 Looking for user with email: allan@pwp2026.com.au');

    const query = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': 'allan@pwp2026.com.au' },
      Limit: 1,
    });

    const res = await ddb.send(query);
    const user = res?.Items?.[0] as any | undefined;

    if (!user) {
      console.error('❌ User not found with email: allan@pwp2026.com.au');
      console.log('💡 Make sure the user exists in the Users table first.');
      return;
    }

    console.log(`📝 Current name: "${user.name}"`);

    if (user.name === 'Allan Kutup') {
      console.log('✅ Name is already "Allan Kutup", no update needed.');
      return;
    }

    console.log('🔄 Updating name to "Allan Kutup"...');

    const update = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: user.id },
      UpdateExpression: 'SET #n = :name',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: { ':name': 'Allan Kutup' },
      ReturnValues: 'ALL_NEW',
    });

    const updated = await ddb.send(update);

    console.log('✅ Successfully updated!');
    console.log(`   Old name: "${user.name}"`);
    console.log(`   New name: "${updated.Attributes?.name}"`);
    console.log('\n💡 You may need to log out and log back in to see the change in the UI.');
  } catch (error) {
    console.error('❌ Error updating user:', error);
  }
}

main();

