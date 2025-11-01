/**
 * Role-Based Access Control (RBAC) Permissions
 * Defines what each role can do in the dashboard
 */

export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'manage';
}

export const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    // Full access to everything
    { resource: '*', action: 'manage' },
  ],
  admin: [
    // Can read and write most things, but not manage users or billing
    { resource: 'dashboard', action: 'read' },
    { resource: 'dashboard', action: 'write' },
    { resource: 'analytics', action: 'read' },
    { resource: 'analytics', action: 'write' },
    { resource: 'themes', action: 'read' },
    { resource: 'themes', action: 'write' },
    { resource: 'themes', action: 'delete' },
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'write' },
    // Cannot manage users or billing
  ],
  editor: [
    // Can edit themes and view analytics
    { resource: 'dashboard', action: 'read' },
    { resource: 'analytics', action: 'read' },
    { resource: 'themes', action: 'read' },
    { resource: 'themes', action: 'write' },
  ],
  viewer: [
    // Read-only access
    { resource: 'dashboard', action: 'read' },
    { resource: 'analytics', action: 'read' },
  ],
};

/**
 * Check if a role has permission for a specific resource and action
 */
export function hasPermission(
  role: Role,
  resource: string,
  action: Permission['action']
): boolean {
  const permissions = rolePermissions[role] || [];

  // Owner has access to everything
  if (permissions.some((p) => p.resource === '*' && p.action === 'manage')) {
    return true;
  }

  // Check for specific permission
  return permissions.some(
    (p) =>
      (p.resource === resource || p.resource === '*') &&
      (p.action === action || p.action === 'manage')
  );
}

/**
 * Check if a role can write to a resource
 */
export function canWrite(role: Role, resource: string): boolean {
  return (
    hasPermission(role, resource, 'write') ||
    hasPermission(role, resource, 'manage')
  );
}

/**
 * Check if a role can delete a resource
 */
export function canDelete(role: Role, resource: string): boolean {
  return hasPermission(role, resource, 'delete') || hasPermission(role, resource, 'manage');
}

/**
 * Check if a role can manage (full control) a resource
 */
export function canManage(role: Role, resource: string): boolean {
  return hasPermission(role, resource, 'manage');
}

/**
 * Get all allowed resources for a role
 */
export function getAllowedResources(role: Role): string[] {
  const permissions = rolePermissions[role] || [];
  return [...new Set(permissions.map((p) => p.resource))];
}

