/**
 * Hook for processing and formatting chart data
 * Ensures chart data values are non-negative and properly formatted
 */

import { useMemo } from 'react';
import { normalizeChartData, ensureNonNegative } from '@/utils/data-validation';

export interface UseChartDataOptions {
  /**
   * Keys to normalize (if not provided, all numeric keys are normalized)
   */
  numericKeys?: string[];
  /**
   * Whether to allow negative values (default: false)
   */
  allowNegative?: boolean;
}

/**
 * Hook that normalizes chart data ensuring all numeric values are non-negative
 */
export function useChartData<T extends Record<string, any>>(
  chartData: T[] | null | undefined,
  options?: UseChartDataOptions
): T[] {
  return useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return [];
    }

    return normalizeChartData(chartData, options?.numericKeys);
  }, [chartData, options?.numericKeys]);
}

/**
 * Hook for normalizing revenue chart data
 * Ensures revenue values are non-negative
 */
export function useRevenueChartData(
  chartData: Array<{ date: string; revenue?: number }> | null | undefined
) {
  return useChartData(chartData, { numericKeys: ['revenue'] });
}

/**
 * Hook for normalizing revenue by hour data
 * Returns empty array with all 24 hours at 0 if no data
 */
export function useRevenueByHourData(
  revenueByHour: Array<{ hour: string; revenue?: number }> | null | undefined
) {
  return useMemo(() => {
    if (!revenueByHour || revenueByHour.length === 0) {
      // Return empty array with all 24 hours at 0
      return Array.from({ length: 24 }, (_, i) => ({
        hour: i.toString().padStart(2, '0') + ':00',
        revenue: 0,
      }));
    }

    return normalizeChartData(revenueByHour, ['revenue']);
  }, [revenueByHour]);
}

/**
 * Hook for normalizing revenue by day data
 */
export function useRevenueByDayData(
  revenueByDay: Array<{ day: string; revenue?: number }> | null | undefined
) {
  return useChartData(revenueByDay, { numericKeys: ['revenue'] });
}

/**
 * Hook for normalizing any time series chart data
 */
export function useTimeSeriesChartData<T extends Record<string, any>>(
  chartData: T[] | null | undefined,
  valueKey: string
): T[] {
  return useChartData(chartData, { numericKeys: [valueKey] });
}

