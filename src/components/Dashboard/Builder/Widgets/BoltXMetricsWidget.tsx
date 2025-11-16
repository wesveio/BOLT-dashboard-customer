'use client';

import { useMemo } from 'react';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { ChartWrapper } from '@/components/Dashboard/ChartWrapper/ChartWrapper';
import { useWidgetData } from '@/hooks/useWidgetData';
import { usePeriod } from '@/contexts/PeriodContext';
import { formatPercentage, formatCompactNumber } from '@/utils/formatters';
import type { DashboardWidget } from '../types';

interface BoltXMetricsWidgetProps {
  widget: DashboardWidget;
  isEditing?: boolean;
}

const BOLTX_ENDPOINTS: Record<string, string> = {
  interventions: '/api/boltx/interventions/metrics',
  personalization: '/api/boltx/personalization/metrics',
  optimization: '/api/boltx/optimization/metrics',
};

export function BoltXMetricsWidget({ widget }: BoltXMetricsWidgetProps) {
  const { period, startDate, endDate } = usePeriod();
  const boltXType = widget.config.boltxType || 'interventions';
  const displayType = widget.config.displayType || 'metric'; // 'metric' or 'chart'

  const endpoint = BOLTX_ENDPOINTS[boltXType] || BOLTX_ENDPOINTS.interventions;

  const { data, isLoading, error } = useWidgetData({
    widgetType: `boltx-${boltXType}`,
    config: {
      ...widget.config,
      dataSource: widget.config.dataSource || endpoint,
    },
    period,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  if (error) {
    return (
      <div className="p-4 text-sm text-danger">
        Error loading BoltX metrics: {error.message || 'Unknown error'}
      </div>
    );
  }

  if (displayType === 'chart') {
    // Render as chart
    const chartData = useMemo(() => {
      if (!data || !Array.isArray(data)) return [];
      
      // Transform data for chart
      if (data.length > 0 && typeof data[0] === 'object') {
        return data.map((item: any) => ({
          name: item.name || item.label || item.type,
          value: item.value || item.count || 0,
        }));
      }
      
      return [];
    }, [data]);

    return (
      <ChartCard title={widget.config.title || `BoltX ${boltXType} Metrics`}>
        <ChartWrapper
          data={chartData}
          type={widget.config.chartType || 'bar'}
          dataKey="value"
          xAxisKey="name"
          height={200}
          emptyMessage={`No ${boltXType} data available`}
          isLoading={isLoading}
        />
      </ChartCard>
    );
  }

  // Render as metric card
  const metricValue = useMemo(() => {
    if (!data) return '0';
    
    // Extract metric value based on boltXType
    if (boltXType === 'interventions' && data.metrics) {
      return formatPercentage(data.metrics.withInterventionRate || 0);
    }
    
    if (boltXType === 'personalization' && data.metrics) {
      return formatCompactNumber(data.metrics.totalProfiles || 0);
    }
    
    if (boltXType === 'optimization' && data.metrics) {
      return formatPercentage(data.metrics.improvementRate || 0);
    }
    
    // Fallback
    if (data.value !== undefined) {
      return String(data.value);
    }
    
    return '0';
  }, [data, boltXType]);

  return (
    <MetricCard
      title={widget.config.title || `BoltX ${boltXType}`}
      value={metricValue}
      isLoading={isLoading}
    />
  );
}

