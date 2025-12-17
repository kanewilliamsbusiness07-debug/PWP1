import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { ddbDocClient } from '@/lib/aws/clients';
import { encryptField } from '@/lib/encryption';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// GET /api/email/integration - Get email integration settings
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const table = process.env.DDB_EMAIL_INTEGRATIONS_TABLE;
    if (!table) return NextResponse.json({ integration: null });

    try {
      const q: any = { TableName: table, IndexName: 'userId-index', KeyConditionExpression: 'userId = :uid', ExpressionAttributeValues: { ':uid': session.user.id } };
      const qRes: any = await ddbDocClient.send(new QueryCommand(q));
      const integration = (qRes.Items || [])[0] || null;
      if (!integration) return NextResponse.json({ integration: null });
      const { encryptedPassword, encryptedAccessToken, encryptedRefreshToken, ...safeIntegration } = integration;
      return NextResponse.json({ integration: safeIntegration });
    } catch (err) {
      console.warn('Email integration lookup failed', err);
      return NextResponse.json({ integration: null });
    }
  } catch (error) {
    console.error('Error getting email integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/email/integration - Create or update email integration
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { provider, email, password, smtpHost, smtpPort, smtpUser, imapHost, imapPort, imapUser } = data;

    if (!provider || !email) {
      return NextResponse.json(
        { error: 'Provider and email are required' },
        { status: 400 }
      );
    }

    // Encrypt password if provided
    const encryptedPassword = password ? encryptField(password) : undefined;

    // Create or update integration in DynamoDB
    const table = process.env.DDB_EMAIL_INTEGRATIONS_TABLE;
    if (!table) return NextResponse.json({ error: 'Server not configured: DDB_EMAIL_INTEGRATIONS_TABLE missing' }, { status: 500 });

    const item = {
      userId: session.user.id,
      provider,
      email,
      encryptedPassword,
      smtpHost,
      smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
      smtpUser,
      imapHost,
      imapPort: imapPort ? parseInt(imapPort) : undefined,
      imapUser,
      isActive: true,
      lastSyncAt: new Date().toISOString()
    } as any;

    await ddbDocClient.send(new PutCommand({ TableName: table, Item: item }));
    const { encryptedPassword: _, encryptedAccessToken, encryptedRefreshToken, ...safeIntegration } = item;
    return NextResponse.json({ integration: safeIntegration });
  } catch (error) {
    console.error('Error saving email integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/email/integration - Delete email integration
export async function DELETE(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const table = process.env.DDB_EMAIL_INTEGRATIONS_TABLE;
    if (!table) return NextResponse.json({ error: 'Server not configured: DDB_EMAIL_INTEGRATIONS_TABLE missing' }, { status: 500 });

    // Delete by userId - DynamoDB primary key may be userId or an id depending on schema
    // We'll perform a scan to find the item then delete it
    const scanRes: any = await ddbDocClient.send({ TableName: table } as any);
    const items = (scanRes.Items || []).filter((it:any) => it.userId === session.user.id);
    for (const it of items) {
      await ddbDocClient.send(new DeleteCommand({ TableName: table, Key: { id: it.id } } as any));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

