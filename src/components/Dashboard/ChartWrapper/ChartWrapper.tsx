'use client';

import { memo, ReactNode, ReactElement } from 'react';
import { ResponsiveContainer, LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  defaultCartesianGrid,
  createXAxisProps,
  createYAxisProps,
  createTooltipProps,
  createLineProps,
  createBarProps,
  formatCurrencyTick,
  formatCurrencyTooltip,
} from '@/utils/chart-config';

export interface ChartWrapperProps {
  /**
   * Chart data
   */
  data: any[];
  /**
   * Chart type: 'line' or 'bar'
   */
  type: 'line' | 'bar';
  /**
   * Data key for the main value
   */
  dataKey: string;
  /**
   * X-axis data key (default: 'date')
   */
  xAxisKey?: string;
  /**
   * Chart height (default: 300)
   */
  height?: number;
  /**
   * Custom tooltip formatter
   */
  tooltipFormatter?: (value: any, name?: string) => [string, string];
  /**
   * Custom Y-axis tick formatter
   */
  yAxisTickFormatter?: (value: number) => string;
  /**
   * Custom X-axis props
   */
  xAxisProps?: Record<string, any>;
  /**
   * Custom Y-axis props
   */
  yAxisProps?: Record<string, any>;
  /**
   * Custom line/bar props
   */
  lineProps?: Record<string, any>;
  /**
   * Custom bar props (only for bar charts)
   */
  barProps?: Record<string, any>;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Loading message
   */
  loadingMessage?: string;
  /**
   * Children (custom chart content)
   */
  children?: ReactNode;
}

/**
 * Wrapper component for Recharts with default configurations
 * Provides consistent chart styling across the dashboard
 */
export const ChartWrapper = memo(function ChartWrapper({
  data,
  type,
  dataKey,
  xAxisKey = 'date',
  height = 300,
  tooltipFormatter,
  yAxisTickFormatter,
  xAxisProps,
  yAxisProps,
  lineProps,
  barProps,
  isLoading = false,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  children,
}: ChartWrapperProps) {
  // If children are provided, render them directly (for custom charts)
  if (children) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        {children as ReactElement}
      </ResponsiveContainer>
    );
  }

  // Default chart rendering
  if (isLoading) {
    return (
      <div className="text-center py-8 text-foreground/60">
        {loadingMessage}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/60">
        {emptyMessage}
      </div>
    );
  }

  const ChartComponent = type === 'line' ? LineChart : BarChart;

  const defaultXAxis = createXAxisProps({
    dataKey: xAxisKey,
    ...xAxisProps,
  });

  const defaultYAxis = createYAxisProps({
    tickFormatter: yAxisTickFormatter || formatCurrencyTick,
    ...yAxisProps,
  });

  const defaultTooltip = createTooltipProps({
    formatter: tooltipFormatter || formatCurrencyTooltip,
  });

  const defaultLine = createLineProps({
    dataKey,
    ...lineProps,
  });

  const defaultBar = createBarProps({
    dataKey,
    ...barProps,
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data}>
        <CartesianGrid {...defaultCartesianGrid} />
        <XAxis {...defaultXAxis} />
        <YAxis {...defaultYAxis} />
        <Tooltip {...defaultTooltip} />
        {type === 'line' ? (
          <Line {...defaultLine} />
        ) : (
          <Bar {...defaultBar} />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
});

