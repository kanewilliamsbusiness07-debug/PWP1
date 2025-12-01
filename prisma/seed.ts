import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultEmail = 'allan@pwp2026.com.au';
  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  await prisma.user.upsert({
    where: { email: defaultEmail },
    update: {},
    create: {
      email: defaultEmail,
      passwordHash: hashedPassword,
      name: 'Allan Chambers',
      role: 'ADVISOR',
      isMasterAdmin: true,
      isActive: true
    }
  });

  console.log(`Default Perpetual Wealth Partners admin ready: ${defaultEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });