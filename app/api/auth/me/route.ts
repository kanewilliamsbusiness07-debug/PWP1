import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { ddbDocClient } from '@/lib/aws/clients';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data from DynamoDB Users table
    const usersTable = process.env.DDB_USERS_TABLE;
    let user: any = null;

    if (usersTable) {
      try {
        const res: any = await ddbDocClient.send(new GetCommand({ TableName: usersTable, Key: { id: payload.userId } } as any));
        user = res.Item;
      } catch (dbError: any) {
        console.error('[AUTH] DynamoDB error fetching user:', dbError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For development/testing, return a mock user if database is not set up
    if (process.env.NODE_ENV === 'development' && !user) {
      return NextResponse.json({
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        isMasterAdmin: true
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}