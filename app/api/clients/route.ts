import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

    return NextResponse.json({ clients });
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

    // Normalize field names to canonical forms
    const normalizedData = normalizeFields(data);

    // Ensure required fields
    if (!normalizedData.firstName || !normalizedData.lastName || !normalizedData.dob) {
      return NextResponse.json(
        { error: 'First name, last name, and date of birth are required' },
        { status: 400 }
      );
    }

    // Create client with normalized data
    const client = await prisma.client.create({
      data: {
        ...normalizedData,
        userId: session.user.id,
        dob: new Date(normalizedData.dob)
      }
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

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
