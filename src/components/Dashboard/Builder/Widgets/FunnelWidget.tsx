'use client';

import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { FunnelChart } from '@/components/Dashboard/FunnelChart/FunnelChart';
import { useWidgetData } from '@/hooks/useWidgetData';
import { usePeriod } from '@/contexts/PeriodContext';
import type { DashboardWidget } from '../types';

interface FunnelWidgetProps {
  widget: DashboardWidget;
  isEditing?: boolean;
}

export function FunnelWidget({ widget }: FunnelWidgetProps) {
  const { period, startDate, endDate } = usePeriod();

  const { data, isLoading, error } = useWidgetData({
    widgetType: 'funnel',
    config: {
      ...widget.config,
      dataSource: widget.config.dataSource || '/api/dashboard/performance',
    },
    period,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Error loading funnel: {error.message || 'Unknown error'}
      </div>
    );
  }

  const funnelData = data || [];

  return (
    <ChartCard title={widget.config.title || 'Conversion Funnel'}>
      <FunnelChart
        data={funnelData}
        isLoading={isLoading}
      />
    </ChartCard>
  );
}

