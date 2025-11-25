/**
 * FinCalc Pro - JWT Authentication utilities
 * 
 * Handles JWT token generation, validation, and refresh token logic
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  isMasterAdmin: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJWTSecret();
    const payload = jwt.verify(token, secret) as JWTPayload;
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(payload: JWTPayload): TokenPair {
  const accessToken = jwt.sign(payload, getJWTSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'fincalc-pro',
    audience: 'fincalc-users'
  });

  const refreshTokenPayload = {
    userId: payload.userId,
    type: 'refresh'
  };

  const refreshToken = jwt.sign(refreshTokenPayload, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'fincalc-pro',
    audience: 'fincalc-users'
  });

  return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, getJWTSecret(), {
      issuer: 'fincalc-pro',
      audience: 'fincalc-users'
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, getRefreshSecret(), {
      issuer: 'fincalc-pro',
      audience: 'fincalc-users'
    }) as any;

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return { userId: payload.userId };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(userId: string): string {
  const payload = {
    userId,
    type: 'password-reset'
  };

  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: '1h',
    issuer: 'fincalc-pro',
    audience: 'fincalc-users'
  });
}

/**
 * Verify password reset token
 */
export function verifyPasswordResetToken(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, getJWTSecret(), {
      issuer: 'fincalc-pro',
      audience: 'fincalc-users'
    }) as any;

    if (payload.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }

    return { userId: payload.userId };
  } catch (error) {
    throw new Error('Invalid password reset token');
  }
}

/**
 * Generate random token for additional security
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}