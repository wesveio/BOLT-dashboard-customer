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
export type Period = 'today' | 'week' | 'month' | 'year';

/**
 * Calculate date range for a given period
 * 
 * @param period - Period type (today, week, month, year)
 * @returns DateRange with start and end dates
 */
export function getDateRange(period: Period | string): DateRange {
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
  const validPeriods: Period[] = ['today', 'week', 'month', 'year'];
  return (period && validPeriods.includes(period as Period)) 
    ? (period as Period) 
    : 'week';
}

