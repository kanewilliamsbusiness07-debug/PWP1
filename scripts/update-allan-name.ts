/**
 * Script to update Allan's name from "Allan Chambers" to "Allan Kutup"
 * Run with: npx tsx scripts/update-allan-name.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Looking for user with email: allan@pwp2026.com.au');
    
    const user = await prisma.user.findUnique({
      where: { email: 'allan@pwp2026.com.au' }
    });

    if (!user) {
      console.error('❌ User not found with email: allan@pwp2026.com.au');
      console.log('💡 Make sure the user exists in the database first.');
      return;
    }

    console.log(`📝 Current name: "${user.name}"`);
    
    if (user.name === 'Allan Kutup') {
      console.log('✅ Name is already "Allan Kutup", no update needed.');
      return;
    }

    console.log('🔄 Updating name to "Allan Kutup"...');
    
    const updatedUser = await prisma.user.update({
      where: { email: 'allan@pwp2026.com.au' },
      data: { name: 'Allan Kutup' }
    });

    console.log('✅ Successfully updated!');
    console.log(`   Old name: "${user.name}"`);
    console.log(`   New name: "${updatedUser.name}"`);
    console.log('\n💡 You may need to log out and log back in to see the change in the UI.');
  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

