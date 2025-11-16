'use client';

import { useMemo } from 'react';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { useWidgetData } from '@/hooks/useWidgetData';
import { usePeriod } from '@/contexts/PeriodContext';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import type { DashboardWidget } from '../types';

interface AnalyticsTableWidgetProps {
  widget: DashboardWidget;
  isEditing?: boolean;
}

const ANALYTICS_ENDPOINTS: Record<string, string> = {
  payment: '/api/dashboard/analytics/payment',
  shipping: '/api/dashboard/analytics/shipping',
  devices: '/api/dashboard/analytics/devices',
  browsers: '/api/dashboard/analytics/browsers',
};

export function AnalyticsTableWidget({ widget }: AnalyticsTableWidgetProps) {
  const { period, startDate, endDate } = usePeriod();
  const tableType = widget.config.tableType || 'payment';
  const endpoint = ANALYTICS_ENDPOINTS[tableType] || ANALYTICS_ENDPOINTS.payment;

  const { data, isLoading, error } = useWidgetData({
    widgetType: 'analytics-table',
    config: {
      ...widget.config,
      dataSource: widget.config.dataSource || endpoint,
      filters: {
        ...widget.config.filters,
        tableKey: widget.config.filters?.tableKey || `${tableType}Methods`,
      },
    },
    period,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  if (error) {
    return (
      <div className="p-4 text-sm text-danger">
        Error loading table data: {error.message || 'Unknown error'}
      </div>
    );
  }

  const tableData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.slice(0, widget.config.maxRows || 10);
  }, [data, widget.config.maxRows]);

  const columns = useMemo(() => {
    if (tableData.length === 0) return [];
    
    const firstRow = tableData[0];
    return Object.keys(firstRow).filter(key => key !== 'id');
  }, [tableData]);

  const formatCellValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-';
    
    // Format based on column name
    if (column.toLowerCase().includes('revenue') || column.toLowerCase().includes('value')) {
      return formatCurrency(value);
    }
    
    if (column.toLowerCase().includes('rate') || column.toLowerCase().includes('percentage')) {
      return formatPercentage(value);
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  if (isLoading) {
    return (
      <Card className="border border-default">
        <CardBody className="p-6">
          <div className="space-y-4">
            <div className="h-6 bg-default-200 rounded animate-pulse w-1/3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-default-200 rounded animate-pulse" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (tableData.length === 0) {
    return (
      <Card className="border border-default">
        <CardBody className="p-6">
          <div className="text-center py-8 text-foreground/60">
            No {tableType} data available
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
      <CardBody className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {widget.config.title || `${tableType.charAt(0).toUpperCase() + tableType.slice(1)} Analytics`}
        </h3>
        <Table aria-label={`${tableType} analytics table`}>
          <TableHeader>
            {columns.map((column) => (
              <TableColumn key={column}>
                {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {tableData.map((row: any, index: number) => (
              <TableRow key={row.id || index}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {formatCellValue(row[column], column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}

