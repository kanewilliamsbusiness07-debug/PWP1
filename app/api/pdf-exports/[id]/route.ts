import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET /api/pdf-exports/[id] - Get a single PDF export
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
    const exportId = params.id;

    const pdfExport = await prisma.pdfExport.findFirst({
      where: {
        id: exportId,
        userId: session.user.id
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

    if (!pdfExport) {
      return NextResponse.json({ error: 'PDF export not found' }, { status: 404 });
    }

    return NextResponse.json(pdfExport);
  } catch (error) {
    console.error('Error getting PDF export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/pdf-exports/[id] - Delete a PDF export
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const exportId = params.id;

    const pdfExport = await prisma.pdfExport.findFirst({
      where: {
        id: exportId,
        userId: session.user.id
      }
    });

    if (!pdfExport) {
      return NextResponse.json({ error: 'PDF export not found' }, { status: 404 });
    }

    // Delete file if it exists
    try {
      const filePath = join(process.cwd(), pdfExport.filePath);
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
    } catch (fileError) {
      // File might not exist, continue with database deletion
      console.warn('Could not delete PDF file:', fileError);
    }

    // Delete database record
    await prisma.pdfExport.delete({
      where: { id: exportId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

