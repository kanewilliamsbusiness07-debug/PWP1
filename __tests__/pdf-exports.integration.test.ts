import { s3Mock, ddbMock, resetAwsMocks } from './__mocks__/aws-sdk-mocks';
import { vi } from 'vitest';

// Mock next-auth session for these integration tests
vi.mock('next-auth/next', () => ({
  getServerSession: async () => ({ user: { id: 'u1', email: 'user@example.com' } })
}));

import { POST, GET as GET_LIST } from '@/app/api/pdf-exports/route';
import { GET as GET_DOWNLOAD } from '@/app/api/pdf-exports/[id]/download/route';
import { Readable } from 'stream';

describe('PDF Exports integration (mocked AWS)', () => {
  test('POST /api/pdf-exports creates a PDF record and returns item', async () => {
    resetAwsMocks();
    // Mock client lookup (GetCommand) to return a client belonging to the session user
    ddbMock.onAnyCommand().resolves({ Item: { id: 'c1', userId: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' } });
    // S3 upload succeeds
    s3Mock.onAnyCommand().resolves({});

    // Fake file object expected by route.ts (has arrayBuffer and type)
    const file = {
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      type: 'application/pdf',
      name: 'test.pdf'
    } as unknown as File;

    const fakeReq = {
      formData: async () => ({
        get: (k: string) => {
          if (k === 'clientId') return 'c1';
          if (k === 'fileName') return 'report.pdf';
          if (k === 'file') return file;
          return null;
        }
      })
    } as any;

    // Ensure env vars are set so the code follows the S3 + DDB path
    process.env.DDB_CLIENTS_TABLE = 'ClientsTable';
    process.env.DDB_PDF_EXPORTS_TABLE = 'PdfExportsTable';
    process.env.AWS_S3_BUCKET = 'local-bucket';

    const res: any = await POST(fakeReq);
    const json = await res.json();

    expect(json).toBeDefined();
    expect(json).toHaveProperty('id');
    expect(json.client).toBeDefined();
    expect(json.client.id).toBe('c1');
  });

  test('GET /api/pdf-exports returns list of exports', async () => {
    resetAwsMocks();
    // Mock a QueryCommand response with two items
    const items = [
      { id: 'p1', userId: 'u1', fileName: 'a.pdf', clientId: 'c1', createdAt: new Date().toISOString() },
      { id: 'p2', userId: 'u1', fileName: 'b.pdf', clientId: 'c1', createdAt: new Date().toISOString() }
    ];
    ddbMock.onAnyCommand().resolves({ Items: items });

    const req = new Request('http://localhost/api/pdf-exports?clientId=c1');
    const res: any = await GET_LIST(req as any);
    const json = await res.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/pdf-exports/[id]/download returns stream when s3 object exists', async () => {
    resetAwsMocks();
    // Mock DynamoDB GetCommand to return an item with s3Key
    ddbMock.onAnyCommand().resolves({ Item: { id: 'p-download', userId: 'u1', fileName: 'dl.pdf', s3Key: 'pdfs/dl.pdf', mimeType: 'application/pdf' } });

    // Mock S3 GetObjectCommand to return a Node Readable body
    const pdfBuffer = Buffer.from('PDF_CONTENT');
    const readable = Readable.from([pdfBuffer]);
    s3Mock.onAnyCommand().resolves({ Body: readable });

    process.env.DDB_PDF_EXPORTS_TABLE = 'PdfExportsTable';
    process.env.AWS_S3_BUCKET = 'local-bucket';

    const req = new Request('http://localhost/api/pdf-exports/p-download/download');
    const context = { params: Promise.resolve({ id: 'p-download' }) } as any;

    const res: any = await GET_DOWNLOAD(req as any, context);

    // Handler should return a streaming Response (NextResponse) when successful
    expect(res).toBeDefined();
  });
});
