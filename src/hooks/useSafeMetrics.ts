/**
 * Hook for normalizing metrics ensuring non-negative values
 * Provides consistent metric normalization across dashboard pages
 */

import { useMemo } from 'react';
import {
  ensureNonNegative,
  safeParseNumber,
  normalizeMetrics,
  ensurePercentage,
} from '@/utils/data-validation';

export interface UseSafeMetricsOptions {
  /**
   * Whether to allow negative values (default: false)
   */
  allowNegative?: boolean;
  /**
   * Minimum value for clamping (default: 0)
   */
  min?: number;
  /**
   * Maximum value for clamping (default: Infinity)
   */
  max?: number;
}

/**
 * Hook that normalizes metrics ensuring all numeric values are non-negative
 */
export function useSafeMetrics<T extends Record<string, any>>(
  metrics: T,
  options?: UseSafeMetricsOptions
): T {
  return useMemo(() => {
    return normalizeMetrics(metrics, {
      allowNegative: options?.allowNegative ?? false,
      min: options?.min ?? 0,
      max: options?.max ?? Infinity,
    });
  }, [metrics, options?.allowNegative, options?.min, options?.max]);
}

/**
 * Hook for normalizing performance metrics
 * Ensures conversion rates and percentages are between 0-100
 */
export function useSafePerformanceMetrics(metrics: {
  conversionRate?: number | string;
  avgCheckoutTime?: number;
  abandonmentRate?: number | string;
  totalSessions?: number;
}) {
  return useMemo(() => {
    return {
      conversionRate: ensurePercentage(metrics.conversionRate),
      avgCheckoutTime: ensureNonNegative(metrics.avgCheckoutTime),
      abandonmentRate: ensurePercentage(metrics.abandonmentRate),
      totalSessions: ensureNonNegative(metrics.totalSessions),
    };
  }, [metrics]);
}

/**
 * Hook for normalizing revenue metrics
 * Preserves exact financial values while ensuring non-negative
 */
export function useSafeRevenueMetrics(metrics: {
  totalRevenue?: number | string;
  avgOrderValue?: number | string;
  totalOrders?: number | string;
  revenuePerHour?: number | string;
  revenueGrowth?: number | string;
}) {
  return useMemo(() => {
    return {
      totalRevenue: ensureNonNegative(
        typeof metrics.totalRevenue === 'string'
          ? parseFloat(metrics.totalRevenue)
          : metrics.totalRevenue || 0
      ),
      avgOrderValue: ensureNonNegative(
        typeof metrics.avgOrderValue === 'string'
          ? parseFloat(metrics.avgOrderValue)
          : metrics.avgOrderValue || 0
      ),
      totalOrders: ensureNonNegative(
        typeof metrics.totalOrders === 'string'
          ? parseFloat(metrics.totalOrders)
          : metrics.totalOrders || 0
      ),
      revenuePerHour: ensureNonNegative(
        typeof metrics.revenuePerHour === 'string'
          ? parseFloat(metrics.revenuePerHour)
          : metrics.revenuePerHour || 0
      ),
      revenueGrowth: safeParseNumber(metrics.revenueGrowth),
    };
  }, [metrics]);
}

/**
 * Hook for normalizing step metrics
 * Ensures times and percentages are within valid ranges
 */
export function useSafeStepMetrics<T extends { avgTime?: number; abandonment?: number }>(
  stepMetrics: T[]
): T[] {
  return useMemo(() => {
    return stepMetrics.map((step) => ({
      ...step,
      avgTime: ensureNonNegative(step.avgTime),
      abandonment: ensurePercentage(step.abandonment),
    }));
  }, [stepMetrics]);
}

