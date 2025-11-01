'use client';

import { ReactNode } from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Card, CardBody } from '@heroui/react';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: 'owner' | 'admin' | 'editor' | 'viewer';
  requiredPermission?: {
    resource: string;
    action: 'read' | 'write' | 'delete' | 'manage';
  };
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}: RoleGuardProps) {
  const { role, hasPermission } = useRolePermissions();

  // Check role requirement
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      viewer: 1,
      editor: 2,
      admin: 3,
      owner: 4,
    };

    if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
      return (
        fallback || (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardBody className="p-6">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-red-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-red-700 font-semibold">Access Denied</p>
                  <p className="text-red-600 text-sm">
                    You don't have permission to access this resource. Required role: {requiredRole}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )
      );
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    if (!hasPermission(requiredPermission.resource, requiredPermission.action)) {
      return (
        fallback || (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardBody className="p-6">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-red-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-red-700 font-semibold">Access Denied</p>
                  <p className="text-red-600 text-sm">
                    You don't have permission to {requiredPermission.action} this resource.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )
      );
    }
  }

  return <>{children}</>;
}

