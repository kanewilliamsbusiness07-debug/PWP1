import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient } from '@/lib/aws/clients';
import { PutCommand, QueryCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { normalizeFields } from '@/lib/utils/field-mapping';

// GET /api/clients - List clients (account-scoped) with recent clients support
export async function GET(req: NextRequest) {
  console.log('=== CLIENTS API GET CALLED ===');
  
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    console.log('Session exists:', !!session);
    console.log('User ID:', session?.user?.id || 'none');
    
    if (!session?.user?.id) {
      console.log('No session - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user!.id as string;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const recent = searchParams.get('recent') === 'true';

    console.log('Fetching clients with limit:', limit);
    console.log('Search term:', search || 'none');
    console.log('Recent only:', recent);

    if (recent) {
      // Get recent client accesses from DynamoDB
      const recentTable = process.env.DDB_RECENT_CLIENT_ACCESS_TABLE;
      const clientsTable = process.env.DDB_CLIENTS_TABLE;
      if (recentTable && clientsTable) {
        try {
          const q = {
            TableName: recentTable,
            IndexName: 'userId-accessedAt-index',
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': session.user.id },
            ScanIndexForward: false,
            Limit: limit
          } as any;

          const res = await ddbDocClient.send(new QueryCommand(q));
          const items = res.Items || [];
          const clientIds = items.map((it:any) => it.clientId).filter(Boolean);

          // Batch get clients (simple sequential gets to avoid complexity)
          const clients: any[] = [];
          for (const cid of clientIds) {
            const g = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: cid } } as any));
            if (g && g.Item) clients.push(g.Item);
          }

          return NextResponse.json(clients);
        } catch (e) {
          console.warn('Recent clients lookup failed, falling back to empty');
          return NextResponse.json([]);
        }
      }

      return NextResponse.json([]);
    }

    // Get all clients for this user
    const where: any = {
      userId: session.user.id
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Query DynamoDB clients table - prefer a GSI for userId, fall back to scan
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    try {
      if (clientsTable) {
        // Attempt to query using a GSI (userId-updatedAt-index)
        try {
          const q: any = {
            TableName: clientsTable,
            IndexName: 'userId-updatedAt-index',
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': session.user.id },
            ScanIndexForward: false,
            Limit: limit
          };
          if (search) {
            // No direct support in key condition - fallback to scan
            throw new Error('search-not-supported-in-query');
          }
          const qRes = await ddbDocClient.send(new QueryCommand(q));
          const items = qRes.Items || [];
          return NextResponse.json(items);
        } catch (qErr) {
          // Fallback to a scan and filter for search & userId
          const scanParams: any = { TableName: clientsTable };
          const scanRes = await ddbDocClient.send(new ScanCommand(scanParams));
          const all = scanRes.Items || [];
          const filtered = all.filter((c: any) => c.userId === userId && (!search || (
            (c.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.lastName || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(search.toLowerCase())
          ))).slice(0, limit);
          return NextResponse.json(filtered);
        }
      }

      return NextResponse.json([]);
    } catch (err) {
      console.error('Error querying clients table:', err);
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('=== CLIENTS API ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST /api/clients - Create a new client (with field normalization)
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    console.log('[Clients API POST] Received data:', JSON.stringify(data, null, 2));

    // Normalize field names to canonical forms
    const normalizedData = normalizeFields(data);

    console.log('[Clients API POST] Normalized data:', JSON.stringify(normalizedData, null, 2));

    // Ensure required fields
    if (!normalizedData.firstName || !normalizedData.lastName || !normalizedData.dob) {
      return NextResponse.json(
        { error: 'First name, last name, and date of birth are required' },
        { status: 400 }
      );
    }

    // Ensure maritalStatus has a default value if missing (required by schema)
    if (!normalizedData.maritalStatus) {
      normalizedData.maritalStatus = 'SINGLE';
    }

    // Prepare data for Prisma - only include fields that exist in the schema
    const clientData: any = {
      userId: session.user.id,
      firstName: normalizedData.firstName,
      lastName: normalizedData.lastName,
      dob: new Date(normalizedData.dob).toISOString(),
      maritalStatus: normalizedData.maritalStatus || 'SINGLE',
      numberOfDependants: normalizedData.numberOfDependants ?? 0,
    };

    // Add optional fields if present
    if (normalizedData.middleName !== undefined) clientData.middleName = normalizedData.middleName;
    if (normalizedData.email !== undefined) clientData.email = normalizedData.email;
    if (normalizedData.mobile !== undefined) clientData.mobile = normalizedData.mobile;
    if (normalizedData.addressLine1 !== undefined) clientData.addressLine1 = normalizedData.addressLine1;
    if (normalizedData.addressLine2 !== undefined) clientData.addressLine2 = normalizedData.addressLine2;
    if (normalizedData.suburb !== undefined) clientData.suburb = normalizedData.suburb;
    if (normalizedData.state !== undefined) clientData.state = normalizedData.state;
    if (normalizedData.postcode !== undefined) clientData.postcode = normalizedData.postcode;
    if (normalizedData.ownOrRent !== undefined) clientData.ownOrRent = normalizedData.ownOrRent;
    if (normalizedData.agesOfDependants !== undefined) clientData.agesOfDependants = normalizedData.agesOfDependants;

    // Add all financial fields from normalizedData (they're all optional)
    Object.keys(normalizedData).forEach(key => {
      if (!['userId', 'firstName', 'lastName', 'dob', 'maritalStatus', 'numberOfDependants', 
            'middleName', 'email', 'mobile', 'addressLine1', 'addressLine2', 'suburb', 'state', 
            'postcode', 'ownOrRent', 'agesOfDependants'].includes(key)) {
        clientData[key] = normalizedData[key];
      }
    });

    console.log('[Clients API POST] Final client data:', JSON.stringify(clientData, null, 2));

    // Create client in DynamoDB
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    if (!clientsTable) return NextResponse.json({ error: 'Server not configured: DDB_CLIENTS_TABLE missing' }, { status: 500 });

    const clientId = uuidv4();
    const now = new Date().toISOString();
    const item = {
      id: clientId,
      userId: session.user.id,
      createdAt: now,
      updatedAt: now,
      ...clientData
    } as any;

    await ddbDocClient.send(new PutCommand({ TableName: clientsTable, Item: item }));

    // Track recent access in its own table
    const recentTable = process.env.DDB_RECENT_CLIENT_ACCESS_TABLE;
    if (recentTable) {
      await ddbDocClient.send(new PutCommand({ TableName: recentTable, Item: { userId: session.user.id, clientId, accessedAt: new Date().toISOString(), id: `${session.user.id}#${clientId}` } } as any));
    }

    console.log('[Clients API POST] Client created successfully:', clientId);
    return NextResponse.json(item);
  } catch (error) {
    console.error('[Clients API POST] Error creating client:', error);
    console.error('[Clients API POST] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[Clients API POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
