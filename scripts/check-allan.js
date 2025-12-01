const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'allan@pwp2026.com.au' }
    });
    console.log('User lookup result:', user);
    if (user) {
      const passwordOk = await bcrypt.compare('123456', user.passwordHash);
      console.log('Password 123456 valid:', passwordOk);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Error checking Allan login:', err);
  process.exit(1);
});

