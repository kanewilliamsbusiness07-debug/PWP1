import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { auth } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET /api/pdf-exports - List PDF exports (account-scoped)
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(auth)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      userId: session.user.id
    };

    if (clientId) {
      where.clientId = clientId;
    }

    const exports = await prisma.pdfExport.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ exports });
  } catch (error) {
    console.error('Error getting PDF exports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pdf-exports - Create a new PDF export
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(auth)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const clientId = formData.get('clientId') as string;
    const fileName = formData.get('fileName') as string;
    const file = formData.get('file') as File;

    if (!clientId || !fileName || !file) {
      return NextResponse.json(
        { error: 'Client ID, file name, and file are required' },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'pdfs');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, uniqueFileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const pdfExport = await prisma.pdfExport.create({
      data: {
        userId: session.user.id,
        clientId,
        fileName,
        filePath: `/uploads/pdfs/${uniqueFileName}`,
        fileSize: buffer.length,
        mimeType: file.type || 'application/pdf'
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(pdfExport);
  } catch (error) {
    console.error('Error creating PDF export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

