'use client';

import { memo } from 'react';
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
  message = 'Loading...',
  fullScreen = false,
  className = '',
}: LoadingStateProps) {
  const content = (
    <div className={`text-center ${className}`}>
      <Spinner size="lg" />
      {message && <p className="mt-4 text-gray-600">{message}</p>}
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

