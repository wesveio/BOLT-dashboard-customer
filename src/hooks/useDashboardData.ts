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
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching revenue data
 * Pre-configured endpoint with period parameter handling
 */
export function useRevenueData(options: UseRevenueDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  // Build URL with period param
  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/revenue?${params.toString()}`;
  }, [period, startDate, endDate]);

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
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching performance data
 * Pre-configured endpoint with data transformations
 */
export function usePerformanceData(options: UsePerformanceDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/performance?${params.toString()}`;
  }, [period, startDate, endDate]);

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
  startDate?: Date | null;
  endDate?: Date | null;
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
    startDate,
    endDate,
    page = 1,
    limit = 50,
    eventType = null,
    category = null,
    step = null,
    enabled = true,
  } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period, page: page.toString(), limit: limit.toString() });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    if (eventType) params.set('event_type', eventType);
    if (category) params.set('category', category);
    if (step) params.set('step', step);
    return `/api/dashboard/analytics/events?${params.toString()}`;
  }, [period, startDate, endDate, page, limit, eventType, category, step]);

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
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching overview metrics data
 * Pre-configured endpoint with period parameter handling
 */
export function useMetricsData(options: UseMetricsDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  // Build URL with period param
  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/metrics?${params.toString()}`;
  }, [period, startDate, endDate]);

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

// Coupons API Response Types
interface CouponsResponse {
  coupons: Array<{
    code: string;
    count: number;
    totalDiscount: number;
    avgDiscount: number;
    revenue: number;
    orders: number;
    avgOrderValue: number;
  }>;
  summary: {
    totalDiscounts: number;
    totalDiscountAmount: number;
    avgDiscountAmount: number;
    couponUsageRate: number;
    revenueWithDiscount: number;
    revenueWithoutDiscount: number;
    ordersWithDiscount: number;
    ordersWithoutDiscount: number;
  };
  period: Period;
}

interface UseCouponsDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching coupons/discounts analytics data
 */
export function useCouponsData(options: UseCouponsDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/coupons?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<CouponsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `coupons_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    coupons: data?.coupons || [],
    summary: data?.summary || {
      totalDiscounts: 0,
      totalDiscountAmount: 0,
      avgDiscountAmount: 0,
      couponUsageRate: 0,
      revenueWithDiscount: 0,
      revenueWithoutDiscount: 0,
      ordersWithDiscount: 0,
      ordersWithoutDiscount: 0,
    },
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// Micro-conversions API Response Types
interface MicroConversionsResponse {
  microConversions: Array<{
    step: string;
    label: string;
    reached: number;
    completed: number;
    conversionRate: number;
    description: string;
  }>;
  dropOffs: Array<{
    step: string;
    dropOff: number;
    dropOffRate?: number;
  }>;
  summary: {
    totalSessions: number;
    overallConversionRate: number;
  };
  period: Period;
}

interface UseMicroConversionsDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching micro-conversions analytics data
 */
export function useMicroConversionsData(options: UseMicroConversionsDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/micro-conversions?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<MicroConversionsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `micro_conversions_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    microConversions: data?.microConversions || [],
    dropOffs: data?.dropOffs || [],
    summary: data?.summary || {
      totalSessions: 0,
      overallConversionRate: 0,
    },
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// Geography API Response Types
interface GeographyResponse {
  countries: Array<{
    country: string;
    sessions: number;
    orders: number;
    revenue: number;
    conversions: number;
    conversionRate: number;
    avgOrderValue: number;
  }>;
  states: Array<{
    country: string;
    state: string;
    sessions: number;
    orders: number;
    revenue: number;
    conversions: number;
    conversionRate: number;
    avgOrderValue: number;
  }>;
  summary: {
    totalSessions: number;
    totalOrders: number;
    totalRevenue: number;
    overallConversionRate: number;
    countriesCount: number;
    statesCount: number;
  };
  period: Period;
}

interface UseGeographyDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching geography analytics data
 */
export function useGeographyData(options: UseGeographyDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/geography?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<GeographyResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `geography_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    countries: data?.countries || [],
    states: data?.states || [],
    summary: data?.summary || {
      totalSessions: 0,
      totalOrders: 0,
      totalRevenue: 0,
      overallConversionRate: 0,
      countriesCount: 0,
      statesCount: 0,
    },
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// LTV API Response Types
interface LTVResponse {
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    avgLTV: number;
    avgOrdersPerCustomer: number;
    recurringRate: number;
    ltvSegments: {
      high: number;
      medium: number;
      low: number;
    };
  };
  customers: Array<{
    customerId: string | null;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    firstOrderDate: string;
    lastOrderDate: string;
    daysBetween: number;
    purchaseFrequency: number;
    isRecurring: boolean;
  }>;
  ltvBySegment: Record<string, {
    customers: number;
    totalRevenue: number;
    avgLTV: number;
  }>;
  period: Period;
}

interface UseLTVDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching LTV (Customer Lifetime Value) analytics data
 */
export function useLTVData(options: UseLTVDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/ltv?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<LTVResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `ltv_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      totalCustomers: 0,
      totalRevenue: 0,
      avgLTV: 0,
      avgOrdersPerCustomer: 0,
      recurringRate: 0,
      ltvSegments: { high: 0, medium: 0, low: 0 },
    },
    customers: data?.customers || [],
    ltvBySegment: data?.ltvBySegment || {},
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// CAC API Response Types
interface CACResponse {
  summary: {
    totalNewCustomers: number;
    avgCAC: number;
    avgLTV: number;
    ltvCacRatio: number;
    totalEstimatedMarketingSpend: number;
    acquisitionEfficiency: {
      excellent: boolean;
      good: boolean;
      needsImprovement: boolean;
      ratio: number;
    };
  };
  channels: Array<{
    channel: string;
    sessions: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    avgOrderValue: number;
    estimatedCAC: number;
    ltvCacRatio: number;
  }>;
  period: Period;
  note?: string;
}

interface UseCACDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching CAC (Customer Acquisition Cost) analytics data
 */
export function useCACData(options: UseCACDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/cac?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<CACResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `cac_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      totalNewCustomers: 0,
      avgCAC: 0,
      avgLTV: 0,
      ltvCacRatio: 0,
      totalEstimatedMarketingSpend: 0,
      acquisitionEfficiency: {
        excellent: false,
        good: false,
        needsImprovement: true,
        ratio: 0,
      },
    },
    channels: data?.channels || [],
    note: data?.note,
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// Retention API Response Types
interface RetentionResponse {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    churnedCustomers: number;
    retentionRate: number;
    churnRate: number;
    avgPurchaseFrequency: number;
    avgDaysBetweenPurchases: number;
    retentionRates: {
      d1: number;
      d7: number;
      d30: number;
      d90: number;
    };
  };
  cohorts: Array<{
    cohort: string;
    customers: number;
    retentionByPeriod: {
      d30: number;
      d60: number;
      d90: number;
    };
  }>;
  period: Period;
}

