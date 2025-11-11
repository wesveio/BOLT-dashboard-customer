'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DashboardWidget } from './types';

interface ResizeHandleProps {
  widget: DashboardWidget;
  onResize: (width: number, height: number) => void;
}

const GRID_COLUMNS = 12;
const GRID_GAP = 16; // gap-4 = 16px

export function ResizeHandle({ widget, onResize }: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const cellSizeRef = useRef({ width: 0, height: 0 });

  // Calculate cell size based on parent grid
  useEffect(() => {
    const updateCellSize = () => {
      const parent = document.querySelector('.grid.grid-cols-12');
      if (parent) {
        const gridWidth = parent.clientWidth;
        const cellWidth = (gridWidth - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
        const cellHeight = cellWidth; // Assuming square cells
        cellSizeRef.current = { width: cellWidth, height: cellHeight };
      }
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsResizing(true);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      startSizeRef.current = { width: widget.width, height: widget.height };
    },
    [widget.width, widget.height],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      const { width: cellWidth, height: cellHeight } = cellSizeRef.current;
      
      // Use actual cell size if available, otherwise fallback
      const effectiveCellWidth = cellWidth > 0 ? cellWidth : 50;
      const effectiveCellHeight = cellHeight > 0 ? cellHeight : 50;
      const cellSizeWithGap = effectiveCellWidth + GRID_GAP;
      const rowSizeWithGap = effectiveCellHeight + GRID_GAP;

      // Calculate new size based on mouse movement
      const deltaWidth = Math.round(deltaX / cellSizeWithGap);
      const deltaHeight = Math.round(deltaY / rowSizeWithGap);

      const newWidth = Math.max(1, Math.min(GRID_COLUMNS, startSizeRef.current.width + deltaWidth));
      const newHeight = Math.max(1, startSizeRef.current.height + deltaHeight);

      // Only update if size actually changed
      if (newWidth !== widget.width || newHeight !== widget.height) {
        onResize(newWidth, newHeight);
      }
    },
    [isResizing, widget.width, widget.height, onResize],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove global event listeners using useEffect
  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => handleMouseMove(e);
    const handleUp = () => handleMouseUp();

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-tl-lg opacity-0 hover:opacity-100 transition-opacity z-20"
      onMouseDown={handleMouseDown}
      style={{ 
        zIndex: 20,
        userSelect: 'none',
      }}
      title="Resize widget"
    />
  );
}

