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
  firstName?: string;
  lastName?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
  accountId?: string;
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
    firstName: 'Development',
    lastName: 'User',
    role: 'owner',
    phone: '+55 (11) 99999-9999',
    company: 'Development Company',
    jobTitle: 'Developer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    accountId: 'dev-account-id',
  };
}

