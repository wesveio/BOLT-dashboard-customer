'use client';

import { useMemo } from 'react';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { useWidgetData } from '@/hooks/useWidgetData';
import { usePeriod } from '@/contexts/PeriodContext';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/utils/formatters';
import type { DashboardWidget } from '../types';

interface MetricWidgetProps {
  widget: DashboardWidget;
  isEditing?: boolean;
}

const METRIC_FORMATTERS: Record<string, (value: any) => string> = {
  totalRevenue: (v) => formatCurrency(v),
  totalOrders: (v) => formatCompactNumber(v),
  conversionRate: (v) => formatPercentage(v),
  abandonmentRate: (v) => formatPercentage(v),
  totalSessions: (v) => formatCompactNumber(v),
  avgOrderValue: (v) => formatCurrency(v),
  totalConversions: (v) => formatCompactNumber(v),
};

export function MetricWidget({ widget }: MetricWidgetProps) {
  const { period, startDate, endDate } = usePeriod();
  const metricKey = widget.config.metric || 'totalRevenue';

  const { data, isLoading, error } = useWidgetData({
    widgetType: 'metric',
    config: {
      ...widget.config,
      dataSource: widget.config.dataSource || '/api/dashboard/metrics',
      metric: metricKey,
    },
    period,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const formattedValue = useMemo(() => {
    if (!data || !data.value) return '0';
    
    const formatter = METRIC_FORMATTERS[metricKey] || ((v) => String(v));
    return formatter(data.value);
  }, [data, metricKey]);

  const trend = useMemo(() => {
    if (!data || !data.trend) return undefined;
    
    const trendValue = typeof data.trend === 'number' 
      ? data.trend 
      : parseFloat(String(data.trend).replace('%', '')) || 0;
    
    return {
      value: Math.abs(trendValue),
      isPositive: trendValue >= 0,
    };
  }, [data]);

  if (error) {
    return (
      <div className="p-4 text-sm text-danger">
        Error loading metric: {error.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <MetricCard
      title={widget.config.title || data?.label || 'Metric'}
      value={formattedValue}
      trend={trend}
      isLoading={isLoading}
    />
  );
}

