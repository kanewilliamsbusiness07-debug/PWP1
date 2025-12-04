import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET /api/pdf-exports/[id]/download - Download a PDF file
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
      }
    });

    if (!pdfExport) {
      return NextResponse.json({ error: 'PDF export not found' }, { status: 404 });
    }

    // Read file from disk
    // Handle both absolute paths and relative paths
    let filePath: string;
    if (pdfExport.filePath.startsWith('/') && !pdfExport.filePath.startsWith(process.cwd())) {
      // Path starts with / but is not absolute from cwd - treat as relative
      filePath = join(process.cwd(), pdfExport.filePath);
    } else if (pdfExport.filePath.startsWith('/')) {
      // Absolute path from cwd
      filePath = pdfExport.filePath;
    } else {
      // Relative path
      filePath = join(process.cwd(), pdfExport.filePath);
    }
    
    try {
      const fileBuffer = await readFile(filePath);

      // Return file as response
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': pdfExport.mimeType || 'application/pdf',
          'Content-Disposition': `attachment; filename="${pdfExport.fileName}"`,
          'Content-Length': pdfExport.fileSize?.toString() || fileBuffer.length.toString()
        }
      });
    } catch (fileError) {
      console.error('Error reading PDF file:', fileError);
      console.error('Attempted file path:', filePath);
      return NextResponse.json({ error: 'PDF file not found on server' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

