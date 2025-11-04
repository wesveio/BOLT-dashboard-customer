/**
 * User management utilities
 * Helper functions for user limits, validations, and plan-based constraints
 */

export type PlanType = 'basic' | 'pro' | 'enterprise';
export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

/**
 * User limits per plan type
 */
export const PLAN_USER_LIMITS: Record<PlanType, number> = {
  basic: 3,
  pro: 10,
  enterprise: 20,
} as const;

/**
 * Get user limit for a plan type
 */
export function getPlanUserLimit(planType: PlanType): number {
  return PLAN_USER_LIMITS[planType] || 0;
}

/**
 * Check if account can invite more users
 */
export function canInviteUser(
  currentCount: number,
  planType: PlanType
): boolean {
  const limit = getPlanUserLimit(planType);
  return currentCount < limit;
}

/**
 * Get remaining user slots for an account
 */
export function getRemainingUserSlots(
  currentCount: number,
  planType: PlanType
): number {
  const limit = getPlanUserLimit(planType);
  return Math.max(0, limit - currentCount);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate role
 */
export function isValidRole(role: string): role is UserRole {
  return ['owner', 'admin', 'editor', 'viewer'].includes(role);
}

/**
 * Check if role can invite users
 * According to plan: owners and admins can invite
 */
export function canRoleInviteUsers(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if role can delete users
 * According to plan: owners can delete any user, admins can delete any user except owners
 */
export function canRoleDeleteUser(
  userRole: UserRole,
  targetRole: UserRole
): boolean {
  if (userRole === 'owner') {
    return true; // Owners can delete anyone
  }
  if (userRole === 'admin') {
    return targetRole !== 'owner'; // Admins can delete anyone except owners
  }
  return false;
}

