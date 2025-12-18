import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { ddbDocClient, s3Client } from '@/lib/aws/clients';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// GET /api/pdf-exports/[id]/view - View a PDF file (inline)
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

    const getRes: any = await ddbDocClient.send(new GetCommand({ TableName: pdfTable, Key: { id: exportId } } as any));
    const pdfExport = getRes.Item;

    if (!pdfExport || pdfExport.userId !== session.user.id) {
      return NextResponse.json({ error: 'PDF export not found' }, { status: 404 });
    }

    if (!pdfExport.s3Key) return NextResponse.json({ error: 'No S3 key for this export' }, { status: 404 });

    try {
      const bucket = process.env.AWS_S3_BUCKET || process.env.APP_AWS_S3_BUCKET || process.env.S3_BUCKET;
      if (!bucket) return NextResponse.json({ error: 'Server not configured: AWS_S3_BUCKET missing' }, { status: 500 });

      const getObj = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: pdfExport.s3Key }));
      const bodyStream = (getObj.Body as any) as Readable;

      // Convert Node Readable to Web ReadableStream for NextResponse
      const webStream = Readable.toWeb(bodyStream as any) as unknown as globalThis.ReadableStream;

      return new NextResponse(webStream, {
        headers: {
          'Content-Type': pdfExport.mimeType || 'application/pdf',
          'Content-Disposition': `inline; filename="${pdfExport.fileName}"`
        }
      });
    } catch (err) {
      console.error('Error fetching PDF from S3:', err);
      return NextResponse.json({ error: 'PDF file not found in S3' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error viewing PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

