/**
 * Chart configuration utilities
 * Provides default configurations for Recharts components
 * Ensures consistent styling across all charts in the dashboard
 */

import { formatCurrency } from './formatters';

/**
 * Default CartesianGrid configuration
 */
export const defaultCartesianGrid = {
  strokeDasharray: '3 3',
  stroke: '#e5e7eb',
};

/**
 * Default XAxis configuration
 */
export const defaultXAxisConfig = {
  stroke: '#6b7280',
  style: { fontSize: '12px' },
};

/**
 * Default YAxis configuration
 */
export const defaultYAxisConfig = {
  stroke: '#6b7280',
  style: { fontSize: '12px' },
};

/**
 * Default Tooltip content style
 */
export const defaultTooltipContentStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
};

/**
 * Default Line configuration
 */
export const defaultLineConfig = {
  type: 'monotone' as const,
  strokeWidth: 3,
  dot: { fill: '#2563eb', r: 4 },
  activeDot: { r: 6 },
};

/**
 * Default Bar configuration
 */
export const defaultBarConfig = {
  fill: '#2563eb',
  radius: [8, 8, 0, 0] as [number, number, number, number],
};

/**
 * Format currency for Y-axis ticks
 */
export function formatCurrencyTick(value: number): string {
  return `$${value / 1000}k`;
}

/**
 * Format currency for tooltip
 */
export function formatCurrencyTooltip(value: number, name?: string): [string, string] {
  return [formatCurrency(value), name || ''];
}

/**
 * Create default XAxis props
 */
export function createXAxisProps(options?: {
  dataKey?: string;
  angle?: number;
  textAnchor?: 'end' | 'inherit' | 'start' | 'middle';
  height?: number;
  tickFormatter?: (value: any) => string;
}) {
  return {
    dataKey: options?.dataKey || 'date',
    stroke: defaultXAxisConfig.stroke,
    style: defaultXAxisConfig.style,
    ...(options?.angle !== undefined && { angle: options.angle }),
    ...(options?.textAnchor && { textAnchor: options.textAnchor }),
    ...(options?.height && { height: options.height }),
    ...(options?.tickFormatter && { tickFormatter: options.tickFormatter }),
  };
}

/**
 * Create default YAxis props
 */
export function createYAxisProps(options?: {
  tickFormatter?: (value: number) => string;
  label?: {
    value: string;
    angle: number;
    position: 'insideLeft' | 'insideRight';
    fill: string;
  };
  orientation?: 'left' | 'right';
  yAxisId?: string | number;
}) {
  return {
    stroke: defaultYAxisConfig.stroke,
    style: defaultYAxisConfig.style,
    ...(options?.tickFormatter && { tickFormatter: options.tickFormatter }),
    ...(options?.label && { label: options.label }),
    ...(options?.orientation && { orientation: options.orientation }),
    ...(options?.yAxisId !== undefined && { yAxisId: options.yAxisId }),
  };
}

/**
 * Create default Tooltip props
 */
export function createTooltipProps(options?: {
  formatter?: (value: any, name?: string) => [string, string];
  contentStyle?: Record<string, any>;
}) {
  return {
    contentStyle: options?.contentStyle || defaultTooltipContentStyle,
    ...(options?.formatter && { formatter: options.formatter }),
  };
}

/**
 * Create default Line props
 */
export function createLineProps(options: {
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  dot?: { fill: string; r: number };
  activeDot?: { r: number };
  yAxisId?: string | number;
  connectNulls?: boolean;
}) {
  return {
    type: defaultLineConfig.type,
    dataKey: options.dataKey,
    stroke: options.stroke || '#2563eb',
    strokeWidth: options.strokeWidth || defaultLineConfig.strokeWidth,
    dot: options.dot || defaultLineConfig.dot,
    activeDot: options.activeDot || defaultLineConfig.activeDot,
    ...(options.yAxisId !== undefined && { yAxisId: options.yAxisId }),
    ...(options.connectNulls !== undefined && { connectNulls: options.connectNulls }),
  };
}

/**
 * Create default Bar props
 */
export function createBarProps(options: {
  dataKey: string;
  fill?: string;
  radius?: [number, number, number, number];
}) {
  return {
    dataKey: options.dataKey,
    fill: options.fill || defaultBarConfig.fill,
    radius: options.radius || defaultBarConfig.radius,
  };
}

