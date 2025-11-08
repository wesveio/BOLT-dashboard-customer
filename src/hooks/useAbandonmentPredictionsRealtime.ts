'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAbandonmentPredictionData, type AbandonmentPredictionResponse } from './useDashboardData';

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

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

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

  // Polling effect
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial update
    setLastUpdated(new Date());

    const interval = setInterval(() => {
      refetch().then(() => {
        setLastUpdated(new Date());
      }).catch((err) => {
        console.error('❌ [DEBUG] Error polling predictions:', err);
      });
    }, pollingInterval);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, pollingInterval, refetch]);

  return {
    activeSessions,
    historicalSessions,
    summary,
    isLoading,
    error: error || null,
    lastUpdated,
  };
}

