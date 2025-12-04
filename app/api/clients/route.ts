import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { normalizeFields } from '@/lib/utils/field-mapping';

// GET /api/clients - List clients (account-scoped) with recent clients support
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    console.log('Clients API - Session check:', session ? `User ID: ${session.user?.id}` : 'No session');
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const recent = searchParams.get('recent') === 'true';

    if (recent) {
      // Get recently accessed clients
      const recentAccess = await prisma.recentClientAccess.findMany({
        where: { userId: session.user.id },
        orderBy: { accessedAt: 'desc' },
        take: limit,
        include: {
          client: true
        }
      });

      return NextResponse.json(recentAccess.map(ra => ra.client));
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

    const clients = await prisma.client.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit
    });

    console.log(`[Clients API] Returning ${clients.length} clients`);
    
    // Return array directly instead of wrapped object
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error getting clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      dob: new Date(normalizedData.dob),
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

    // Create client with prepared data
    const client = await prisma.client.create({
      data: clientData
    });

    // Track recent access
    await prisma.recentClientAccess.upsert({
      where: {
        userId_clientId: {
          userId: session.user.id,
          clientId: client.id
        }
      },
      update: {
        accessedAt: new Date()
      },
      create: {
        userId: session.user.id,
        clientId: client.id,
        accessedAt: new Date()
      }
    });

    console.log('[Clients API POST] Client created successfully:', client.id);
    return NextResponse.json(client);
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
