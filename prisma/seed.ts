import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Simple password hashing for development
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  // Create mock user
  const hashedPassword = hashPassword('1');
  
  await prisma.user.upsert({
    where: { email: '1@1' },
    update: {},
    create: {
      email: '1@1',
      passwordHash: hashedPassword,
      name: 'Test User',
      role: 'ADVISOR',
      isMasterAdmin: true,
      isActive: true
    },
  });

  console.log('Mock user created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });