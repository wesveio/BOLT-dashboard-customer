'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  onConfigureWidget?: (widgetId: string) => void;
}

const GRID_COLUMNS = 12;
const GRID_GAP = 16; // gap-4 = 16px

export function DashboardGrid({
  layout,
  isEditing,
  onUpdateWidget,
  onRemoveWidget,
  onConfigureWidget,
}: DashboardGridProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const cellSizeRef = useRef({ width: 0, height: 0 });

  // Calculate cell size based on actual grid dimensions
  useEffect(() => {
    if (!gridRef.current) return;

    const updateCellSize = () => {
      const grid = gridRef.current;
      if (!grid) return;

      const gridWidth = grid.offsetWidth;
      const cellWidth = (gridWidth - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
      // Estimate cell height (assuming square cells for now)
      const cellHeight = cellWidth;

      cellSizeRef.current = { width: cellWidth, height: cellHeight };
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  // Check for collisions
  const checkCollision = useCallback(
    (widgetId: string, newX: number, newY: number, width: number, height: number): boolean => {
      const widget = layout.widgets.find((w) => w.id === widgetId);
      if (!widget) return false;

      return layout.widgets.some((w) => {
        if (w.id === widgetId) return false;

        // Check if widgets overlap
        const overlapsX = newX < w.x + w.width && newX + width > w.x;
        const overlapsY = newY < w.y + w.height && newY + height > w.y;

        return overlapsX && overlapsY;
      });
    },
    [layout.widgets]
  );

  const handleDragStart = useCallback(
    (widgetId: string, e: React.MouseEvent) => {
      if (!isEditing) return;

      const widget = layout.widgets.find((w) => w.id === widgetId);
      if (!widget) return;

      // Don't start drag if clicking on buttons
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('svg') || target.closest('path')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      setDraggedWidget(widgetId);
      const rect = e.currentTarget.getBoundingClientRect();
      const gridRect = gridRef.current?.getBoundingClientRect();
      if (gridRect) {
        // Calculate offset from mouse to widget top-left corner
        const relativeX = e.clientX - rect.left;
        const relativeY = e.clientY - rect.top;
        
        setDragOffset({
          x: relativeX,
          y: relativeY,
        });
        setDragPosition({ x: widget.x, y: widget.y });
      }
    },
    [isEditing, layout.widgets],
  );

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!draggedWidget || !gridRef.current || !isEditing) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const mouseX = e.clientX - gridRect.left;
      const mouseY = e.clientY - gridRect.top;

      const { width: cellWidth, height: cellHeight } = cellSizeRef.current;

      if (cellWidth === 0 || cellHeight === 0) {
        // Fallback calculation if cell size not yet calculated
        const gridWidth = gridRect.width;
        const estimatedCellWidth = (gridWidth - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
        const estimatedCellHeight = estimatedCellWidth;

        const newX = Math.max(0, Math.min(
          GRID_COLUMNS - 1,
          Math.floor(mouseX / (estimatedCellWidth + GRID_GAP))
        ));
        const newY = Math.max(0, Math.floor(mouseY / (estimatedCellHeight + GRID_GAP)));

        const widget = layout.widgets.find((w) => w.id === draggedWidget);
        if (widget && !checkCollision(draggedWidget, newX, newY, widget.width, widget.height)) {
          setDragPosition({ x: newX, y: newY });
          onUpdateWidget(draggedWidget, { x: newX, y: newY });
        }
        return;
      }

      // Calculate grid position with snap-to-grid
      const widget = layout.widgets.find((w) => w.id === draggedWidget);
      if (!widget) return;

      // Use the mouse position directly and snap to nearest grid cell
      const cellSizeWithGap = cellWidth + GRID_GAP;
      const rowSizeWithGap = cellHeight + GRID_GAP;
      
      // Calculate which cell the mouse is over
      const newX = Math.max(0, Math.min(
        GRID_COLUMNS - widget.width,
        Math.floor(mouseX / cellSizeWithGap)
      ));
      const newY = Math.max(0, Math.floor(mouseY / rowSizeWithGap));

      // Check for collisions
      if (!checkCollision(draggedWidget, newX, newY, widget.width, widget.height)) {
        setDragPosition({ x: newX, y: newY });
        onUpdateWidget(draggedWidget, { x: newX, y: newY });
      }
    },
    [draggedWidget, dragOffset, onUpdateWidget, layout.widgets, checkCollision, isEditing],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
    setDragPosition({ x: 0, y: 0 });
  }, []);

  // Global mouse event handlers for drag
  useEffect(() => {
    if (!isEditing || !draggedWidget) return;

    const handleMouseMove = (e: MouseEvent) => handleDrag(e);
    const handleMouseUp = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEditing, draggedWidget, handleDrag, handleDragEnd]);

  return (
    <div
      ref={gridRef}
      className="relative min-h-full"
      style={{ userSelect: isEditing && draggedWidget ? 'none' : 'auto' }}
    >
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: '400px' }}>
        {layout.widgets.map((widget) => {
          const isDragging = draggedWidget === widget.id;
          const displayX = isDragging ? dragPosition.x : widget.x;
          const displayY = isDragging ? dragPosition.y : widget.y;

          return (
            <motion.div
              key={widget.id}
              className={`${isDragging ? 'z-50' : 'z-10'} ${!isEditing ? 'h-full' : ''}`}
              style={{
                gridColumn: `${displayX + 1} / span ${widget.width}`,
                gridRow: `${displayY + 1} / span ${widget.height}`,
              }}
              onMouseDown={isEditing ? (e) => {
                // Only start drag on left mouse button
                if (e.button === 0) {
                  handleDragStart(widget.id, e);
                }
              } : undefined}
              draggable={false}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: isDragging ? 0.8 : 1,
                scale: isDragging ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {isEditing ? (
                <Card className={`h-full border transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 shadow-xl ring-2 ring-blue-200 opacity-90'
                    : 'border-gray-100 hover:border-blue-200 hover:shadow-lg'
                } ${!isDragging ? 'cursor-move' : ''}`}>
                  <CardBody className="p-4 relative">
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      {onConfigureWidget && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfigureWidget(widget.id);
                          }}
                          className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="Configure widget"
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
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveWidget(widget.id);
                        }}
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

                    <WidgetRenderer widget={widget} isEditing={isEditing} />

                    {!isDragging && (
                      <ResizeHandle
                        widget={widget}
                        onResize={(width, height) =>
                          onUpdateWidget(widget.id, { width, height })
                        }
                      />
                    )}
                  </CardBody>
                </Card>
              ) : (
                // View mode: render widget without visible container borders
                <div className="h-full w-full">
                  <WidgetRenderer widget={widget} isEditing={isEditing} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {layout.widgets.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-400 col-span-12">
          <div className="text-center">
            <p className="text-lg mb-2">No widgets yet</p>
            <p className="text-sm">Add widgets from the palette to get started</p>
          </div>
        </div>
      )}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && layout.widgets.length > 0 && (
        <div className="col-span-12 text-xs text-gray-400 p-2">
          Debug: {layout.widgets.length} widget(s) in layout
        </div>
      )}
    </div>
  );
}

