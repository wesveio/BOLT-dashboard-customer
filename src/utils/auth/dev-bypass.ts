/**
 * Development authentication bypass utility
 * 
 * ⚠️ SECURITY WARNING: This bypass ONLY works in development mode.
 * It will be automatically disabled in production.
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

/**
 * Check if authentication bypass is enabled
 * Only works in development mode for security
 */
export function isAuthBypassEnabled(): boolean {
  // Only allow bypass in development
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // Check if bypass flag is set to 'true'
  return process.env.BYPASS_AUTH === 'true';
}

/**
 * Get mock user for development bypass
 */
export function getMockUser(): MockUser {
  return {
    id: 'dev-bypass-user-id',
    email: 'dev@example.com',
    name: 'Development User',
    role: 'owner',
  };
}

