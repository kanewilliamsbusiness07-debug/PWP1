import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient, s3Client } from '@/lib/aws/clients';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
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

    const pdfTable = process.env.DDB_PDF_EXPORTS_TABLE;
    if (!pdfTable) return NextResponse.json({ error: 'Server not configured: DDB_PDF_EXPORTS_TABLE missing' }, { status: 500 });

    const res = await ddbDocClient.send(new GetCommand({ TableName: pdfTable, Key: { id: exportId } } as any));
    const pdfExport = res.Item;

    if (!pdfExport || pdfExport.userId !== session.user.id) {
      return NextResponse.json({ error: 'PDF export not found' }, { status: 404 });
    }

    // Optionally, include client details if stored on the item
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

    const pdfTable = process.env.DDB_PDF_EXPORTS_TABLE;
    if (!pdfTable) return NextResponse.json({ error: 'Server not configured: DDB_PDF_EXPORTS_TABLE missing' }, { status: 500 });

    const getRes: any = await ddbDocClient.send(new GetCommand({ TableName: pdfTable, Key: { id: exportId } } as any));
    const pdfExport = getRes.Item;
    if (!pdfExport || pdfExport.userId !== session.user.id) return NextResponse.json({ error: 'PDF export not found' }, { status: 404 });

    // Delete S3 object if present
    try {
      const bucket = process.env.AWS_S3_BUCKET;
      if (bucket && pdfExport.s3Key) {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: pdfExport.s3Key }));
      }
    } catch (sErr) {
      console.warn('Could not delete S3 object:', sErr);
    }

    // Delete DynamoDB record
    await ddbDocClient.send(new DeleteCommand({ TableName: pdfTable, Key: { id: exportId } } as any));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

