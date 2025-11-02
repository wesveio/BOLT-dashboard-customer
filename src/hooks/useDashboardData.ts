'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import {
  defaultRevenueMetrics,
  defaultRevenueChartData,
  defaultPerformanceMetrics,
  defaultFunnelData,
  defaultStepMetrics,
  defaultAnalyticsMetrics,
  Period,
} from '@/utils/default-data';

// Revenue API Response Types
interface RevenueResponse {
  metrics: {
    totalRevenue: number;
    avgOrderValue: string;
    totalOrders: number;
    revenuePerHour: string;
    revenueGrowth: string;
  };
  chartData: Array<{
    date: string;
    revenue: number;
  }>;
}

// Performance API Response Types
interface PerformanceResponse {
  metrics: {
    conversionRate: string;
    avgCheckoutTime: number;
    abandonmentRate: string;
    totalSessions: number;
  };
  funnel: Array<{
    step: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  stepMetrics: Array<{
    step: string;
    label: string;
    avgTime: number;
    abandonment: number;
  }>;
}

// Analytics API Response Types
interface AnalyticsResponse {
  paymentMethods?: Array<{
    name: string;
    value: number;
    revenue: number;
    successRate: number;
  }>;
  totalPayments?: number;
  avgSuccessRate?: string;
  [key: string]: unknown;
}

interface UseRevenueDataOptions {
  period?: Period;
  enabled?: boolean;
}

/**
 * Hook for fetching revenue data
 * Pre-configured endpoint with period parameter handling
 */
export function useRevenueData(options: UseRevenueDataOptions = {}) {
  const { period = 'week', enabled = true } = options;

  // Build URL with period param
  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    return `/api/dashboard/revenue?${params.toString()}`;
  }, [period]);

  const { data, isLoading, error, refetch } = useApi<RevenueResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `revenue_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  // Merge data with defaults
  const metrics = useMemo(() => {
    return data?.metrics || defaultRevenueMetrics;
  }, [data]);

  const chartData = useMemo(() => {
    return data?.chartData && data.chartData.length > 0
      ? data.chartData
      : defaultRevenueChartData;
  }, [data]);

  return {
    metrics,
    chartData,
    isLoading,
    error,
    refetch,
  };
}

interface UsePerformanceDataOptions {
  period?: Period;
  enabled?: boolean;
}

/**
 * Hook for fetching performance data
 * Pre-configured endpoint with data transformations
 */
export function usePerformanceData(options: UsePerformanceDataOptions = {}) {
  const { period = 'week', enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    return `/api/dashboard/performance?${params.toString()}`;
  }, [period]);

  const { data, isLoading, error, refetch } = useApi<PerformanceResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `performance_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  // Merge data with defaults
  const metrics = useMemo(() => {
    return data?.metrics || defaultPerformanceMetrics;
  }, [data]);

  const funnelData = useMemo(() => {
    return data?.funnel && data.funnel.length > 0
      ? data.funnel
      : defaultFunnelData;
  }, [data]);

  const stepMetrics = useMemo(() => {
    return data?.stepMetrics && data.stepMetrics.length > 0
      ? data.stepMetrics
      : defaultStepMetrics;
  }, [data]);

  return {
    metrics,
    funnelData,
    stepMetrics,
    isLoading,
    error,
    refetch,
  };
}

interface UseAnalyticsDataOptions {
  type: 'payment' | 'shipping' | 'devices' | 'browsers';
  period?: Period;
  enabled?: boolean;
}

/**
 * Hook for fetching analytics data
 * Supports different analytics types with period parameter
 */
export function useAnalyticsData(options: UseAnalyticsDataOptions) {
  const { type, period = 'week', enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    return `/api/dashboard/analytics/${type}?${params.toString()}`;
  }, [type, period]);

  const { data, isLoading, error, refetch } = useApi<AnalyticsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `analytics_${type}_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  // Extract metrics with defaults
  const metrics = useMemo(() => {
    if (type === 'payment') {
      return {
        paymentMethods: data?.paymentMethods || [],
        totalPayments: data?.totalPayments || defaultAnalyticsMetrics.totalPayments,
        avgSuccessRate: data?.avgSuccessRate || defaultAnalyticsMetrics.avgSuccessRate,
      };
    }
    return data || {};
  }, [data, type]);

  return {
    data: metrics,
    isLoading,
    error,
    refetch,
  };
}

