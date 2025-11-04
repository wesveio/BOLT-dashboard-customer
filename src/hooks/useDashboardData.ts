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
  defaultOverviewMetrics,
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
  revenueByHour?: Array<{
    hour: string;
    revenue: number;
  }>;
  revenueByDay?: Array<{
    day: string;
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

// Analytics Events API Response Types
export interface AnalyticsEvent {
  id: string;
  session_id: string;
  order_form_id: string | null;
  event_type: string;
  category: 'user_action' | 'api_call' | 'metric' | 'error';
  step: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface AnalyticsEventsResponse {
  summary: {
    totalEvents: number;
    uniqueSessions: number;
    eventsByCategory: {
      user_action: number;
      api_call: number;
      metric: number;
      error: number;
    };
    topEventTypes: Array<{
      type: string;
      count: number;
    }>;
    errorCount: number;
  };
  events: AnalyticsEvent[];
  pagination: {
    page: number;
    limit: number;
    totalEvents: number;
    totalPages: number;
    hasMore: boolean;
  };
  period: Period;
  dateRange: {
    start: string;
    end: string;
  };
}

// Metrics API Response Types
interface MetricsResponse {
  metrics: {
    totalSessions: number;
    totalConversions: number;
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    conversionRate: number;
    abandonmentRate: number;
  };
  funnel: {
    cart: number;
    profile: number;
    shipping: number;
    payment: number;
    confirmed: number;
  };
  period: Period;
  dateRange: {
    start: string;
    end: string;
  };
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

  const revenueByHour = useMemo(() => {
    return data?.revenueByHour || [];
  }, [data]);

  const revenueByDay = useMemo(() => {
    return data?.revenueByDay || [];
  }, [data]);

  return {
    metrics,
    chartData,
    revenueByHour,
    revenueByDay,
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

interface UseAnalyticsEventsDataOptions {
  period?: Period;
  page?: number;
  limit?: number;
  eventType?: string | null;
  category?: string | null;
  step?: string | null;
  enabled?: boolean;
}

/**
 * Hook for fetching analytics events data
 * Supports period, pagination, and filtering
 */
export function useAnalyticsEventsData(options: UseAnalyticsEventsDataOptions = {}) {
  const {
    period = 'week',
    page = 1,
    limit = 50,
    eventType = null,
    category = null,
    step = null,
    enabled = true,
  } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period, page: page.toString(), limit: limit.toString() });
    if (eventType) params.set('event_type', eventType);
    if (category) params.set('category', category);
    if (step) params.set('step', step);
    return `/api/dashboard/analytics/events?${params.toString()}`;
  }, [period, page, limit, eventType, category, step]);

  const { data, isLoading, error, refetch } = useApi<AnalyticsEventsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `analytics_events_${period}_${page}_${limit}_${eventType || ''}_${category || ''}_${step || ''}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary,
    events: data?.events || [],
    pagination: data?.pagination,
    dateRange: data?.dateRange,
    isLoading,
    error,
    refetch,
  };
}

interface UseMetricsDataOptions {
  period?: Period;
  enabled?: boolean;
}

/**
 * Hook for fetching overview metrics data
 * Pre-configured endpoint with period parameter handling
 */
export function useMetricsData(options: UseMetricsDataOptions = {}) {
  const { period = 'week', enabled = true } = options;

  // Build URL with period param
  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    return `/api/dashboard/metrics?${params.toString()}`;
  }, [period]);

  const { data, isLoading, error, refetch } = useApi<MetricsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `metrics_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  // Merge data with defaults and ensure non-negative values
  const metrics = useMemo(() => {
    if (!data?.metrics) return defaultOverviewMetrics;

    return {
      totalRevenue: Math.max(0, data.metrics.totalRevenue || 0),
      totalOrders: Math.max(0, data.metrics.totalOrders || 0),
      conversionRate: Math.max(0, Math.min(100, data.metrics.conversionRate || 0)),
      totalSessions: Math.max(0, data.metrics.totalSessions || 0),
    };
  }, [data]);

  return {
    metrics,
    isLoading,
    error,
    refetch,
    period: data?.period || period,
    dateRange: data?.dateRange,
  };
}

