'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { Period } from '@/utils/default-data';

export interface FieldPerformance {
  fieldName: string;
  step: string;
  completionRate: number;
  errorRate: number;
  avgTimeToComplete: number;
  totalAttempts: number;
  totalCompletions: number;
  totalErrors: number;
}

export interface StepMetrics {
  totalFields: number;
  avgCompletionRate: number;
  avgErrorRate: number;
  avgTimeToComplete: number;
  optimizedSessions: number;
  nonOptimizedSessions: number;
  optimizedConversionRate: number;
  nonOptimizedConversionRate: number;
}

export interface TrendDataPoint {
  date: string;
  avgCompletionRate: number;
  avgErrorRate: number;
  avgTimeToComplete: number;
  optimizedSessions: number;
}

export interface FormOptimizationMetricsResponse {
  totalOptimizations: number;
  optimizedConversionRate: number;
  nonOptimizedConversionRate: number;
  improvementRate: number;
  avgCompletionTime: number;
  byStep: {
    profile: StepMetrics;
    shipping: StepMetrics;
    payment: StepMetrics;
  };
  byField: FieldPerformance[];
  trend: TrendDataPoint[];
  period: Period;
}

interface UseFormOptimizationMetricsOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching form optimization metrics
 */
export function useFormOptimizationMetrics(options: UseFormOptimizationMetricsOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/boltx/optimization/metrics?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<FormOptimizationMetricsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `form_optimization_metrics_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    metrics: data || {
      totalOptimizations: 0,
      optimizedConversionRate: 0,
      nonOptimizedConversionRate: 0,
      improvementRate: 0,
      avgCompletionTime: 0,
      byStep: {
        profile: {
          totalFields: 0,
          avgCompletionRate: 0,
          avgErrorRate: 0,
          avgTimeToComplete: 0,
          optimizedSessions: 0,
          nonOptimizedSessions: 0,
          optimizedConversionRate: 0,
          nonOptimizedConversionRate: 0,
        },
        shipping: {
          totalFields: 0,
          avgCompletionRate: 0,
          avgErrorRate: 0,
          avgTimeToComplete: 0,
          optimizedSessions: 0,
          nonOptimizedSessions: 0,
          optimizedConversionRate: 0,
          nonOptimizedConversionRate: 0,
        },
        payment: {
          totalFields: 0,
          avgCompletionRate: 0,
          avgErrorRate: 0,
          avgTimeToComplete: 0,
          optimizedSessions: 0,
          nonOptimizedSessions: 0,
          optimizedConversionRate: 0,
          nonOptimizedConversionRate: 0,
        },
      },
      byField: [],
      trend: [],
      period,
    },
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

