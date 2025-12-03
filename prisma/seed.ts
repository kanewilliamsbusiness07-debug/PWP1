import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set. Cannot seed database.');
    console.error('   Please ensure DATABASE_URL is configured in AWS Amplify Console.');
    process.exit(0); // Exit gracefully - don't fail build if env vars aren't set yet
  }

  console.log('🌱 Starting database seed...');

  try {
    const defaultEmail = 'allan@pwp2026.com.au';
    const defaultPassword = '123456';
    
    console.log(`📧 Creating/updating user: ${defaultEmail}`);
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const user = await prisma.user.upsert({
      where: { email: defaultEmail },
      update: {
        // Update password hash in case it changed, but don't overwrite other fields
        passwordHash: hashedPassword,
        isActive: true, // Ensure user is active
      },
      create: {
        email: defaultEmail,
        passwordHash: hashedPassword,
        name: 'Allan Katup',
        role: 'ADVISOR',
        isMasterAdmin: true,
        isActive: true,
        loginAttempts: 0,
        lockedUntil: null,
      }
    });

    console.log(`✅ Default Perpetual Wealth Partners admin ready:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password: ${defaultPassword} (change this in production!)`);
    console.log(`   User ID: ${user.id}`);
    
    // Count total users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    console.log('✅ Database seed completed successfully!');
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    // Log detailed error information
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`   Error message: ${error.message}`);
    }
    // Don't exit with error code - allow build to continue
    // The seed will be retried on next deployment
    console.warn('⚠️  Seed failed but build will continue. Check database connection and try again.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Unexpected error in seed script:', e);
    // Exit with code 0 to not fail the build
    // Amplify will show warnings but won't fail deployment
    process.exit(0);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
      console.log('🔌 Database connection closed');
    } catch (error) {
      // Ignore disconnect errors
    }
  });