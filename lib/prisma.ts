// Prisma removed: dynamic stub exporter
let prismaAvailable = false as boolean;
let prismaClient: any = null;

try {
  // Attempt to require Prisma client only if installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  prismaClient = new PrismaClient();
  prismaAvailable = true;
} catch (err) {
  // Prisma not installed - export a helpful proxy that throws on use
  prismaAvailable = false;
  prismaClient = new Proxy({}, {
    get(_target, prop) {
      throw new Error(`Prisma client is not installed. The project has migrated to DynamoDB/S3. Reinstall @prisma/client if you need to run the migration helper. Attempted to access prisma.${String(prop)}`);
    }
  });
}

export const prisma = prismaClient;
export default prisma;