import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient } from '@/lib/aws/clients';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
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

    // Get ALL clients with full details for this user via scan and filter
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    if (!clientsTable) return NextResponse.json({ success: false, error: 'Server not configured: DDB_CLIENTS_TABLE missing' }, { status: 500 });

    const scanRes: any = await ddbDocClient.send(new ScanCommand({ TableName: clientsTable } as any));
    const all = scanRes.Items || [];
    const clients = all.filter((c: any) => c.userId === session.user.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const count = clients.length;
    const allClientsSample = (all || []).slice(0, 10).map((c: any) => ({ id: c.id, userId: c.userId, firstName: c.firstName, lastName: c.lastName, email: c.email, createdAt: c.createdAt }));

    console.log(`Found ${count} clients in database for user ${session.user.id}`);
    console.log(`Total clients in database (first 10): ${allClientsSample.length}`);

    return NextResponse.json({
      success: true,
      count,
      clients,
      message: `Found ${count} clients in database for user ${session.user.id}`,
      userId: session.user.id,
      debug: {
        allClientsSample,
        userIdsInDatabase: Array.from(new Set((all || []).map(c => c.userId)))
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
