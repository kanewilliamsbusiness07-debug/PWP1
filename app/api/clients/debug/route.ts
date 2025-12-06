import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    
    console.log('=== DEBUG ENDPOINT CALLED ===');
    console.log('Session exists:', !!session);
    console.log('User ID:', session?.user?.id || 'none');
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'No session found'
      }, { status: 401 });
    }

    // Get ALL clients with full details for this user
    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get count for this user
    const count = await prisma.client.count({
      where: {
        userId: session.user.id
      }
    });

    // Also get ALL clients (for debugging - to see if clients exist with different user IDs)
    const allClients = await prisma.client.findMany({
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Limit to first 10 for debugging
    });

    console.log(`Found ${count} clients in database for user ${session.user.id}`);
    console.log(`Total clients in database (first 10): ${allClients.length}`);

    return NextResponse.json({
      success: true,
      count: count,
      clients: clients,
      message: `Found ${count} clients in database for user ${session.user.id}`,
      userId: session.user.id,
      debug: {
        allClientsSample: allClients,
        userIdsInDatabase: [...new Set(allClients.map(c => c.userId))]
      }
    });
  } catch (error: any) {
    console.error('=== DEBUG ENDPOINT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
