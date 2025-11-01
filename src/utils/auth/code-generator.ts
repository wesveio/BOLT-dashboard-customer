import crypto from 'crypto';

/**
 * Generate a secure 6-digit access code
 * @returns 6-digit code as string
 */
export function generateAccessCode(): string {
  // Generate random 6-digit code (100000 to 999999)
  const code = crypto.randomInt(100000, 999999);
  return code.toString();
}

/**
 * Hash an access code for storage
 * Uses SHA-256 with salt
 */
export function hashCode(code: string, salt?: string): string {
  const codeSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(code + codeSalt)
    .digest('hex');
  
  return `${codeSalt}:${hash}`;
}

/**
 * Verify an access code against a hash
 */
export function verifyCode(code: string, hashedCode: string): boolean {
  const [salt, hash] = hashedCode.split(':');
  if (!salt || !hash) return false;

  const computedHash = crypto
    .createHash('sha256')
    .update(code + salt)
    .digest('hex');

  return computedHash === hash;
}

/**
 * Generate a secure random token for sessions
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

