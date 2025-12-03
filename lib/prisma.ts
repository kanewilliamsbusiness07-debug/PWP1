import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Ensure DATABASE_URL is available before initializing Prisma
if (!process.env.DATABASE_URL) {
  console.error('[PRISMA] DATABASE_URL environment variable is not set');
  // In production, we should fail fast, but allow initialization to continue
  // so we can provide better error messages
}

// Initialize Prisma Client with explicit DATABASE_URL if available
const createPrismaClient = () => {
  if (process.env.DATABASE_URL) {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  // If DATABASE_URL is not set, still create client but it will fail on first use
  // This allows us to provide better error messages
  return new PrismaClient();
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;