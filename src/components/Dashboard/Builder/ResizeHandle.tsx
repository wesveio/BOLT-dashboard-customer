'use client';

import { useState, useCallback } from 'react';
import type { DashboardWidget } from './types';

interface ResizeHandleProps {
  widget: DashboardWidget;
  onResize: (width: number, height: number) => void;
}

export function ResizeHandle({ widget, onResize }: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartSize({ width: widget.width, height: widget.height });
    },
    [widget],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      // Calculate new size (assuming 50px per grid cell)
      const cellSize = 50;
      const newWidth = Math.max(1, Math.min(12, startSize.width + Math.round(deltaX / cellSize)));
      const newHeight = Math.max(1, startSize.height + Math.round(deltaY / cellSize));

      onResize(newWidth, newHeight);
    },
    [isResizing, startPos, startSize, onResize],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global event listeners
  if (typeof window !== 'undefined') {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }

  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-tl-lg opacity-0 hover:opacity-100 transition-opacity"
      onMouseDown={handleMouseDown}
      style={{ zIndex: 10 }}
    />
  );
}

