/**
 * FinCalc Pro - Login API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { verifyTOTP } from '@/lib/auth/two-factor';
import { ddbDocClient } from '@/lib/aws/clients';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, password, totpToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

  // Rate limiting: NextRequest doesn't expose .ip; use headers as fallback
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const attempts = loginAttempts.get(clientIP) || { count: 0, resetTime: 0 };
    
    if (attempts.count >= 5 && Date.now() < attempts.resetTime) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user via DynamoDB users table (email-index)
    const usersTable = process.env.DDB_USERS_TABLE;
    let user: any = null;

    if (usersTable) {
      try {
        const qRes: any = await ddbDocClient.send(new QueryCommand({
          TableName: usersTable,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': email.toLowerCase() }
        } as any));
        const items = qRes.Items || [];
        user = items[0] || null;
      } catch (dbError: any) {
        console.error('[AUTH] DynamoDB error during login:', dbError);
        // Increment IP-based attempts
        loginAttempts.set(clientIP, {
          count: attempts.count + 1,
          resetTime: Date.now() + 15 * 60 * 1000 // 15 minutes
        });
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    }

    if (!user || !user.isActive) {
      // Increment failed attempts (IP-based)
      loginAttempts.set(clientIP, {
        count: attempts.count + 1,
        resetTime: Date.now() + 15 * 60 * 1000 // 15 minutes
      });

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked. Please try again later.' }, { status: 423 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment login attempts for user
      const newAttempts = (user.loginAttempts || 0) + 1;
      const shouldLock = newAttempts >= 5;

      if (usersTable) {
        try {
          await ddbDocClient.send(new UpdateCommand({
            TableName: usersTable,
            Key: { id: user.id },
            UpdateExpression: 'SET loginAttempts = :la, lockedUntil = :lu',
            ExpressionAttributeValues: { ':la': newAttempts, ':lu': shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null }
          } as any));
        } catch (updateError) {
          console.error('[AUTH] Error updating login attempts:', updateError);
        }
      }

      // Increment IP-based attempts
      loginAttempts.set(clientIP, {
        count: attempts.count + 1,
        resetTime: Date.now() + 15 * 60 * 1000
      });

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!totpToken) {
        return NextResponse.json({ error: 'Two-factor authentication token required', requiresTOTP: true }, { status: 200 });
      }

      const isValidTOTP = verifyTOTP(totpToken, user.twoFactorSecret!);
      if (!isValidTOTP) {
        return NextResponse.json({ error: 'Invalid two-factor authentication token' }, { status: 401 });
      }
    }

    // Reset login attempts on successful login
    if (usersTable) {
      try {
        await ddbDocClient.send(new UpdateCommand({
          TableName: usersTable,
          Key: { id: user.id },
          UpdateExpression: 'SET loginAttempts = :la, lockedUntil = :lu, lastLogin = :ll',
          ExpressionAttributeValues: { ':la': 0, ':lu': null, ':ll': new Date().toISOString() }
        } as any));
      } catch (updateError) {
        console.error('[AUTH] Error updating last login:', updateError);
      }
    }

    // Clear IP-based rate limiting
    loginAttempts.delete(clientIP);

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      isMasterAdmin: user.isMasterAdmin
    });

    // Audit logging: currently no centralized audit table in DynamoDB; skip non-blocking
    try {
      // If you add an Audit log table, write an entry here (non-blocking)
    } catch (e) {
      console.warn('Audit log creation skipped:', e);
    }

    // Set refresh token as httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isMasterAdmin: user.isMasterAdmin
      },
      accessToken: tokens.accessToken
    });

    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}