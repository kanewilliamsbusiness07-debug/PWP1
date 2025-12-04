import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import prisma from '@/lib/prisma';
import { encryptField } from '@/lib/encryption';

// GET /api/email/integration - Get email integration settings
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await prisma.emailIntegration.findUnique({
      where: { userId: session.user.id }
    });

    if (!integration) {
      return NextResponse.json({ integration: null });
    }

    // Don't return encrypted passwords/tokens
    const { encryptedPassword, encryptedAccessToken, encryptedRefreshToken, ...safeIntegration } = integration;

    return NextResponse.json({ integration: safeIntegration });
  } catch (error) {
    console.error('Error getting email integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/email/integration - Create or update email integration
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { provider, email, password, smtpHost, smtpPort, smtpUser, imapHost, imapPort, imapUser } = data;

    if (!provider || !email) {
      return NextResponse.json(
        { error: 'Provider and email are required' },
        { status: 400 }
      );
    }

    // Encrypt password if provided
    const encryptedPassword = password ? encryptField(password) : undefined;

    // Create or update integration
    const integration = await prisma.emailIntegration.upsert({
      where: { userId: session.user.id },
      update: {
        provider,
        email,
        encryptedPassword,
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
        smtpUser,
        imapHost,
        imapPort: imapPort ? parseInt(imapPort) : undefined,
        imapUser,
        isActive: true,
        lastSyncAt: new Date()
      },
      create: {
        userId: session.user.id,
        provider,
        email,
        encryptedPassword,
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
        smtpUser,
        imapHost,
        imapPort: imapPort ? parseInt(imapPort) : undefined,
        imapUser,
        isActive: true,
        lastSyncAt: new Date()
      }
    });

    const { encryptedPassword: _, encryptedAccessToken, encryptedRefreshToken, ...safeIntegration } = integration;

    return NextResponse.json({ integration: safeIntegration });
  } catch (error) {
    console.error('Error saving email integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/email/integration - Delete email integration
export async function DELETE(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.emailIntegration.delete({
      where: { userId: session.user.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

