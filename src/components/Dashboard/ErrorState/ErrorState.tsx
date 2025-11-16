'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, CardBody } from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Standardized error display component
 * Provides retry functionality for failed requests
 */
export const ErrorState = memo(function ErrorState({
  message,
  onRetry,
  retryLabel,
  className = '',
}: ErrorStateProps) {
  const t = useTranslations('dashboard.common');
  
  const displayMessage = message || t('errorOccurred');
  const displayRetryLabel = retryLabel || t('retry');
  
  return (
    <Card className={`border border-danger/20 bg-danger/10 ${className}`}>
      <CardBody className="p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-danger mb-4" />
          <h3 className="text-lg font-bold text-danger mb-2">{t('error')}</h3>
          <p className="text-sm text-danger mb-4">{displayMessage}</p>
          {onRetry && (
            <Button
              color="danger"
              variant="flat"
              onPress={onRetry}
            >
              {displayRetryLabel}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
});

