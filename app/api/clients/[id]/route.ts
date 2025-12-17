import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient } from '@/lib/aws/clients';
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { normalizeFields } from '@/lib/utils/field-mapping';

// GET /api/clients/[id] - Get a single client (account-scoped)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Get client and verify it belongs to the user (DynamoDB)
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    if (!clientsTable) return NextResponse.json({ error: 'Server not configured: DDB_CLIENTS_TABLE missing' }, { status: 500 });

    const res: any = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: clientId } } as any));
    const client = res.Item;

    if (!client || client.userId !== session.user.id) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Track recent access in DDB_RECENT_CLIENT_ACCESS_TABLE
    const recentTable = process.env.DDB_RECENT_CLIENT_ACCESS_TABLE;
    if (recentTable) {
      await ddbDocClient.send(new PutCommand({ TableName: recentTable, Item: { userId: session.user.id, clientId: client.id, accessedAt: new Date().toISOString() } } as any));
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error getting client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/clients/[id] - Update a client (with field normalization)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const clientId = params.id;
    const data = await req.json();

    // Verify client exists and belongs to user
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    if (!clientsTable) return NextResponse.json({ error: 'Server not configured: DDB_CLIENTS_TABLE missing' }, { status: 500 });

    const g: any = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: clientId } } as any));
    const existingClient = g.Item;
    if (!existingClient || existingClient.userId !== session.user.id) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Normalize field names
    const normalizedData = normalizeFields(data);
    if (normalizedData.dob) normalizedData.dob = new Date(normalizedData.dob).toISOString();

    // Build update expression
    const exprVals: any = { ':updatedAt': new Date().toISOString() };
    let updateExpr = 'SET updatedAt = :updatedAt';
    Object.keys(normalizedData).forEach((key, idx) => {
      const placeholder = `:v${idx}`;
      updateExpr += `, ${key} = ${placeholder}`;
      exprVals[placeholder] = normalizedData[key] === undefined ? null : normalizedData[key];
    });

    await ddbDocClient.send(new UpdateCommand({ TableName: clientsTable, Key: { id: clientId }, UpdateExpression: updateExpr, ExpressionAttributeValues: exprVals } as any));

    // Track recent access
    const recentTable = process.env.DDB_RECENT_CLIENT_ACCESS_TABLE;
    if (recentTable) {
      await ddbDocClient.send(new PutCommand({ TableName: recentTable, Item: { userId: session.user.id, clientId, accessedAt: new Date().toISOString() } } as any));
    }

    const updatedRes: any = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: clientId } } as any));
    const client = updatedRes.Item;
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('=== DELETE CLIENT API ===');
  
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    console.log('Session exists:', !!session);
    console.log('User ID:', session?.user?.id || 'none');
    
    if (!session?.user?.id) {
      console.log('No session - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const clientId = params.id;
    
    console.log('Client ID to delete:', clientId);
    console.log('Client ID type:', typeof clientId);
    console.log('Session user ID:', session.user.id);
    console.log('Session user ID type:', typeof session.user.id);

    // Check if client exists
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    if (!clientsTable) return NextResponse.json({ error: 'Server not configured: DDB_CLIENTS_TABLE missing' }, { status: 500 });

    const anyRes: any = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: clientId } } as any));
    const anyClient = anyRes.Item;

    if (!anyClient) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    if (anyClient.userId !== session.user.id) return NextResponse.json({ error: 'Client not found or access denied', details: 'Client exists but does not belong to your account' }, { status: 404 });

    // Delete client record
    await ddbDocClient.send(new DeleteCommand({ TableName: clientsTable, Key: { id: clientId } } as any));

    return NextResponse.json({ success: true, message: 'Client deleted successfully', deletedId: clientId });
  } catch (error: any) {
    console.error('=== DELETE CLIENT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to delete client',
      details: error.message 
    }, { status: 500 });
  }
}
