'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { WidgetConfig } from '@/components/Dashboard/Builder/types';

export interface WidgetDataOptions {
  widgetType: string;
  config: WidgetConfig;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

/**
 * Generic hook for fetching widget data
 * Supports different widget types and data sources
 */
export function useWidgetData<T = any>(options: WidgetDataOptions) {
  const { widgetType, config, period, startDate, endDate, enabled = true } = options;

  // Build endpoint based on widget type and config
  const endpoint = useMemo(() => {
    const baseUrl = config.dataSource || getDefaultEndpoint(widgetType);
    
    if (!baseUrl) {
      return null;
    }

    // Build query parameters
    const params = new URLSearchParams();
    
    if (period) {
      params.append('period', period);
    }
    
    if (startDate && endDate) {
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());
    }

    // Add custom filters from config
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [widgetType, config, period, startDate, endDate]);

  // Use the generic useApi hook
  const { data, isLoading, error, refetch, clearCache } = useApi<T>(
    endpoint || '',
    {
      enabled: enabled && !!endpoint,
      cacheKey: `widget-${widgetType}-${config.dataSource || 'default'}-${period || 'all'}`,
      cacheTTL: 5, // 5 minutes
      refetchOnMount: true,
    }
  );

  // Transform data based on widget type and config
  const transformedData = useMemo(() => {
    if (!data) return null;

    return transformWidgetData(widgetType, config, data);
  }, [widgetType, config, data]);

  return {
    data: transformedData,
    rawData: data,
    isLoading,
    error,
    refetch,
    clearCache,
  };
}

/**
 * Get default endpoint for widget type
 */
function getDefaultEndpoint(widgetType: string): string | null {
  const endpointMap: Record<string, string> = {
    metric: '/api/dashboard/metrics',
    'revenue-chart': '/api/dashboard/revenue',
    funnel: '/api/dashboard/performance',
    'boltx-interventions': '/api/boltx/interventions/metrics',
    'boltx-personalization': '/api/boltx/personalization/metrics',
    'boltx-optimization': '/api/boltx/optimization/metrics',
    'analytics-table': '/api/dashboard/analytics/payment',
  };

  return endpointMap[widgetType] || null;
}

/**
 * Transform data based on widget type and config
 */
function transformWidgetData(
  widgetType: string,
  config: WidgetConfig,
  data: any
): any {
  switch (widgetType) {
    case 'metric':
      return transformMetricData(config, data);
    
    case 'revenue-chart':
      return transformRevenueChartData(config, data);
    
    case 'funnel':
      return transformFunnelData(config, data);
    
    case 'boltx-interventions':
    case 'boltx-personalization':
    case 'boltx-optimization':
      return transformBoltXData(config, data);
    
    case 'analytics-table':
      return transformAnalyticsTableData(config, data);
    
    default:
      return data;
  }
}

/**
 * Transform metric data
 */
function transformMetricData(config: WidgetConfig, data: any): any {
  const metricKey = config.metric || 'totalRevenue';
  
  // Handle different response structures
  if (data.metrics && data.metrics[metricKey] !== undefined) {
    return {
      value: data.metrics[metricKey],
      label: config.title || metricKey,
      trend: data.metrics[`${metricKey}Growth`] || null,
    };
  }

  if (data[metricKey] !== undefined) {
    return {
      value: data[metricKey],
      label: config.title || metricKey,
      trend: null,
    };
  }

  return {
    value: 0,
    label: config.title || 'Metric',
    trend: null,
  };
}

/**
 * Transform revenue chart data
 */
function transformRevenueChartData(_config: WidgetConfig, data: any): any {
  if (data.chartData && Array.isArray(data.chartData)) {
    return data.chartData.map((item: any) => ({
      name: item.date || item.name,
      value: item.revenue || item.value || 0,
    }));
  }

  return [];
}

/**
 * Transform funnel data
 */
function transformFunnelData(_config: WidgetConfig, data: any): any {
  if (data.funnel && Array.isArray(data.funnel)) {
    return data.funnel.map((item: any) => ({
      step: item.step || item.name,
      label: item.label || item.step,
      count: item.count || 0,
      percentage: item.percentage || 0,
    }));
  }

  return [];
}

/**
 * Transform BoltX data
 */
function transformBoltXData(_config: WidgetConfig, data: any): any {
  // BoltX endpoints return different structures
  // Return as-is for now, widgets will handle transformation
  return data;
}

/**
 * Transform analytics table data
 */
function transformAnalyticsTableData(config: WidgetConfig, data: any): any {
  // Extract table data based on config
  const tableKey = config.filters?.tableKey || 'paymentMethods';
  
  if (data[tableKey] && Array.isArray(data[tableKey])) {
    return data[tableKey];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

