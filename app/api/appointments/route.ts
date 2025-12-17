import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient } from '@/lib/aws/clients';
import { QueryCommand, ScanCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';

// GET /api/appointments - List appointments (account-scoped)
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    console.log('Appointments API - Session check:', session ? `User ID: ${session.user?.id}` : 'No session');
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Capture userId locally to satisfy TypeScript narrowing
    const userId = session.user!.id as string;
    const where: any = {
      userId: userId
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startDateTime = {};
      if (startDate) {
        where.startDateTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDateTime.lte = new Date(endDate);
      }
    }

    // Query DynamoDB appointments table by userId (expects a GSI on userId-startDateTime) and then filter in memory for the optional params
    const apptTable = process.env.DDB_APPOINTMENTS_TABLE;
    if (!apptTable) return NextResponse.json([], { status: 200 });

    try {
      const q: any = {
        TableName: apptTable,
        IndexName: 'userId-startDateTime-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': session.user.id },
        ScanIndexForward: true,
        Limit: limit
      };

      const qRes: any = await ddbDocClient.send(new QueryCommand(q));
      let items = qRes.Items || [];

      // Apply additional filters clientId/status and date range
      if (clientId) items = items.filter((it:any) => it.clientId === clientId);
      if (status) items = items.filter((it:any) => it.status === status);
      if (startDate || endDate) {
        const s = startDate ? new Date(startDate) : null;
        const e = endDate ? new Date(endDate) : null;
        items = items.filter((it:any) => {
          const sd = new Date(it.startDateTime);
          if (s && sd < s) return false;
          if (e && sd > e) return false;
          return true;
        });
      }

      // Ensure results are scoped to the authenticated user
      items = items.filter((it:any) => it.userId === userId);

      return NextResponse.json(items.slice(0, limit));
    } catch (qErr) {
      console.warn('[Appointments API] Query failed, falling back to scan', qErr);
      // Fallback to scan and filter
      const scanRes: any = await ddbDocClient.send(new ScanCommand({ TableName: apptTable } as any));
      let all = scanRes.Items || [];
      // Ensure results are scoped to the authenticated user
      all = all.filter((it:any) => it.userId === userId);
      if (clientId) all = all.filter((it:any) => it.clientId === clientId);
      if (status) all = all.filter((it:any) => it.status === status);
      if (startDate || endDate) {
        const s = startDate ? new Date(startDate) : null;
        const e = endDate ? new Date(endDate) : null;
        all = all.filter((it:any) => {
          const sd = new Date(it.startDateTime);
          if (s && sd < s) return false;
          if (e && sd > e) return false;
          return true;
        });
      }
      return NextResponse.json(all.slice(0, limit));
    }
  } catch (error) {
    console.error('Error getting appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.clientId || !data.title || !data.startDateTime || !data.endDateTime) {
      return NextResponse.json(
        { error: 'Client ID, title, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Capture userId locally
    const userId = session.user!.id as string;

    // Verify client exists in DynamoDB
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    if (!clientsTable) return NextResponse.json({ error: 'Server not configured: DDB_CLIENTS_TABLE missing' }, { status: 500 });
    const clientRes: any = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: data.clientId } } as any));
    const client = clientRes.Item;
    if (!client || client.userId !== userId) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Check for conflicts by scanning appointments for this user and overlapping times
    const apptTable = process.env.DDB_APPOINTMENTS_TABLE;
    if (!apptTable) return NextResponse.json({ error: 'Server not configured: DDB_APPOINTMENTS_TABLE missing' }, { status: 500 });

    const scanRes: any = await ddbDocClient.send(new ScanCommand({ TableName: apptTable } as any));
    const existing = (scanRes.Items || []).filter((it:any) => it.userId === userId && it.status !== 'CANCELLED');
    const startNew = new Date(data.startDateTime);
    const endNew = new Date(data.endDateTime);
    const conflict = existing.find((it:any) => {
      const s = new Date(it.startDateTime);
      const e = new Date(it.endDateTime);
      return (s < endNew && e > startNew);
    });

    if (conflict) {
      return NextResponse.json({ error: 'Appointment conflicts with existing appointment' }, { status: 409 });
    }

    // Create appointment in DynamoDB
    const apptId = uuidv4();
    const item = {
      id: apptId,
      userId: userId,
      clientId: data.clientId,
      title: data.title,
      description: data.description || null,
      startDateTime: new Date(data.startDateTime).toISOString(),
      endDateTime: new Date(data.endDateTime).toISOString(),
      status: data.status || 'SCHEDULED',
      notes: data.notes || null,
      createdAt: new Date().toISOString()
    } as any;

    await ddbDocClient.send(new PutCommand({ TableName: apptTable, Item: item }));

    // Attach client info for response
    item.client = { id: client.id, firstName: client.firstName, lastName: client.lastName, email: client.email };
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

