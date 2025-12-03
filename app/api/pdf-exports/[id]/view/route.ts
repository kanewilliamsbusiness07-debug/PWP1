import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { auth } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET /api/pdf-exports/[id]/view - View a PDF file (inline)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(auth)) as Session | null;
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

    // Read file from disk
    const filePath = join(process.cwd(), pdfExport.filePath);
    const fileBuffer = await readFile(filePath);

    // Return file as inline response for viewing
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': pdfExport.mimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfExport.fileName}"`,
        'Content-Length': pdfExport.fileSize?.toString() || fileBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error viewing PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

