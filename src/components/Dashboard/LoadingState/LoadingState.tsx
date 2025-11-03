'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@heroui/react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Reusable loading spinner component
 * Consistent loading UI across pages with customizable messages
 */
export const LoadingState = memo(function LoadingState({
  message,
  fullScreen = false,
  className = '',
}: LoadingStateProps) {
  const t = useTranslations('dashboard.common');
  const displayMessage = message || t('loading');
  
  const content = (
    <div className={`text-center ${className}`}>
      <Spinner size="lg" />
      {displayMessage && <p className="mt-4 text-gray-600">{displayMessage}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        {content}
      </div>
    );
  }

  return content;
});

