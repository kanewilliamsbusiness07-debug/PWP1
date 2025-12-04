import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth';

const handler = NextAuth(authConfig);

// Export authOptions for use in API routes with getServerSession
export { authConfig as authOptions };
export { handler as GET, handler as POST };