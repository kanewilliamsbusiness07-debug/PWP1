/**
 * FinCalc Pro - Login API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { verifyTOTP } from '@/lib/auth/two-factor';

const prisma = new PrismaClient();

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.isActive) {
      // Increment failed attempts
      loginAttempts.set(clientIP, {
        count: attempts.count + 1,
        resetTime: Date.now() + 15 * 60 * 1000 // 15 minutes
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Account is temporarily locked. Please try again later.' },
        { status: 423 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Increment login attempts for user
      const newAttempts = user.loginAttempts + 1;
      const shouldLock = newAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 minutes
        }
      });

      // Increment IP-based attempts
      loginAttempts.set(clientIP, {
        count: attempts.count + 1,
        resetTime: Date.now() + 15 * 60 * 1000
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!totpToken) {
        return NextResponse.json(
          { error: 'Two-factor authentication token required', requiresTOTP: true },
          { status: 200 }
        );
      }

      const isValidTOTP = verifyTOTP(totpToken, user.twoFactorSecret!);
      if (!isValidTOTP) {
        return NextResponse.json(
          { error: 'Invalid two-factor authentication token' },
          { status: 401 }
        );
      }
    }

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Clear IP-based rate limiting
    loginAttempts.delete(clientIP);

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      isMasterAdmin: user.isMasterAdmin
    });

    // Create audit log if the model exists in schema
    if ((prisma as any).auditLog && typeof (prisma as any).auditLog.create === 'function') {
      try {
        await (prisma as any).auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN',
            ipAddress: clientIP,
            userAgent: request.headers.get('user-agent')
          }
        });
      } catch (e) {
        // If audit log model doesn't exist or fails, continue without blocking login
        console.warn('Audit log creation skipped:', e);
      }
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