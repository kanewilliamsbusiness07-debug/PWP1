// Lightweight AWS client mock for test environment
// This avoids adding an external dependency by patching the clients' send() method
import { s3Client, ddbDocClient } from '@/lib/aws/clients';

let s3Response: any = null;
let ddbResponse: any = null;

export const s3Mock = {
  onAnyCommand() {
    return {
      resolves: (val: any) => {
        s3Response = val;
      }
    };
  },
  reset() {
    s3Response = null;
  }
};

export const ddbMock = {
  onAnyCommand() {
    return {
      resolves: (val: any) => {
        ddbResponse = val;
      }
    };
  },
  reset() {
    ddbResponse = null;
  }
};

// Patch the real clients' send method to return the mocked responses
const originalS3Send = (s3Client as any).send.bind(s3Client);
(s3Client as any).send = async (cmd: any) => {
  if (s3Response !== null) return s3Response;
  return originalS3Send(cmd);
};

const originalDdbSend = (ddbDocClient as any).send.bind(ddbDocClient);
(ddbDocClient as any).send = async (cmd: any) => {
  if (ddbResponse !== null) return ddbResponse;
  return originalDdbSend(cmd);
};

// Reset helper
export function resetAwsMocks() {
  s3Mock.reset();
  ddbMock.reset();
}
