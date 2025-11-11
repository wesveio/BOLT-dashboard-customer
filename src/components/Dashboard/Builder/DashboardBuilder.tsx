'use client';

import { useState, useCallback } from 'react';
import { DashboardGrid } from './DashboardGrid';
import { WidgetPalette } from './WidgetPalette';
import { DashboardToolbar } from './DashboardToolbar';
import type { DashboardWidget, DashboardLayout } from './types';

interface DashboardBuilderProps {
  initialLayout?: DashboardLayout;
  onSave?: (layout: DashboardLayout) => void;
}

export function DashboardBuilder({ initialLayout, onSave }: DashboardBuilderProps) {
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || {
      id: `dashboard_${Date.now()}`,
      name: 'New Dashboard',
      widgets: [],
      columns: 12,
    },
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleAddWidget = useCallback((widgetType: string) => {
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: widgetType,
      x: 0,
      y: 0,
      width: 4,
      height: 3,
      config: {},
    };

    setLayout((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
  }, []);

  const handleUpdateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)),
    }));
  }, []);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== widgetId),
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(layout);
    }
  }, [layout, onSave]);

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar
        layout={layout}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onSave={handleSave}
        onUpdateName={(name) => setLayout((prev) => ({ ...prev, name }))}
      />

      <div className="flex flex-1 overflow-hidden">
        {isEditing && (
          <div className="w-64 border-r border-gray-200 overflow-y-auto">
            <WidgetPalette onAddWidget={handleAddWidget} />
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <DashboardGrid
            layout={layout}
            isEditing={isEditing}
            onUpdateWidget={handleUpdateWidget}
            onRemoveWidget={handleRemoveWidget}
          />
        </div>
      </div>
    </div>
  );
}

