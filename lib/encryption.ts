/**
 * FinCalc Pro - Field-level encryption for PII data
 * 
 * This module provides AES-GCM encryption for sensitive client data
 * stored in the database. Uses environment-provided encryption keys.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM mode
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

/**
 * Get encryption key from environment or generate for development
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Generate a key for development (this should be set in production)
    return crypto.randomBytes(32);
  }
  
  // Convert hex string to buffer
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data using AES-GCM
 * Returns base64-encoded string containing IV + encrypted data + auth tag
 */
export function encryptField(plaintext: string): string {
  if (!plaintext) return '';
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  // Derive cipher key: if key length is 32 bytes, use directly
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from('FinCalcPro', 'utf8'));

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine IV + encrypted data + auth tag
  const combined = Buffer.concat([iv, encrypted, tag]);
  return combined.toString('base64');
}

/**
 * Decrypt field data
 */
export function decryptField(encryptedData: string): string {
  if (!encryptedData) return '';
  
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');
  
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(-TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH, -TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from('FinCalcPro', 'utf8'));
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a new encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}