import crypto from 'crypto';

/**
 * Generate a secure random API key
 * @param length - Length of the key (default: 32)
 * @returns Secure random alphanumeric key (mixed case + numbers)
 */
export function generateApiKey(length: number = 32): string {
  // Use crypto.randomBytes for secure random generation
  const bytes = crypto.randomBytes(length);
  
  // Convert to alphanumeric string (mixed case + numbers)
  // Using base64 encoding but filtering to alphanumeric only
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  
  for (let i = 0; i < bytes.length; i++) {
    key += chars[bytes[i] % chars.length];
  }
  
  return key.slice(0, length);
}

/**
 * Hash an API key for storage
 * Uses SHA-256 with salt (similar to code-generator pattern)
 * Note: For production, consider using bcrypt with higher cost factor
 * 
 * @param key - The API key to hash
 * @param salt - Optional salt (if not provided, generates a random one)
 * @returns Hashed key in format "salt:hash"
 */
export function hashApiKey(key: string, salt?: string): string {
  const keySalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(key + keySalt)
    .digest('hex');
  
  return `${keySalt}:${hash}`;
}

/**
 * Verify an API key against a stored hash
 * 
 * @param key - The API key to verify
 * @param hashedKey - The stored hash in format "salt:hash"
 * @returns true if the key matches the hash
 */
export function verifyApiKey(key: string, hashedKey: string): boolean {
  const [salt, hash] = hashedKey.split(':');
  if (!salt || !hash) return false;

  const computedHash = crypto
    .createHash('sha256')
    .update(key + salt)
    .digest('hex');

  return computedHash === hash;
}

/**
 * Mask an API key for display
 * Shows first 8 characters and last 4 characters, masks the rest
 * 
 * @param key - The API key to mask
 * @returns Masked key in format "prefix...suffix"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) {
    // If key is too short, just show dots
    return '•'.repeat(key.length);
  }
  
  const prefix = key.substring(0, 8);
  const suffix = key.substring(key.length - 4);
  
  return `${prefix}...${suffix}`;
}

/**
 * Extract prefix and suffix from an API key
 * 
 * @param key - The API key
 * @returns Object with prefix (first 8 chars) and suffix (last 4 chars)
 */
export function extractKeyParts(key: string): { prefix: string; suffix: string } {
  return {
    prefix: key.substring(0, 8),
    suffix: key.substring(key.length - 4),
  };
}

