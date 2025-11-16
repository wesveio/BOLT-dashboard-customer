'use client';

import { Button, Input, Switch } from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { PencilIcon, CheckIcon, XMarkIcon, ArrowDownTrayIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import type { DashboardLayout } from './types';

interface DashboardToolbarProps {
  layout: DashboardLayout;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onUpdateName: (name: string) => void;
  onUpdateVisibility?: (isPublic: boolean) => void;
  isSaving?: boolean;
}

export function DashboardToolbar({
  layout,
  isEditing,
  onToggleEdit,
  onSave,
  onUpdateName,
  onUpdateVisibility,
  isSaving = false,
}: DashboardToolbarProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="border-b border-default bg-background shadow-sm"
    >
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={layout.name}
              onChange={(e) => onUpdateName(e.target.value)}
              className="max-w-md"
              size="lg"
              variant="bordered"
              placeholder="Dashboard name"
              classNames={{
                input: 'text-lg font-bold',
              }}
            />
          ) : (
            <h1 className="text-2xl font-bold text-foreground truncate">{layout.name}</h1>
          )}

          {isEditing && onUpdateVisibility && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-default-50 border border-default-200">
              {layout.isPublic ? (
                <GlobeAltIcon className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <LockClosedIcon className="w-5 h-5 text-foreground/50 flex-shrink-0" />
              )}
              <Switch
                size="sm"
                isSelected={layout.isPublic || false}
                onValueChange={onUpdateVisibility}
                aria-label="Make dashboard public"
                classNames={{
                  base: 'max-w-fit',
                  wrapper: 'group-data-[selected=true]:bg-gradient-to-r group-data-[selected=true]:from-blue-600 group-data-[selected=true]:to-purple-600',
                }}
              >
                <span className="text-sm font-semibold text-foreground/80">
                  {layout.isPublic ? 'Public' : 'Private'}
                </span>
              </Switch>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isEditing ? (
            <>
              <Button
                size="lg"
                color="primary"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
                startContent={isSaving ? <Spinner size="sm" /> : <CheckIcon className="w-5 h-5" />}
                onPress={onSave}
                isLoading={isSaving}
                isDisabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="lg"
                variant="light"
                className="hover:bg-default-100 transition-colors font-semibold"
                startContent={<XMarkIcon className="w-5 h-5" />}
                onPress={onToggleEdit}
                isDisabled={isSaving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                variant="light"
                className="hover:bg-default-100 transition-colors font-semibold"
                startContent={<PencilIcon className="w-5 h-5" />}
                onPress={onToggleEdit}
              >
                Edit
              </Button>
              <Button
                size="lg"
                variant="light"
                className="hover:bg-default-100 transition-colors font-semibold"
                startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
              >
                Export
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

