'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';
import { WidgetRenderer } from './WidgetRenderer';
import { ResizeHandle } from './ResizeHandle';
import type { DashboardLayout, DashboardWidget } from './types';

interface DashboardGridProps {
  layout: DashboardLayout;
  isEditing: boolean;
  onUpdateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export function DashboardGrid({
  layout,
  isEditing,
  onUpdateWidget,
  onRemoveWidget,
}: DashboardGridProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (widgetId: string, e: React.MouseEvent) => {
      if (!isEditing) return;

      const widget = layout.widgets.find((w) => w.id === widgetId);
      if (!widget) return;

      setDraggedWidget(widgetId);
      const rect = e.currentTarget.getBoundingClientRect();
      const gridRect = gridRef.current?.getBoundingClientRect();
      if (gridRect) {
        setDragOffset({
          x: e.clientX - rect.left - gridRect.left,
          y: e.clientY - rect.top - gridRect.top,
        });
      }
    },
    [isEditing, layout.widgets],
  );

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedWidget || !gridRef.current) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - gridRect.left - dragOffset.x;
      const y = e.clientY - gridRect.top - dragOffset.y;

      // Calculate grid position (assuming 12 columns, 50px per cell)
      const cellSize = 50;
      const newX = Math.max(0, Math.floor(x / cellSize));
      const newY = Math.max(0, Math.floor(y / cellSize));

      onUpdateWidget(draggedWidget, { x: newX, y: newY });
    },
    [draggedWidget, dragOffset, onUpdateWidget],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
  }, []);

  return (
    <div
      ref={gridRef}
      className="relative min-h-full"
      onMouseMove={isEditing ? handleDrag : undefined}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div className="grid grid-cols-12 gap-4">
        {layout.widgets.map((widget) => (
          <motion.div
            key={widget.id}
            className={`col-span-${widget.width} row-span-${widget.height} ${
              isEditing ? 'cursor-move' : ''
            }`}
            style={{
              gridColumn: `span ${widget.width}`,
              gridRow: `span ${widget.height}`,
            }}
            onMouseDown={isEditing ? (e) => handleDragStart(widget.id, e) : undefined}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
              <CardBody className="p-4 relative">
                {isEditing && (
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                      onClick={() => onRemoveWidget(widget.id)}
                      className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Remove widget"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                <WidgetRenderer widget={widget} isEditing={isEditing} />

                {isEditing && (
                  <ResizeHandle
                    widget={widget}
                    onResize={(width, height) =>
                      onUpdateWidget(widget.id, { width, height })
                    }
                  />
                )}
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {layout.widgets.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No widgets yet</p>
            <p className="text-sm">Add widgets from the palette to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

