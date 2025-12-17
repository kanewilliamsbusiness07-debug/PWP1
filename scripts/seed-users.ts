import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed the Users table in DynamoDB with a default admin user (Allan)
 * Run with: npx tsx scripts/seed-users.ts
 */

const REGION = process.env.AWS_REGION || 'us-east-1';
const USERS_TABLE = process.env.DDB_USERS_TABLE || 'UsersTable';

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

async function main() {
  try {
    const defaultEmail = 'allan@pwp2026.com.au';
    const defaultPassword = '123456';

    console.log(`🌱 Seeding Users table (${USERS_TABLE}) with ${defaultEmail}`);

    // Try to find existing user via email GSI
    const getCmd = new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: defaultEmail },
    });

    // Because users table uses id as hash key, and we may not know id, attempt a scan by email index
    // (Note: in production use Query against email-index; here we try both)
    // First, try Get by id = email (common for seeded users)
    let existing: any = null;
    try {
      const res = await ddb.send(getCmd);
      existing = res.Item;
    } catch (e) {
      // ignore
    }

    // If not found, try querying the email-index
    if (!existing) {
      try {
        const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');
        const queryRes = await ddb.send(new QueryCommand({
          TableName: USERS_TABLE,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': defaultEmail },
          Limit: 1,
        }));
        existing = queryRes?.Items?.[0];
      } catch (e) {
        // ignore
      }
    }

    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    if (existing) {
      console.log('🔁 User already exists. Updating password and ensuring active status.');
      const updateCmd = new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          ...existing,
          passwordHash: hashedPassword,
          isActive: true,
          name: existing.name || 'Allan Kutup',
        },
      });
      await ddb.send(updateCmd);
      console.log('✅ Updated existing user.');
    } else {
      console.log('✨ Creating new user record');
      const id = uuidv4();
      const putCmd = new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          id,
          email: defaultEmail,
          name: 'Allan Kutup',
          passwordHash: hashedPassword,
          role: 'ADVISOR',
          isMasterAdmin: true,
          isActive: true,
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      await ddb.send(putCmd);
      console.log(`✅ Created user ${defaultEmail} (id: ${id})`);
    }

    console.log('✅ Users seed completed successfully!');
    console.log(`   Email: ${defaultEmail}`);
    console.log(`   Password: ${defaultPassword} (change this in production!)`);
  } catch (error: any) {
    console.error('❌ Error seeding Users table:', error);
    process.exit(1);
  }
}

main();
