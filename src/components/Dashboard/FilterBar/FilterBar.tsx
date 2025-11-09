'use client';

import { useTranslations } from 'next-intl';
import { Select, SelectItem, Button } from '@heroui/react';
import {
  CalendarIcon,
  TagIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { getTranslatedPeriodOptions, Period } from '@/utils/default-data';
import { CustomPeriodSelector } from '@/components/Dashboard/CustomPeriodSelector/CustomPeriodSelector';

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
  const t = useTranslations('dashboard.common.filterBar');
  const tPeriods = useTranslations('dashboard.common.periods');
  
  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 ${className}`}
    >
      {/* Time Period Filter */}
      <div className="flex flex-col gap-3 w-full md:w-auto md:flex-shrink-0">
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
          label={t('timePeriod')}
          className="flex-1 md:min-w-[150px]"
        >
          {getTranslatedPeriodOptions(tPeriods).map((option) => (
            <SelectItem key={option.value} textValue={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
        </div>
        {period === 'custom' && (
          <CustomPeriodSelector className="md:ml-7" />
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 w-full md:w-auto md:flex-shrink-0">
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
          label={t('category')}
          placeholder={t('allCategories')}
          className="flex-1 md:min-w-[150px]"
        >
          <SelectItem key="all">{t('allCategories')}</SelectItem>
          {(categoryOptions.map((cat) => (
            <SelectItem key={cat} textValue={cat}>
              {cat.replace('_', ' ').toUpperCase()}
            </SelectItem>
          )) as unknown as React.ReactElement)}
        </Select>
      </div>

      {/* Event Type Filter */}
      <div className="flex items-center gap-2 w-full md:w-auto md:flex-shrink-0">
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
          label={t('eventType')}
          placeholder={t('allEventTypes')}
          className="flex-1 md:min-w-[200px]"
          isDisabled={isEventTypeDisabled || eventTypeOptions.length === 0}
        >
          <SelectItem key="all">{t('allEventTypes')}</SelectItem>
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
          className="w-full md:w-auto md:ml-auto border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 font-semibold"
        >
          {t('refresh')}
        </Button>
      )}
    </div>
  );
}

