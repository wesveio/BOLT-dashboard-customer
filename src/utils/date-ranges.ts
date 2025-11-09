import type { PlanCode } from '@/utils/plans';

/**
 * Date range configuration
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Supported period types
 */
export type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

/**
 * Custom period configuration
 */
export interface CustomPeriod {
  startDate: Date;
  endDate: Date;
}

/**
 * Get maximum period days allowed for a plan
 * 
 * @param planCode - Plan code (starter, professional, enterprise)
 * @returns Maximum number of days allowed for custom period
 */
export function getMaxPeriodDays(planCode: PlanCode | null): number {
  switch (planCode) {
    case 'starter':
      return 7; // Basic: 7 days
    case 'professional':
      return 90; // Pro: 3 months (90 days)
    case 'enterprise':
      return 365; // Enterprise: 12 months (365 days)
    default:
      return 7; // Default to Basic limit if no plan
  }
}

/**
 * Validate if custom period range is within plan limits
 * 
 * @param startDate - Start date of custom period
 * @param endDate - End date of custom period
 * @param planCode - Plan code (starter, professional, enterprise)
 * @returns true if range is valid, false otherwise
 */
export function validateCustomPeriodRange(
  startDate: Date,
  endDate: Date,
  planCode: PlanCode | null
): boolean {
  if (startDate > endDate) {
    return false; // Start date must be before end date
  }

  const maxDays = getMaxPeriodDays(planCode);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= maxDays;
}

/**
 * Calculate date range for a given period
 * 
 * @param period - Period type (today, week, month, year, custom)
 * @param customStartDate - Optional start date for custom period
 * @param customEndDate - Optional end date for custom period
 * @returns DateRange with start and end dates
 */
export function getDateRange(
  period: Period | string,
  customStartDate?: Date | null,
  customEndDate?: Date | null
): DateRange {
  const now = new Date();
  const end = new Date();
  
  let start: Date;
  
  switch (period) {
    case 'today': {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'week': {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    }
    case 'month': {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
    }
    case 'year': {
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
    }
    case 'custom': {
      if (customStartDate && customEndDate) {
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        end.setTime(customEndDate.getTime());
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      // Fallback to week if custom dates not provided
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    }
    default: {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    }
  }

  return { start, end };
}

/**
 * Calculate previous period date range for comparison (growth calculations)
 * 
 * @param currentRange - Current date range
 * @returns DateRange for the previous period of the same duration
 */
export function getPreviousDateRange(currentRange: DateRange): DateRange {
  const duration = currentRange.end.getTime() - currentRange.start.getTime();
  
  return {
    start: new Date(currentRange.start.getTime() - duration),
    end: currentRange.start,
  };
}

/**
 * Parse period from URL search params or default to 'week'
 * 
 * @param period - Period string from search params
 * @returns Valid period type
 */
export function parsePeriod(period: string | null): Period {
  const validPeriods: Period[] = ['today', 'week', 'month', 'year', 'custom'];
  return (period && validPeriods.includes(period as Period)) 
    ? (period as Period) 
    : 'week';
}

