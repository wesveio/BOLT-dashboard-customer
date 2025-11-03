'use client';

import { Select, SelectItem, Button } from '@heroui/react';
import {
  CalendarIcon,
  TagIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Period } from '@/utils/default-data';

interface FilterBarProps {
  // Time period filter
  period: Period;
  onPeriodChange: (period: Period) => void;

  // Category filter
  category: string | null;
  categoryOptions: string[];
  onCategoryChange: (category: string | null) => void;

  // Event type filter
  eventType: string | null;
  eventTypeOptions: string[];
  onEventTypeChange: (eventType: string | null) => void;

  // Optional refresh button
  onRefresh?: () => void;

  // Optional disabled states
  isEventTypeDisabled?: boolean;

  // Optional className for custom styling
  className?: string;
}

export function FilterBar({
  period,
  onPeriodChange,
  category,
  categoryOptions,
  onCategoryChange,
  eventType,
  eventTypeOptions,
  onEventTypeChange,
  onRefresh,
  isEventTypeDisabled = false,
  className = '',
}: FilterBarProps) {
  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-wrap items-center gap-3 ${className}`}
    >
      {/* Time Period Filter */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <Select
          selectedKeys={[period]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as Period;
            if (selected) {
              onPeriodChange(selected);
            }
          }}
          size="sm"
          variant="bordered"
          label="Time Period"
          className="min-w-[150px]"
        >
          <SelectItem key="today">Today</SelectItem>
          <SelectItem key="week">Last 7 Days</SelectItem>
          <SelectItem key="month">Last 30 Days</SelectItem>
          <SelectItem key="year">Last Year</SelectItem>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <TagIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <Select
          selectedKeys={category ? [category] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string | null;
            if (selected === 'all') {
              onCategoryChange(null);
            } else {
              onCategoryChange(selected || null);
            }
          }}
          size="sm"
          variant="bordered"
          label="Category"
          placeholder="All Categories"
          className="min-w-[150px]"
        >
          <SelectItem key="all">All Categories</SelectItem>
          {(categoryOptions.map((cat) => (
            <SelectItem key={cat} textValue={cat}>
              {cat.replace('_', ' ').toUpperCase()}
            </SelectItem>
          )) as unknown as React.ReactElement)}
        </Select>
      </div>

      {/* Event Type Filter */}
      <div className="flex items-center gap-2">
        <FunnelIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <Select
          selectedKeys={eventType ? [eventType] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string | null;
            if (selected === 'all') {
              onEventTypeChange(null);
            } else {
              onEventTypeChange(selected || null);
            }
          }}
          size="sm"
          variant="bordered"
          label="Event Type"
          placeholder="All Event Types"
          className="min-w-[200px]"
          isDisabled={isEventTypeDisabled || eventTypeOptions.length === 0}
        >
          <SelectItem key="all">All Event Types</SelectItem>
          {(eventTypeOptions.slice(0, 20).map((type) => (
            <SelectItem key={type} textValue={type}>
              {type}
            </SelectItem>
          )) as unknown as React.ReactElement)}
        </Select>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <Button
          variant="bordered"
          color="primary"
          startContent={<ArrowPathIcon className="w-4 h-4" />}
          onPress={onRefresh}
          size="sm"
          className="ml-auto border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 font-semibold"
        >
          Refresh
        </Button>
      )}
    </div>
  );
}

