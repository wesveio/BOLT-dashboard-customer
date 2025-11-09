'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAbandonmentPredictionData, type AbandonmentPredictionResponse } from './useDashboardData';
import { usePageVisibility } from './usePageVisibility';

interface RealtimePredictionsData {
  activeSessions: AbandonmentPredictionResponse['predictions'];
  historicalSessions: AbandonmentPredictionResponse['predictions'];
  summary: AbandonmentPredictionResponse['summary'];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

interface UseAbandonmentPredictionsRealtimeOptions {
  period?: 'today' | 'week' | 'month' | 'year';
  pollingInterval?: number; // milliseconds
  enabled?: boolean;
}

/**
 * Hook for fetching abandonment predictions with real-time polling
 * Separates active sessions (not completed/abandoned) from historical data
 * 
 * **Polling Behavior:**
 * - Polling automatically pauses when the page/tab is not visible (user switched tabs or minimized window)
 * - Polling resumes automatically when the page becomes visible again
 * - When resuming, an immediate refetch is performed to ensure data is up-to-date
 * - Manual refetch operations (e.g., button clicks) are not affected by page visibility
 * 
 * @param options - Configuration options for the hook
 * @param options.period - Time period for predictions ('today' | 'week' | 'month' | 'year')
 * @param options.pollingInterval - Interval between polling requests in milliseconds (default: 10000)
 * @param options.enabled - Whether polling is enabled (default: true)
 * 
 * @example
 * ```tsx
 * const { activeSessions, lastUpdated } = useAbandonmentPredictionsRealtime({
 *   period: 'week',
 *   pollingInterval: 10000, // 10 seconds
 *   enabled: true
 * });
 * ```
 */
export function useAbandonmentPredictionsRealtime(
  options: UseAbandonmentPredictionsRealtimeOptions = {}
): RealtimePredictionsData {
  const {
    period = 'week',
    pollingInterval = 10000, // 10 seconds default
    enabled = true,
  } = options;

  const {
    summary,
    predictions,
    isLoading,
    error,
    refetch,
  } = useAbandonmentPredictionData({
    period,
    enabled,
  });

  const { isVisible } = usePageVisibility();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousVisibleRef = useRef<boolean>(true);

  // Separate active from historical sessions
  const { activeSessions, historicalSessions } = useMemo(() => {
    const active: typeof predictions = [];
    const historical: typeof predictions = [];

    predictions.forEach((pred) => {
      if (pred.isActive && !pred.isCompleted && !pred.isAbandoned) {
        active.push(pred);
      } else {
        historical.push(pred);
      }
    });

    // Sort active sessions by risk score (highest first)
    active.sort((a, b) => b.prediction.riskScore - a.prediction.riskScore);

    return {
      activeSessions: active,
      historicalSessions: historical,
    };
  }, [predictions]);

  // Polling effect - only runs when page is visible
  useEffect(() => {
    if (!enabled || !isVisible) {
      // Clear interval if disabled or page not visible
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial update
    setLastUpdated(new Date());

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      // Double-check visibility before each fetch
      if (document.visibilityState === 'visible') {
        refetch().then(() => {
          setLastUpdated(new Date());
        }).catch((err) => {
          console.error('❌ [DEBUG] Error polling predictions:', err);
        });
      }
    }, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isVisible, pollingInterval, refetch]);

  // Immediate refetch when page becomes visible again
  useEffect(() => {
    // Only refetch if page just became visible (was hidden, now visible)
    if (enabled && isVisible && !previousVisibleRef.current) {
      console.info('✅ [DEBUG] Page became visible, refreshing predictions data');
      refetch().then(() => {
        setLastUpdated(new Date());
      }).catch((err) => {
        console.error('❌ [DEBUG] Error refreshing predictions on visibility change:', err);
      });
    }
    
    // Update previous visible state
    previousVisibleRef.current = isVisible;
  }, [enabled, isVisible, refetch]);

  return {
    activeSessions,
    historicalSessions,
    summary,
    isLoading,
    error: error || null,
    lastUpdated,
  };
}

