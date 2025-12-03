import NextAuth from "next-auth";
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';
import type { DefaultSession } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/auth/password';
import prisma from '@/lib/prisma';

const nextAuthSecret = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
// Check if we're in a build context (Next.js sets this during build)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' 
  || process.env.NEXT_PHASE === 'phase-development-build'
  || process.env.NEXT_PHASE === 'phase-export';

// During build, use a placeholder secret if none is provided (NextAuth requires a secret)
// At runtime, this will be validated and the actual secret must be provided
const authSecret = nextAuthSecret || (isBuildTime ? 'build-time-placeholder-secret' : undefined);

// Only validate at runtime, not during build
if (!isBuildTime) {
  if (!nextAuthSecret) {
    throw new Error(
      'NEXTAUTH_SECRET is not set. Define it in your environment (Amplify console or .env.local) so credential login works.'
    );
  }

  if (isProduction && !process.env.NEXTAUTH_URL) {
    throw new Error(
      'NEXTAUTH_URL is not set. Define it to the deployed Amplify domain so NextAuth can issue correct redirects.'
    );
  }
}

interface ExtendedUser extends User {
  id: string;
  role: string;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: DefaultSession['user'] & {
      id: string;
      role: string;
    }
  }
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Missing credentials');
          }

          // Check if database is configured
          if (!process.env.DATABASE_URL) {
            console.error('DATABASE_URL is not set');
            throw new Error('Database connection not configured. Please check your environment variables.');
          }

          // Find user in database
          let user;
          try {
            user = await prisma.user.findUnique({
              where: { email: credentials.email.toLowerCase() }
            });
          } catch (dbError: any) {
            console.error('Database error during login:', dbError);
            // Check for common database connection errors
            if (dbError.code === 'P1001' || dbError.message?.includes('connect')) {
              throw new Error('Unable to connect to database. Please check your database configuration.');
            }
            throw new Error('Database error occurred. Please try again later.');
          }

          if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
          }

          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new Error('Account is temporarily locked. Please try again later.');
          }

          // Verify password
          const { verifyPassword } = await import('@/lib/auth/password');
          const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);

          if (!isValidPassword) {
            // Increment login attempts
            const newAttempts = user.loginAttempts + 1;
            const shouldLock = newAttempts >= 5;

            try {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  loginAttempts: newAttempts,
                  lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 minutes
                }
              });
            } catch (updateError) {
              console.error('Error updating login attempts:', updateError);
              // Continue even if update fails
            }

            throw new Error('Invalid email or password');
          }

          // Reset login attempts on successful login
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: 0,
                lockedUntil: null,
                lastLogin: new Date()
              }
            });
          } catch (updateError) {
            console.error('Error updating last login:', updateError);
            // Continue even if update fails
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        } catch (error: any) {
          // Log the error for debugging
          console.error('Authentication error:', error);
          // Re-throw with a user-friendly message
          if (error.message && !error.message.includes('Invalid') && !error.message.includes('Missing')) {
            throw error;
          }
          throw new Error(error.message || 'Authentication failed. Please check your credentials and try again.');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT & { role?: string }, user: User | null }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        // Check if user has role property and it's a string
        if ('role' in user && typeof user.role === 'string') {
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT & { role?: string } }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  secret: authSecret,
  trustHost: true, // Required for Amplify Hosting
  useSecureCookies: process.env.NODE_ENV === 'production', // Use secure cookies in production
  pages: {
    signIn: '/auth/login',
  }
};

const handler = NextAuth(authConfig);

export { handler as auth };