'use client';

import { useState, useMemo } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from '@heroui/react';
import { usePeriod } from '@/contexts/PeriodContext';
import type { DashboardWidget, WidgetConfig } from './types';

interface WidgetConfigModalProps {
  widget: DashboardWidget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfig) => void;
}

const METRIC_OPTIONS = [
  { value: 'totalRevenue', label: 'Total Revenue' },
  { value: 'totalOrders', label: 'Total Orders' },
  { value: 'conversionRate', label: 'Conversion Rate' },
  { value: 'abandonmentRate', label: 'Abandonment Rate' },
  { value: 'totalSessions', label: 'Total Sessions' },
  { value: 'avgOrderValue', label: 'Average Order Value' },
  { value: 'totalConversions', label: 'Total Conversions' },
];

const DATA_SOURCE_OPTIONS = [
  { value: '/api/dashboard/metrics', label: 'General Metrics' },
  { value: '/api/dashboard/revenue', label: 'Revenue Data' },
  { value: '/api/dashboard/performance', label: 'Performance Data' },
  { value: '/api/boltx/interventions/metrics', label: 'BoltX Interventions' },
  { value: '/api/boltx/personalization/metrics', label: 'BoltX Personalization' },
  { value: '/api/boltx/optimization/metrics', label: 'BoltX Optimization' },
  { value: '/api/dashboard/analytics/payment', label: 'Payment Analytics' },
  { value: '/api/dashboard/analytics/shipping', label: 'Shipping Analytics' },
  { value: '/api/dashboard/analytics/devices', label: 'Devices Analytics' },
];

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Line Chart' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
];

export function WidgetConfigModal({ widget, isOpen, onClose, onSave }: WidgetConfigModalProps) {
  const { period } = usePeriod();
  const [config, setConfig] = useState<WidgetConfig>(() => widget?.config || {});

  // Update config when widget changes
  useMemo(() => {
    if (widget) {
      setConfig(widget.config || {});
    }
  }, [widget]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleCancel = () => {
    if (widget) {
      setConfig(widget.config || {});
    }
    onClose();
  };

  if (!widget) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-bold">Configure Widget</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Title */}
            <Input
              label="Widget Title"
              value={config.title || ''}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Enter widget title"
              variant="bordered"
            />

            {/* Data Source */}
            {(widget.type === 'metric' || widget.type === 'chart' || widget.type === 'table') && (
              <Select
                label="Data Source"
                selectedKeys={config.dataSource ? [config.dataSource] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setConfig({ ...config, dataSource: selected });
                }}
                variant="bordered"
              >
                {DATA_SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} textValue={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            )}

            {/* Metric Selection (for metric widgets) */}
            {widget.type === 'metric' && (
              <Select
                label="Metric"
                selectedKeys={config.metric ? [config.metric] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setConfig({ ...config, metric: selected });
                }}
                variant="bordered"
              >
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem key={option.value} textValue={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            )}

            {/* Chart Type (for chart widgets) */}
            {(widget.type === 'chart' || widget.type === 'revenue-chart') && (
              <Select
                label="Chart Type"
                selectedKeys={config.chartType ? [config.chartType] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setConfig({ ...config, chartType: selected as any });
                }}
                variant="bordered"
              >
                {CHART_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} textValue={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            )}

            {/* Period Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Period:</span> {period}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Widget will use the current dashboard period setting
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleCancel}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSave}>
            Save Configuration
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

