/**
 * Session configuration utilities
 * Centralized functions to read session-related environment variables
 */

/**
 * Get session duration in hours from environment variable
 * Defaults to 24 hours if not set
 * 
 * @returns Session duration in hours
 */
export function getSessionDurationHours(): number {
  const hours = parseInt(
    process.env.AUTH_SESSION_DURATION_HOURS || '24',
    10
  );
  
  // Validate that hours is a positive number
  if (isNaN(hours) || hours <= 0) {
    console.warn('⚠️ [DEBUG] Invalid AUTH_SESSION_DURATION_HOURS, using default 24 hours');
    return 24;
  }
  
  return hours;
}

/**
 * Get refresh token duration in days from environment variable
 * Defaults to 30 days if not set
 * 
 * @returns Refresh token duration in days
 */
export function getRefreshTokenDurationDays(): number {
  const days = parseInt(
    process.env.AUTH_REFRESH_TOKEN_DURATION_DAYS || '30',
    10
  );
  
  // Validate that days is a positive number
  if (isNaN(days) || days <= 0) {
    console.warn('⚠️ [DEBUG] Invalid AUTH_REFRESH_TOKEN_DURATION_DAYS, using default 30 days');
    return 30;
  }
  
  return days;
}

/**
 * Get session duration in milliseconds
 * 
 * @returns Session duration in milliseconds
 */
export function getSessionDurationMs(): number {
  return getSessionDurationHours() * 60 * 60 * 1000;
}

/**
 * Get session duration in seconds (for cookie maxAge)
 * 
 * @returns Session duration in seconds
 */
export function getSessionDurationSeconds(): number {
  return getSessionDurationHours() * 60 * 60;
}

/**
 * Get refresh token duration in milliseconds
 * 
 * @returns Refresh token duration in milliseconds
 */
export function getRefreshTokenDurationMs(): number {
  return getRefreshTokenDurationDays() * 24 * 60 * 60 * 1000;
}

/**
 * Get refresh token duration in seconds (for cookie maxAge)
 * 
 * @returns Refresh token duration in seconds
 */
export function getRefreshTokenDurationSeconds(): number {
  return getRefreshTokenDurationDays() * 24 * 60 * 60;
}

/**
 * Calculate session expiration date
 * 
 * @returns Date when session expires
 */
export function calculateSessionExpiration(): Date {
  return new Date(Date.now() + getSessionDurationMs());
}

/**
 * Calculate refresh token expiration date
 * 
 * @returns Date when refresh token expires
 */
export function calculateRefreshTokenExpiration(): Date {
  return new Date(Date.now() + getRefreshTokenDurationMs());
}


