/**
 * Database connection test endpoint
 * Use this to verify database connectivity and user existence
 * Access: GET /api/auth/test-db?email=test@example.com
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    // Test database connection
    let dbConnected = false;
    try {
      await prisma.$connect();
      dbConnected = true;
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: {
          message: error.message,
          code: error.code
        }
      }, { status: 500 });
    }

    const results: any = {
      success: true,
      database: {
        connected: dbConnected,
        url: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
        jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
      }
    };

    // If email provided, check if user exists
    if (email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            role: true,
            loginAttempts: true,
            lockedUntil: true,
            createdAt: true
          }
        });

        results.user = user ? {
          exists: true,
          ...user,
          lockedUntil: user.lockedUntil?.toISOString() || null
        } : {
          exists: false,
          message: 'User not found in database'
        };
      } catch (error: any) {
        results.user = {
          exists: false,
          error: error.message
        };
      }
    } else {
      // Count total users
      try {
        const userCount = await prisma.user.count();
        results.user = {
          totalUsers: userCount,
          message: userCount === 0 ? 'No users found in database. Run: npx prisma db seed' : `${userCount} user(s) found`
        };
      } catch (error: any) {
        results.user = {
          error: error.message
        };
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

