'use client';

import { memo } from 'react';
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
  message = 'An error occurred while loading data. Please try again.',
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: ErrorStateProps) {
  return (
    <Card className={`border border-red-200 bg-red-50 ${className}`}>
      <CardBody className="p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-600 mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-700 mb-4">{message}</p>
          {onRetry && (
            <Button
              color="danger"
              variant="flat"
              onPress={onRetry}
            >
              {retryLabel}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
});

