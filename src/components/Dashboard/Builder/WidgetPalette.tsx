'use client';

import { Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  TableCellsIcon,
  FunnelIcon,
  MapIcon,
  ListBulletIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import type { WidgetType } from './types';

interface WidgetPaletteProps {
  onAddWidget: (widgetType: string) => void;
}

const widgetTypes: Array<{ type: WidgetType; name: string; icon: any; description: string }> = [
  {
    type: 'metric',
    name: 'Metric',
    icon: ChartBarIcon,
    description: 'Display a single metric value',
  },
  {
    type: 'chart',
    name: 'Chart',
    icon: ChartBarIcon,
    description: 'Line, bar, pie, or area chart',
  },
  {
    type: 'table',
    name: 'Table',
    icon: TableCellsIcon,
    description: 'Data table with sorting',
  },
  {
    type: 'funnel',
    name: 'Funnel',
    icon: FunnelIcon,
    description: 'Conversion funnel visualization',
  },
  {
    type: 'map',
    name: 'Map',
    icon: MapIcon,
    description: 'Geographic data visualization',
  },
  {
    type: 'list',
    name: 'List',
    icon: ListBulletIcon,
    description: 'Simple list view',
  },
  {
    type: 'text',
    name: 'Text',
    icon: DocumentTextIcon,
    description: 'Rich text content',
  },
  {
    type: 'image',
    name: 'Image',
    icon: PhotoIcon,
    description: 'Image widget',
  },
];

export function WidgetPalette({ onAddWidget }: WidgetPaletteProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Widgets</h3>
      <div className="space-y-2">
        {widgetTypes.map((widget) => (
          <motion.div
            key={widget.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="cursor-pointer border border-default hover:border-primary/20 hover:shadow-md transition-all duration-200"
              isPressable
              onPress={() => {
                console.log('✅ [DEBUG] Adding widget:', widget.type);
                onAddWidget(widget.type);
              }}
            >
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <widget.icon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground">{widget.name}</h4>
                    <p className="text-xs text-foreground/60 mt-1">{widget.description}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

