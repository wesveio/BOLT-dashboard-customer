'use client';

import { useDashboardAuth } from './useDashboardAuth';
import {
  hasPermission,
  canWrite,
  canDelete,
  canManage,
  type Role,
} from '@/utils/rbac/permissions';

export function useRolePermissions() {
  const { user } = useDashboardAuth();
  const role = (user?.role || 'viewer') as Role;

  return {
    role,
    hasPermission: (resource: string, action: 'read' | 'write' | 'delete' | 'manage') =>
      hasPermission(role, resource, action),
    canWrite: (resource: string) => canWrite(role, resource),
    canDelete: (resource: string) => canDelete(role, resource),
    canManage: (resource: string) => canManage(role, resource),
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isEditor: role === 'editor' || role === 'admin' || role === 'owner',
  };
}

