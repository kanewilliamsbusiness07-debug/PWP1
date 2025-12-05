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

    // Get ALL clients with full details
    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get count
    const count = await prisma.client.count({
      where: {
        userId: session.user.id
      }
    });

    console.log(`Found ${count} clients in database for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      count: count,
      clients: clients,
      message: `Found ${count} clients in database`,
      userId: session.user.id
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
