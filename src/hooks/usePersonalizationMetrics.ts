'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { Period } from '@/utils/default-data';

export interface ConversionByDevice {
  total: number;
  converted: number;
  conversionRate: number;
}

export interface PersonalizationMetricsResponse {
  totalProfiles: number;
  activeProfiles: number;
  personalizationRate: number;
  personalizedConversionRate: number;
  nonPersonalizedConversionRate: number;
  deviceDistribution: Record<string, number>;
  conversionByDevice: Record<string, ConversionByDevice>;
  period: Period;
}

interface UsePersonalizationMetricsOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching personalization metrics
 */
export function usePersonalizationMetrics(options: UsePersonalizationMetricsOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/boltx/personalization/metrics?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<PersonalizationMetricsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `personalization_metrics_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    metrics: data || {
      totalProfiles: 0,
      activeProfiles: 0,
      personalizationRate: 0,
      personalizedConversionRate: 0,
      nonPersonalizedConversionRate: 0,
      deviceDistribution: {},
      conversionByDevice: {},
      period,
    },
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

