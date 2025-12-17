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

    // First, check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        details: {
          message: 'The DATABASE_URL environment variable is not available at runtime. Please check your Amplify Console environment variables configuration.',
          availableEnvVars: {
            nodeEnv: process.env.NODE_ENV,
            nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
            nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
            jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
            databaseUrl: 'NOT SET'
          },
          troubleshooting: [
            '1. Go to AWS Amplify Console → Your App → App settings → Environment variables',
            '2. Verify DATABASE_URL is set for your branch/environment',
            '3. Ensure the variable name is exactly "DATABASE_URL" (case-sensitive)',
            '4. Redeploy your app after adding/updating environment variables',
            '5. Check that you\'re setting variables for the correct branch (fix-amplify-deploy)'
          ]
        }
      }, { status: 500 });
    }

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

