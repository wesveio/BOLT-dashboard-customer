/**
 * Route Guard Component
 * 
 * Restricts access to routes based on plan features
 * Automatically checks if the current route requires a feature that the user's plan has
 */

'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardBody, Button } from '@heroui/react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import Link from 'next/link';

interface RouteGuardProps {
  children: React.ReactNode;
  route?: string; // Optional route to check, defaults to current pathname
  fallback?: React.ReactNode;
  redirectTo?: string; // Where to redirect if access denied (defaults to /dashboard/plans)
}

/**
 * Component that restricts access based on plan features for a specific route
 */
export function RouteGuard({
  children,
  route,
  fallback,
  redirectTo = '/dashboard/plans',
}: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccessRoute, isLoading, plan } = usePlanAccess();
  const t = useTranslations('dashboard.sidebar');

  // Use provided route or current pathname
  const routeToCheck = route || pathname;

  // Check if user has access to this route
  const hasAccess = canAccessRoute(routeToCheck);

  // Redirect if access is denied (only on mount/route change)
  useEffect(() => {
    if (!isLoading && !hasAccess && routeToCheck) {
      // Only redirect if we're not already on the redirect page
      if (pathname !== redirectTo) {
        console.warn(`⚠️ [DEBUG] Access denied to route: ${routeToCheck}, redirecting to ${redirectTo}`);
        router.push(redirectTo);
      }
    }
  }, [isLoading, hasAccess, routeToCheck, pathname, redirectTo, router]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!hasAccess) {
    return (
      fallback || (
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardBody className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Feature Not Available
                </h3>
                <p className="text-gray-600 max-w-md">
                  {plan
                    ? `This feature is not available in your ${plan.name} plan. Please upgrade to access this feature.`
                    : 'This feature requires an active subscription. Please subscribe to a plan to access this feature.'}
                </p>
              </div>

              {/* Upgrade Button */}
              <Link href={redirectTo}>
                <Button
                  color="primary"
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                >
                  View Plans
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )
    );
  }

  return <>{children}</>;
}

