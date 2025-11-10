'use client';

import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Card, CardBody, Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Demo Mode Banner Component
 * 
 * Displays a banner at the top of the dashboard when account is in demo mode
 * (no active subscription). Provides link to upgrade to a plan.
 */
export function DemoModeBanner() {
  const { isDemoMode, isLoading } = usePlanAccess();
  const [isDismissed, setIsDismissed] = useState(false);
  const t = useTranslations('dashboard.demoMode');

  // Don't show if loading, not in demo mode, or dismissed
  if (isLoading || !isDemoMode || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
          <CardBody className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-orange-900 mb-1">
                    {t('title')}
                  </h3>
                  <p className="text-xs text-orange-700 mb-2">
                    {t('description')}
                  </p>
                  <Link href="/dashboard/plans">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {t('upgradeButton')}
                    </Button>
                  </Link>
                </div>
              </div>
              <button
                onClick={() => setIsDismissed(true)}
                className="flex-shrink-0 text-orange-600 hover:text-orange-800 transition-colors p-1"
                aria-label={t('dismiss')}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

