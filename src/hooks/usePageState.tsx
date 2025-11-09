/**
 * Hook for managing page loading and error states
 * Encapsulates the common pattern of handling loading/error states in dashboard pages
 */

import { useMemo } from 'react';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';

export interface UsePageStateOptions {
  isLoading: boolean;
  error: Error | null | undefined;
  onRetry?: () => void;
  title: string;
  subtitle?: string;
  loadingMessage?: string;
  errorMessage?: string;
  retryLabel?: string;
}

export interface UsePageStateResult {
  /**
   * Renders the page wrapper with loading or error state if applicable
   * Returns null if page should render normally
   */
  renderPageState: () => React.ReactNode | null;
  /**
   * Whether the page is in a loading state
   */
  isLoading: boolean;
  /**
   * Whether the page is in an error state
   */
  hasError: boolean;
}

/**
 * Hook that manages page loading and error states
 * Returns a function to render loading/error states and flags for current state
 */
export function usePageState({
  isLoading,
  error,
  onRetry,
  title,
  subtitle,
  loadingMessage,
  errorMessage,
  retryLabel,
}: UsePageStateOptions): UsePageStateResult {
  const hasError = !!error;

  const renderPageState = useMemo(() => {
    return () => {
      if (isLoading) {
        return (
          <PageWrapper>
            <PageHeader title={title} subtitle={subtitle} />
            <LoadingState message={loadingMessage} fullScreen />
          </PageWrapper>
        );
      }

      if (hasError) {
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

      return null;
    };
  }, [isLoading, hasError, title, subtitle, loadingMessage, errorMessage, onRetry, retryLabel]);

  return {
    renderPageState,
    isLoading,
    hasError,
  };
}

