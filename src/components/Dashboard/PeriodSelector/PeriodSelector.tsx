'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Select, SelectItem } from '@heroui/react';
import { usePeriod } from '@/contexts/PeriodContext';
import { getTranslatedPeriodOptions, type Period } from '@/utils/default-data';

export interface PeriodSelectorProps {
  /**
   * Size of the select component
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Custom className
   */
  className?: string;
  /**
   * Custom width (default: w-40)
   */
  width?: string;
}

/**
 * Reusable period selector component
 * Integrates with PeriodContext for global period state management
 */
export const PeriodSelector = memo(function PeriodSelector({
  size = 'sm',
  className = '',
  width = 'w-40',
}: PeriodSelectorProps) {
  const t = useTranslations('dashboard.common.periods');
  const { period, setPeriod } = usePeriod();

  const periodOptions = getTranslatedPeriodOptions(t);

  return (
    <Select
      size={size}
      selectedKeys={[period]}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0] as Period;
        setPeriod(selected);
      }}
      className={`${width} ${className}`}
    >
      {periodOptions.map((option) => (
        <SelectItem key={option.value} textValue={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
});

