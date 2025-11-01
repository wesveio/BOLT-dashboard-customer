/**
 * Utilities for sanitizing and normalizing user input
 * Prevents injection attacks and ensures data consistency
 */

/**
 * Sanitize and normalize email address
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes any potentially dangerous characters
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>\"'%;()&+\/\\]/g, '');
}

/**
 * Sanitize and normalize VTEX Account name
 * - Converts to lowercase
 * - Removes all spaces
 * - Trims whitespace
 * - Removes any non-alphanumeric characters except hyphens and underscores
 */
export function sanitizeVTEXAccount(account: string): string {
  if (!account) return '';
  
  return account
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z0-9\-_]/g, ''); // Only allow alphanumeric, hyphens, and underscores
}

/**
 * Sanitize text input (names, etc.)
 * - Trims whitespace
 * - Removes potentially dangerous characters
 * - Limits length to prevent buffer overflow
 */
export function sanitizeText(text: string, maxLength: number = 200): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>\"'%;()&+\/\\\x00-\x1F]/g, '') // Remove control characters and dangerous symbols
    .slice(0, maxLength); // Prevent buffer overflow
}

/**
 * Sanitize company name (optional field)
 * - Trims whitespace
 * - Removes potentially dangerous characters
 * - Allows more characters than regular text (for company names with special chars)
 */
export function sanitizeCompanyName(name: string): string {
  if (!name) return '';
  
  return name
    .trim()
    .replace(/[<>\"'%;()&+\/\\\x00-\x1F]/g, '') // Remove control characters and dangerous symbols
    .slice(0, 200); // Max 200 characters
}

