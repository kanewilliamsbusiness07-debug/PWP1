import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient } from '@/lib/aws/clients';
import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';

// PATCH /api/users/update-name - Update the current user's name
export async function PATCH(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const usersTable = process.env.DDB_USERS_TABLE;
    if (!usersTable) return NextResponse.json({ error: 'Server not configured: DDB_USERS_TABLE missing' }, { status: 500 });

    await ddbDocClient.send(new UpdateCommand({ TableName: usersTable, Key: { id: session.user.id }, UpdateExpression: 'SET #name = :n', ExpressionAttributeNames: { '#name': 'name' }, ExpressionAttributeValues: { ':n': name.trim() } } as any));

    const g: any = await ddbDocClient.send(new GetCommand({ TableName: usersTable, Key: { id: session.user.id } } as any));
    const updatedUser = g.Item;

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error('Error updating user name:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

