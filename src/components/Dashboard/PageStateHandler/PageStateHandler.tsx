'use client';

import { memo } from 'react';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';

export interface PageStateHandlerProps {
  /**
   * Whether the page is loading
   */
  isLoading: boolean;
  /**
   * Error object if there's an error
   */
  error: Error | null | undefined;
  /**
   * Function to retry on error
   */
  onRetry?: () => void;
  /**
   * Page title
   */
  title: string;
  /**
   * Page subtitle
   */
  subtitle?: string;
  /**
   * Loading message
   */
  loadingMessage?: string;
  /**
   * Error message
   */
  errorMessage?: string;
  /**
   * Retry button label
   */
  retryLabel?: string;
  /**
   * Children to render when not loading and no error
   */
  children: React.ReactNode;
}

/**
 * Component that automatically handles loading and error states
 * Renders LoadingState or ErrorState when appropriate, otherwise renders children
 */
export const PageStateHandler = memo(function PageStateHandler({
  isLoading,
  error,
  onRetry,
  title,
  subtitle,
  loadingMessage,
  errorMessage,
  retryLabel,
  children,
}: PageStateHandlerProps) {
  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={title} subtitle={subtitle} />
        <LoadingState message={loadingMessage} fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={title} subtitle={subtitle} />
        <ErrorState
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
        />
      </PageWrapper>
    );
  }

  return <>{children}</>;
});

