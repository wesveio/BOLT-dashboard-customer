'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { Period } from '@/utils/default-data';

export interface InterventionMetricsByType {
  total: number;
  applied: number;
  converted: number;
  abandoned: number;
  pending: number;
  conversionRate: number;
  avgRiskScore: number;
}

export interface InterventionMetricsResponse {
  totalInterventions: number;
  totalApplied: number;
  overallConversionRate: number;
  withInterventionRate: number;
  withoutInterventionRate: number;
  byType: Record<string, InterventionMetricsByType>;
  estimatedROI: number;
  period: Period;
}

interface UseInterventionMetricsOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching intervention effectiveness metrics
 */
export function useInterventionMetrics(options: UseInterventionMetricsOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/boltx/interventions/metrics?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<InterventionMetricsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `intervention_metrics_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    metrics: data || {
      totalInterventions: 0,
      totalApplied: 0,
      overallConversionRate: 0,
      withInterventionRate: 0,
      withoutInterventionRate: 0,
      byType: {},
      estimatedROI: 0,
      period,
    },
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

