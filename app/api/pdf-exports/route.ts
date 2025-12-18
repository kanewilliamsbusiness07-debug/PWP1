import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient } from '@/lib/aws/clients';
import { QueryCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/aws/clients';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET /api/pdf-exports - List PDF exports (account-scoped)
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    console.log('PDF Exports API - Session check:', session ? `User ID: ${session.user?.id}` : 'No session');
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user!.id as string;

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      userId: session.user.id
    };

    if (clientId) {
      where.clientId = clientId;
    }

    try {
      const pdfTable = process.env.DDB_PDF_EXPORTS_TABLE;
      if (pdfTable) {
        // Try to query by userId using a GSI on userId (if available)
        try {
          const params: any = {
            TableName: pdfTable,
            IndexName: 'userId-createdAt-index',
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': userId },
            ScanIndexForward: false,
            Limit: limit
          };
          // Optionally filter by clientId
          if (clientId) {
            params.FilterExpression = 'clientId = :cid';
            params.ExpressionAttributeValues[':cid'] = clientId;
          }

          const res = await ddbDocClient.send(new QueryCommand(params));
          const items = res.Items || [];
          return NextResponse.json(items);
        } catch (qErr) {
          console.warn('[PDF Exports API] Query error, falling back to scan', qErr);
          // Fallback to scan
        }

        // Fallback to scan
        const scanRes: any = await ddbDocClient.send({
          TableName: pdfTable
        } as any);
        const filtered = (scanRes.Items || []).filter((it: any) => it.userId === userId && (!clientId || it.clientId === clientId)).slice(0, limit);
        return NextResponse.json(filtered);
      }

      // If no table configured, return empty array
      return NextResponse.json([]);
    } catch (dbError: any) {
      console.error('[PDF Exports API] DynamoDB error:', dbError);
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('[PDF Exports API] Error getting PDF exports:', error);
    // Don't fail hard - return empty array on error
    return NextResponse.json([]);
  }
}

// POST /api/pdf-exports - Create a new PDF export
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
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

    // Verify client belongs to user (DynamoDB)
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    if (!clientsTable) return NextResponse.json({ error: 'Server not configured: DDB_CLIENTS_TABLE missing' }, { status: 500 });

    let client: any = null;
    try {
      const gRes: any = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: clientId } } as any));
      client = gRes.Item;
    } catch (gErr: any) {
      console.error('[PDF Exports API] Error fetching client:', gErr);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!client || client.userId !== session.user.id) {
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

    // Save file locally
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Optionally upload to S3 if bucket configured
    const bucket = process.env.AWS_S3_BUCKET || process.env.APP_AWS_S3_BUCKET || process.env.S3_BUCKET;
    let s3Key: string | null = null;
    if (bucket) {
      try {
        s3Key = `pdfs/${uniqueFileName}`;
        await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: s3Key, Body: buffer, ContentType: file.type || 'application/pdf' }));
      } catch (s3Err) {
        console.warn('[PDF Exports API] S3 upload failed, keeping local file:', s3Err);
        s3Key = null;
      }
    }

    // Create database record in DynamoDB
    const pdfTable = process.env.DDB_PDF_EXPORTS_TABLE;
    if (!pdfTable) return NextResponse.json({ error: 'Server not configured: DDB_PDF_EXPORTS_TABLE missing' }, { status: 500 });

    const pdfId = uuidv4();
    const now = new Date().toISOString();
    const item: any = {
      id: pdfId,
      userId: session.user.id,
      clientId,
      fileName,
      filePath: `/uploads/pdfs/${uniqueFileName}`,
      s3Key: s3Key || null,
      fileSize: buffer.length,
      mimeType: file.type || 'application/pdf',
      createdAt: now
    };

    try {
      await ddbDocClient.send(new PutCommand({ TableName: pdfTable, Item: item } as any));
    } catch (dbErr) {
      console.error('[PDF Exports API] Error creating PDF record in DynamoDB:', dbErr);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Attach client info for response
    item.client = { id: client.id, firstName: client.firstName, lastName: client.lastName, email: client.email };

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating PDF export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

