'use client';

import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { ChartWrapper } from '@/components/Dashboard/ChartWrapper/ChartWrapper';
import { useWidgetData } from '@/hooks/useWidgetData';
import { usePeriod } from '@/contexts/PeriodContext';
import type { DashboardWidget } from '../types';

interface RevenueChartWidgetProps {
  widget: DashboardWidget;
  isEditing?: boolean;
}

export function RevenueChartWidget({ widget, isEditing = false }: RevenueChartWidgetProps) {
  const { period, startDate, endDate } = usePeriod();
  const chartType = widget.config.chartType || 'line';

  const { data, isLoading, error } = useWidgetData({
    widgetType: 'revenue-chart',
    config: {
      ...widget.config,
      dataSource: widget.config.dataSource || '/api/dashboard/revenue',
      chartType,
    },
    period,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Error loading chart: {error.message || 'Unknown error'}
      </div>
    );
  }

  const chartData = data || [];

  return (
    <ChartCard title={widget.config.title || 'Revenue Chart'}>
      <ChartWrapper
        data={chartData}
        type={chartType === 'doughnut' || chartType === 'pie' ? 'bar' : chartType}
        dataKey={chartData.length > 0 ? Object.keys(chartData[0]).find(key => key !== 'name') || 'value' : 'value'}
        xAxisKey="name"
        height={200}
        emptyMessage="No revenue data available"
        isLoading={isLoading}
      />
    </ChartCard>
  );
}

