'use client';

import { MetricCard } from '../MetricCard/MetricCard';
import { ChartCard } from '../ChartCard/ChartCard';
import type { DashboardWidget } from './types';

interface WidgetRendererProps {
  widget: DashboardWidget;
  isEditing: boolean;
}

export function WidgetRenderer({ widget, isEditing }: WidgetRendererProps) {
  switch (widget.type) {
    case 'metric':
      return (
        <MetricCard
          title={widget.config.title || 'Metric'}
          value={widget.config.value || '0'}
          icon={widget.config.icon}
          trend={widget.config.trend}
        />
      );

    case 'chart':
      return (
        <ChartCard
          title={widget.config.title || 'Chart'}
          chartType={widget.config.chartType || 'line'}
          data={widget.config.data || { labels: [], datasets: [] }}
          height={200}
        />
      );

    case 'table':
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">{widget.config.title || 'Table'}</h3>
          <p className="text-sm text-gray-500">Table widget - configuration coming soon</p>
        </div>
      );

    case 'funnel':
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">{widget.config.title || 'Funnel'}</h3>
          <p className="text-sm text-gray-500">Funnel widget - configuration coming soon</p>
        </div>
      );

    case 'map':
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">{widget.config.title || 'Map'}</h3>
          <p className="text-sm text-gray-500">Map widget - configuration coming soon</p>
        </div>
      );

    case 'list':
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">{widget.config.title || 'List'}</h3>
          <p className="text-sm text-gray-500">List widget - configuration coming soon</p>
        </div>
      );

    case 'text':
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">{widget.config.title || 'Text'}</h3>
          <div
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: widget.config.content || '' }}
          />
        </div>
      );

    case 'image':
      return (
        <div>
          <img
            src={widget.config.src || ''}
            alt={widget.config.alt || ''}
            className="w-full h-auto rounded"
          />
        </div>
      );

    default:
      return (
        <div>
          <p className="text-sm text-gray-500">Unknown widget type: {widget.type}</p>
        </div>
      );
  }
}

