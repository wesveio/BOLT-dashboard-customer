/**
 * Data validation and normalization utilities
 * Provides consistent data validation and normalization across the dashboard
 * Ensures values are non-negative and within expected ranges
 */

/**
 * Ensures a value is non-negative (clamps to 0 if negative)
 */
export function ensureNonNegative(value: number | string | null | undefined): number {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (value === null || value === undefined || isNaN(numValue)) {
    return 0;
  }
  
  return Math.max(0, numValue);
}

/**
 * Clamps a value between min and max
 */
export function clampValue(
  value: number | string | null | undefined,
  min: number = 0,
  max: number = Infinity
): number {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (value === null || value === undefined || isNaN(numValue)) {
    return min;
  }
  
  return Math.max(min, Math.min(max, numValue));
}

/**
 * Safely parses a number from string or number
 * Returns 0 if parsing fails
 */
export function safeParseNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Normalizes metrics object ensuring all numeric values are non-negative
 */
export function normalizeMetrics<T extends Record<string, any>>(
  metrics: T,
  options?: {
    allowNegative?: boolean;
    min?: number;
    max?: number;
  }
): T {
  const normalized = { ...metrics };
  const allowNegative = options?.allowNegative ?? false;
  const min = options?.min ?? 0;
  const max = options?.max ?? Infinity;
  
  for (const key in normalized) {
    const value = normalized[key];
    
    // Only process numeric values
    if (typeof value === 'number' || typeof value === 'string') {
      if (allowNegative) {
        normalized[key] = clampValue(value, min, max);
      } else {
        normalized[key] = ensureNonNegative(value);
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Recursively normalize nested objects
      normalized[key] = normalizeMetrics(value, options);
    }
  }
  
  return normalized;
}

/**
 * Normalizes an array of data objects ensuring numeric values are non-negative
 */
export function normalizeDataArray<T extends Record<string, any>>(
  data: T[],
  options?: {
    allowNegative?: boolean;
    min?: number;
    max?: number;
  }
): T[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  return data.map((item) => normalizeMetrics(item, options));
}

/**
 * Ensures percentage values are between 0 and 100
 */
export function ensurePercentage(value: number | string | null | undefined): number {
  return clampValue(value, 0, 100);
}

/**
 * Normalizes chart data ensuring all numeric values are non-negative
 */
export function normalizeChartData<T extends Record<string, any>>(
  chartData: T[],
  numericKeys?: string[]
): T[] {
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return [];
  }
  
  return chartData.map((item) => {
    const normalized = { ...item };
    
    // If numericKeys is provided, only normalize those keys
    // Otherwise, normalize all numeric values
    if (numericKeys && numericKeys.length > 0) {
      numericKeys.forEach((key) => {
        if (key in normalized) {
          normalized[key] = ensureNonNegative(normalized[key]);
        }
      });
    } else {
      // Normalize all numeric values
      for (const key in normalized) {
        const value = normalized[key];
        if (typeof value === 'number' || typeof value === 'string') {
          normalized[key] = ensureNonNegative(value);
        }
      }
    }
    
    return normalized;
  });
}

