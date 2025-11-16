'use client';

import { useState, useCallback, useEffect } from 'react';
import { DashboardGrid } from './DashboardGrid';
import { WidgetPalette } from './WidgetPalette';
import { DashboardToolbar } from './DashboardToolbar';
import { WidgetConfigModal } from './WidgetConfigModal';
import type { DashboardWidget, DashboardLayout, WidgetConfig } from './types';

interface DashboardBuilderProps {
  initialLayout?: DashboardLayout;
  onSave?: (layout: DashboardLayout) => void;
  isSaving?: boolean;
}

export function DashboardBuilder({ initialLayout, onSave, isSaving = false }: DashboardBuilderProps) {
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || {
      id: `dashboard_${Date.now()}`,
      name: 'New Dashboard',
      widgets: [],
      columns: 12,
    },
  );
  const [isEditing, setIsEditing] = useState(false);
  const [configuringWidget, setConfiguringWidget] = useState<DashboardWidget | null>(null);

  // Update layout when initialLayout changes (e.g., when dashboard is loaded)
  useEffect(() => {
    if (initialLayout) {
      setLayout(initialLayout);
    }
  }, [initialLayout]);

  const handleAddWidget = useCallback((widgetType: string) => {
    console.log('✅ [DEBUG] handleAddWidget called with type:', widgetType);
    
    // Find the next available position to avoid overlapping
    const findNextPosition = (widgets: DashboardWidget[], width: number, height: number) => {
      const GRID_COLUMNS = 12;
      let x = 0;
      let y = 0;
      let found = false;

      // Try to find an empty spot
      while (!found && y < 20) { // Max 20 rows
        const hasCollision = widgets.some((w) => {
          const overlapsX = x < w.x + w.width && x + width > w.x;
          const overlapsY = y < w.y + w.height && y + height > w.y;
          return overlapsX && overlapsY;
        });

        if (!hasCollision && x + width <= GRID_COLUMNS) {
          found = true;
        } else {
          x += width;
          if (x + width > GRID_COLUMNS) {
            x = 0;
            y += height;
          }
        }
      }

      return { x, y };
    };

    const position = findNextPosition(layout.widgets, 4, 3);

    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: widgetType,
      x: position.x,
      y: position.y,
      width: 4,
      height: 3,
      config: {},
    };

    console.log('✅ [DEBUG] Adding widget at position:', position, newWidget);

    setLayout((prev) => {
      const newLayout = {
        ...prev,
        widgets: [...prev.widgets, newWidget],
      };
      console.log('✅ [DEBUG] New layout widgets count:', newLayout.widgets.length);
      return newLayout;
    });
  }, [layout.widgets]);

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

  const handleConfigureWidget = useCallback((widgetId: string) => {
    const widget = layout.widgets.find((w) => w.id === widgetId);
    if (widget) {
      setConfiguringWidget(widget);
    }
  }, [layout.widgets]);

  const handleSaveWidgetConfig = useCallback((config: WidgetConfig) => {
    if (!configuringWidget) return;

    setLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === configuringWidget.id ? { ...w, config } : w
      ),
    }));
    setConfiguringWidget(null);
  }, [configuringWidget]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(layout);
    }
  }, [layout, onSave]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashboardToolbar
        layout={layout}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onSave={handleSave}
        onUpdateName={(name) => setLayout((prev) => ({ ...prev, name }))}
        onUpdateVisibility={(isPublic) => setLayout((prev) => ({ ...prev, isPublic }))}
        isSaving={isSaving}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {isEditing && (
          <div className="w-64 border-r border-default overflow-y-auto flex-shrink-0">
            <WidgetPalette onAddWidget={handleAddWidget} />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6">
          <DashboardGrid
            layout={layout}
            isEditing={isEditing}
            onUpdateWidget={handleUpdateWidget}
            onRemoveWidget={handleRemoveWidget}
            onConfigureWidget={handleConfigureWidget}
          />
        </div>
      </div>

      <WidgetConfigModal
        widget={configuringWidget}
        isOpen={!!configuringWidget}
        onClose={() => setConfiguringWidget(null)}
        onSave={handleSaveWidgetConfig}
      />
    </div>
  );
}

