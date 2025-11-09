'use client';

import { useState, useMemo } from 'react';
import { DateRangePicker } from '@heroui/react';
import { CalendarDate, parseDate, today, getLocalTimeZone } from '@internationalized/date';
import type { RangeValue } from '@react-types/shared';
import { usePeriod } from '@/contexts/PeriodContext';
import { validateCustomPeriodRange } from '@/utils/date-ranges';
import { usePlanAccess } from '@/hooks/usePlanAccess';

interface CustomPeriodSelectorProps {
  className?: string;
}

/**
 * Component for selecting custom date range with plan-based validation
 * Uses HeroUI DateRangePicker component
 */
export function CustomPeriodSelector({ className = '' }: CustomPeriodSelectorProps) {
  const { startDate, endDate, setCustomPeriod, maxPeriodDays } = usePeriod();
  const { currentPlan } = usePlanAccess();
  
  const [error, setError] = useState<string | null>(null);

  // Convert Date to CalendarDate for DateRangePicker
  const value = useMemo<RangeValue<CalendarDate> | null>(() => {
    if (startDate && endDate) {
      try {
        const start = parseDate(startDate.toISOString().split('T')[0]);
        const end = parseDate(endDate.toISOString().split('T')[0]);
        return { start, end };
      } catch {
        return null;
      }
    }
    return null;
  }, [startDate, endDate]);

  // Calculate min and max dates
  const todayDate = today(getLocalTimeZone());
  const minDate = useMemo(() => {
    const min = todayDate.subtract({ days: maxPeriodDays });
    return min;
  }, [todayDate, maxPeriodDays]);

  const handleChange = (range: RangeValue<CalendarDate> | null) => {
    setError(null);

    if (!range || !range.start || !range.end) {
      // Clear the period if range is cleared
      if (!range) {
        return;
      }
      // If only start or end is selected, wait for both
      return;
    }

    // Convert CalendarDate to Date
    const start = new Date(range.start.year, range.start.month - 1, range.start.day);
    const end = new Date(range.end.year, range.end.month - 1, range.end.day);

    // Validate range
    if (!validateCustomPeriodRange(start, end, currentPlan)) {
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setError(`Date range exceeds plan limit of ${maxPeriodDays} days (selected: ${diffDays} days)`);
      return;
    }

    // Range is valid, update context
    setCustomPeriod(start, end);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <DateRangePicker
        label="Custom Period"
        value={value}
        onChange={handleChange}
        minValue={minDate}
        maxValue={todayDate}
        size="sm"
        variant="bordered"
        isInvalid={!!error}
        errorMessage={error || undefined}
        classNames={{
          base: 'w-full',
          input: 'text-sm',
          label: 'text-sm font-semibold',
        }}
        description={`Maximum range: ${maxPeriodDays} days (based on your plan)`}
      />
    </div>
  );
}

