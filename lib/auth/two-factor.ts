/**
 * FinCalc Pro - Two-Factor Authentication (TOTP)
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate 2FA secret and setup info
 */
export async function generateTwoFactorSecret(userEmail: string): Promise<{
  secret: string;
  qrCodeDataURL: string;
  backupCodes: string[];
}> {
  const secret = speakeasy.generateSecret({
    name: userEmail,
    issuer: 'FinCalc Pro',
    length: 32
  });

  const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);
  
  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  return {
    secret: secret.base32,
    qrCodeDataURL,
    backupCodes
  };
}

/**
 * Verify TOTP token
 */
export function verifyTOTP(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps (60 seconds) tolerance
  });
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
}