interface UseRetentionDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching retention analytics data
 */
export function useRetentionData(options: UseRetentionDataOptions = {}) {
  const { period = 'month', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/retention?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<RetentionResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `retention_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      churnedCustomers: 0,
      retentionRate: 0,
      churnRate: 0,
      avgPurchaseFrequency: 0,
      avgDaysBetweenPurchases: 0,
      retentionRates: { d1: 0, d7: 0, d30: 0, d90: 0 },
    },
    cohorts: data?.cohorts || [],
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// Abandonment Prediction API Response Types
export interface AbandonmentPredictionResponse {
  summary: {
    totalSessions: number;
    highRiskSessions: number;
    avgRiskScore: number;
    typicalCheckoutDuration: number;
    avgCheckoutTime: number;
    riskDistribution: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    abandonmentByRisk: Record<string, {
      total: number;
      abandoned: number;
      rate: number;
    }>;
  };
  predictions: Array<{
    sessionId: string;
    prediction: {
      riskScore: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      factors: {
        timeExceeded: number;
        errorCount: number;
        currentStep: string;
        stepDuration: number;
        totalDuration: number;
        hasReturned: boolean;
        stepProgress: number;
      };
      recommendations: string[];
    };
    isActive: boolean;
    isAbandoned: boolean;
    isCompleted: boolean;
  }>;
  period: Period;
}

interface UseAbandonmentPredictionDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching abandonment prediction analytics data
 */
export function useAbandonmentPredictionData(options: UseAbandonmentPredictionDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/abandonment-prediction?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<AbandonmentPredictionResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `abandonment_prediction_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      totalSessions: 0,
      highRiskSessions: 0,
      avgRiskScore: 0,
      typicalCheckoutDuration: 0,
      avgCheckoutTime: 0,
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      abandonmentByRisk: {},
    },
    predictions: data?.predictions || [],
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// Cohorts API Response Types
interface CohortsResponse {
  summary: {
    totalCohorts: number;
    totalCustomers: number;
    avgCohortSize: number;
    avgLTV: number;
    avgRetentionByPeriod: Record<number, number>;
  };
  cohorts: Array<{
    cohort: string;
    cohortSize: number;
    totalRevenue: number;
    avgLTV: number;
    retentionMatrix: Array<{
      period: number;
      retentionRate: number;
      customers: number;
      revenue: number;
      orders: number;
    }>;
  }>;
  period: Period;
}

interface UseCohortsDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching cohorts analytics data
 */
export function useCohortsData(options: UseCohortsDataOptions = {}) {
  const { period = 'month', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/cohorts?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<CohortsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `cohorts_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      totalCohorts: 0,
      totalCustomers: 0,
      avgCohortSize: 0,
      avgLTV: 0,
      avgRetentionByPeriod: {},
    },
    cohorts: data?.cohorts || [],
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// Segments API Response Types
interface SegmentsResponse {
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    overallAvgLTV: number;
    avgAOV: number;
    avgOrders: number;
  };
  segments: Array<{
    name: string;
    description: string;
    metrics: {
      count: number;
      totalRevenue: number;
      avgLTV: number;
      avgAOV: number;
      avgOrders: number;
      conversionRate: number;
    };
  }>;
  period: Period;
}

interface UseSegmentsDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching behavioral segments analytics data
 */
export function useSegmentsData(options: UseSegmentsDataOptions = {}) {
  const { period = 'month', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/segments?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<SegmentsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `segments_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      totalCustomers: 0,
      totalRevenue: 0,
      overallAvgLTV: 0,
      avgAOV: 0,
      avgOrders: 0,
    },
    segments: data?.segments || [],
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// Optimization ROI API Response Types
interface OptimizationROIResponse {
  summary: {
    beforePeriod: {
      start: string;
      end: string;
      sessions: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
      orders: number;
      aov: number;
    };
    afterPeriod: {
      start: string;
      end: string;
      sessions: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
      orders: number;
      aov: number;
    };
    changes: {
      revenueChange: number;
      revenueChangePercent: number | null;
      conversionRateChange: number;
      conversionRateChangePercent: number | null;
      aovChange: number;
      aovChangePercent: number | null;
      additionalOrders: number;
      additionalRevenue: number;
    };
    roi: {
      optimizationCost: number;
      additionalRevenue: number;
      roi: number;
      roiFormatted: string;
    };
  };
  period: Period;
  optimizationDate: string;
}

interface UseOptimizationROIDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  optimizationDate?: string;
  enabled?: boolean;
}

/**
 * Hook for fetching optimization ROI analytics data
 */
export function useOptimizationROIData(options: UseOptimizationROIDataOptions = {}) {
  const { period = 'month', startDate, endDate, optimizationDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    if (optimizationDate) {
      params.append('optimizationDate', optimizationDate);
    }
    return `/api/dashboard/analytics/optimization-roi?${params.toString()}`;
  }, [period, startDate, endDate, optimizationDate]);

  const { data, isLoading, error, refetch } = useApi<OptimizationROIResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `optimization_roi_${period}_${optimizationDate || 'default'}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      beforePeriod: {
        start: '',
        end: '',
        sessions: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        orders: 0,
        aov: 0,
      },
      afterPeriod: {
        start: '',
        end: '',
        sessions: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        orders: 0,
        aov: 0,
      },
      changes: {
        revenueChange: 0,
        revenueChangePercent: null,
        conversionRateChange: 0,
        conversionRateChangePercent: null,
        aovChange: 0,
        aovChangePercent: null,
        additionalOrders: 0,
        additionalRevenue: 0,
      },
      roi: {
        optimizationCost: 0,
        additionalRevenue: 0,
        roi: 0,
        roiFormatted: '0%',
      },
    },
    isLoading,
    error,
    refetch,
    period: data?.period || period,
    optimizationDate: data?.optimizationDate || '',
  };
}

// Friction Score API Response Types
interface FrictionScoreResponse {
  summary: {
    totalSessions: number;
    avgFrictionScore: number;
    frictionDistribution: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    frictionBreakdown: {
      timeScore: number;
      errorScore: number;
      navigationScore: number;
      completionScore: number;
    };
    highFrictionConversionRate: number;
    lowFrictionConversionRate: number;
    correlation: number;
  };
  frictionScores: Array<{
    sessionId: string;
    score: {
      score: number;
      level: 'low' | 'medium' | 'high' | 'critical';
      factors: {
        totalDuration: number;
        errorCount: number;
        backNavigations: number;
        fieldsFilled: number;
        totalFields: number;
        stepsCompleted: number;
        totalSteps: number;
        hasReturned: boolean;
      };
      breakdown: {
        timeScore: number;
        errorScore: number;
        navigationScore: number;
        completionScore: number;
      };
    };
    conversion: boolean;
  }>;
  frictionTrend: Array<{
    date: string;
    avgFriction: number;
    conversionRate: number;
  }>;
  period: Period;
}

interface UseFrictionScoreDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  enabled?: boolean;
}

/**
 * Hook for fetching friction score analytics data
 */
export function useFrictionScoreData(options: UseFrictionScoreDataOptions = {}) {
  const { period = 'week', startDate, endDate, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/friction-score?${params.toString()}`;
  }, [period, startDate, endDate]);

  const { data, isLoading, error, refetch } = useApi<FrictionScoreResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `friction_score_${period}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      totalSessions: 0,
      avgFrictionScore: 0,
      frictionDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      frictionBreakdown: {
        timeScore: 0,
        errorScore: 0,
        navigationScore: 0,
        completionScore: 0,
      },
      highFrictionConversionRate: 0,
      lowFrictionConversionRate: 0,
      correlation: 0,
    },
    frictionScores: data?.frictionScores || [],
    frictionTrend: data?.frictionTrend || [],
    isLoading,
    error,
    refetch,
    period: data?.period || period,
  };
}

// Revenue Forecast API Response Types
interface RevenueForecastResponse {
  summary: {
    totalHistoricalRevenue: number;
    avgDailyRevenue: number;
    totalForecastRevenue: number;
    avgForecastRevenue: number;
    forecast7Revenue: number;
    forecast30Revenue: number;
    forecast90Revenue: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    avgGrowth: number;
  };
  historical: Array<{
    date: string;
    revenue: number;
  }>;
  forecast: Array<{
    date: string;
    forecast: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }>;
  accuracy: {
    mae: number;
    mape: number;
    rmse: number;
  } | null;
  period: Period;
  forecastDays: number;
}

interface UseRevenueForecastDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  forecastDays?: number;
  enabled?: boolean;
}

/**
 * Hook for fetching revenue forecast analytics data
 */
export function useRevenueForecastData(options: UseRevenueForecastDataOptions = {}) {
  const { period = 'month', startDate, endDate, forecastDays = 30, enabled = true } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period, days: forecastDays.toString() });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    return `/api/dashboard/analytics/revenue-forecast?${params.toString()}`;
  }, [period, startDate, endDate, forecastDays]);

  const { data, isLoading, error, refetch } = useApi<RevenueForecastResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `revenue_forecast_${period}_${forecastDays}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  return {
    summary: data?.summary || {
      totalHistoricalRevenue: 0,
      avgDailyRevenue: 0,
      totalForecastRevenue: 0,
      avgForecastRevenue: 0,
      forecast7Revenue: 0,
      forecast30Revenue: 0,
      forecast90Revenue: 0,
      trend: 'stable',
      avgGrowth: 0,
    },
    historical: data?.historical || [],
    forecast: data?.forecast || [],
    accuracy: data?.accuracy || null,
    isLoading,
    error,
    refetch,
    period: data?.period || period,
    forecastDays: data?.forecastDays || forecastDays,
  };
}

