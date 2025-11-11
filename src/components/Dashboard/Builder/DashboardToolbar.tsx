'use client';

import { Button, Input } from '@heroui/react';
import { PencilIcon, CheckIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { DashboardLayout } from './types';

interface DashboardToolbarProps {
  layout: DashboardLayout;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onUpdateName: (name: string) => void;
}

export function DashboardToolbar({
  layout,
  isEditing,
  onToggleEdit,
  onSave,
  onUpdateName,
}: DashboardToolbarProps) {
  return (
    <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        {isEditing ? (
          <Input
            value={layout.name}
            onChange={(e) => onUpdateName(e.target.value)}
            className="max-w-xs"
            size="sm"
            variant="bordered"
          />
        ) : (
          <h2 className="text-xl font-semibold">{layout.name}</h2>
        )}

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                color="primary"
                startContent={<CheckIcon className="w-4 h-4" />}
                onClick={onSave}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="light"
                startContent={<XMarkIcon className="w-4 h-4" />}
                onClick={onToggleEdit}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="light"
                startContent={<PencilIcon className="w-4 h-4" />}
                onClick={onToggleEdit}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="light"
                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
              >
                Export
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

