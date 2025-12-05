import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

    // Get client and verify it belongs to the user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

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

    // Verify client belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id
      }
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Normalize field names
    const normalizedData = normalizeFields(data);

    // Handle date conversion if present
    if (normalizedData.dob) {
      normalizedData.dob = new Date(normalizedData.dob);
    }

    // Update client
    const client = await prisma.client.update({
      where: { id: clientId },
      data: normalizedData
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

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id
      }
    });

    console.log('Client exists:', !!client);
    console.log('Client found:', client ? `${client.firstName} ${client.lastName}` : 'none');

    if (!client) {
      console.log('Client not found in database');
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    console.log('Deleting client:', client.firstName, client.lastName);

    // Delete client (cascade will handle related records)
    await prisma.client.delete({
      where: { id: clientId }
    });

    console.log('Client deleted successfully!');
    console.log('=== DELETE CLIENT COMPLETE ===');

    return NextResponse.json({ 
      success: true,
      message: 'Client deleted successfully',
      deletedId: clientId 
    });
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
