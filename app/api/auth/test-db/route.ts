/**
 * Database connection test endpoint
 * Use this to verify database connectivity and user existence
 * Access: GET /api/auth/test-db?email=test@example.com
 */

import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient } from '@/lib/aws/clients';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    // Provide clearer diagnostics and fallback for AWS region/envs
    const regionVal = process.env.AWS_REGION || process.env.APP_AWS_REGION || process.env.REGION || 'NOT SET';
    const databaseUrlPresent = Boolean(process.env.DATABASE_URL);

    // Note: This app uses DynamoDB; DATABASE_URL is not required. We check DynamoDB directly using DDB_USERS_TABLE.
    // If you are expecting a SQL DATABASE_URL (e.g. Prisma), set it explicitly; otherwise ensure DDB_* env vars are configured.

    // Test DynamoDB connectivity by scanning users table (if configured)
    const usersTable = process.env.DDB_USERS_TABLE;
    let dbConnected = false;
    let userCheck: any = null;
    if (usersTable) {
      try {
        const scanRes = await ddbDocClient.send(new ScanCommand({ TableName: usersTable, Limit: 1 } as any));
        dbConnected = true;
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: 'DynamoDB connection failed',
          details: {
            message: err.message
          }
        }, { status: 500 });
      }
    }

    const results: any = {
      success: true,
      database: {
        connected: dbConnected,
        type: usersTable ? 'DynamoDB' : 'Not configured'
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
        if (usersTable) {
          const scanRes = await ddbDocClient.send(new ScanCommand({ TableName: usersTable, FilterExpression: 'email = :e', ExpressionAttributeValues: { ':e': email.toLowerCase() } } as any));
          const users = scanRes.Items || [];
          if (users.length > 0) {
            const u = users[0];
            results.user = { exists: true, id: u.id, email: u.email, name: u.name, isActive: u.isActive, role: u.role, loginAttempts: u.loginAttempts || 0, lockedUntil: u.lockedUntil || null, createdAt: u.createdAt };
          } else {
            results.user = { exists: false, message: 'User not found in DynamoDB' };
          }
        } else {
          results.user = { error: 'DynamoDB users table not configured' };
        }
      } catch (error: any) {
        results.user = { exists: false, error: error.message };
      }
    } else {
      // Count total users
      if (usersTable) {
        try {
          const scanRes = await ddbDocClient.send(new ScanCommand({ TableName: usersTable } as any));
          results.user = { totalUsers: (scanRes.Items || []).length, message: `${(scanRes.Items || []).length} user(s) found` };
        } catch (error: any) {
          results.user = { error: error.message };
        }
      } else {
        results.user = { message: 'DynamoDB users table not configured' };
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
  }}

