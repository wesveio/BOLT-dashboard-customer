/**
 * Types for Dashboard Builder
 */

export interface DashboardWidget {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, any>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  widgets: DashboardWidget[];
  columns: number;
  createdAt?: string;
  updatedAt?: string;
}

export type WidgetType =
  | 'metric'
  | 'chart'
  | 'table'
  | 'funnel'
  | 'map'
  | 'list'
  | 'text'
  | 'image';

export interface WidgetConfig {
  title?: string;
  metric?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  dataSource?: string;
  filters?: Record<string, any>;
}

