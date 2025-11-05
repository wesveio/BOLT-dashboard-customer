/**
 * Plan Guard Component
 * 
 * Restricts access to content based on subscription plan
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardBody, Button } from '@heroui/react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { PlanCode } from '@/utils/plans';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';

interface PlanGuardProps {
  children: React.ReactNode;
  requiredPlan?: PlanCode;
  fallback?: React.ReactNode;
}

/**
 * Component that restricts access based on subscription plan
 */
export function PlanGuard({
  children,
  requiredPlan = 'enterprise',
  fallback,
}: PlanGuardProps) {
  const { hasEnterpriseAccess, isLoading, currentPlan } = usePlanAccess();
  const t = useTranslations('dashboard.boltx');

  if (isLoading) {
    return <LoadingState />;
  }

  // Check if user has required plan access
  const hasAccess =
    requiredPlan === 'enterprise' ? hasEnterpriseAccess : currentPlan === requiredPlan;

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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('enterpriseRequired')}
                </h3>
                <p className="text-gray-600 max-w-md">
                  {requiredPlan === 'enterprise'
                    ? t('enterpriseRequired')
                    : `This feature requires a ${requiredPlan} plan.`}
                </p>
              </div>

              {/* Upgrade Button */}
              <Link href="/dashboard/plans">
                <Button
                  color="primary"
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                >
                  {t('upgradeButton')}
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

