/**
 * Shared formatting utilities for dates, currency, and numbers
 * Provides consistent formatting across the dashboard
 */

export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full';
export type LocaleCode = 'en' | 'pt-BR' | 'es';

/**
 * Get user's preferred locale (defaults to pt-BR)
 */
function getLocale(): LocaleCode {
  if (typeof window === 'undefined') return 'pt-BR';

  const browserLocale = navigator.language.split('-')[0];

  // Check if browser locale matches supported locale
  if (browserLocale === 'en' || browserLocale === 'pt' || browserLocale === 'es') {
    if (browserLocale === 'pt') return 'pt-BR';
    return browserLocale as LocaleCode;
  }

  return 'pt-BR';
}

/**
 * Format date with consistent locale handling
 */
export function formatDate(
  dateString: string | null | undefined,
  style: DateFormatStyle = 'medium',
  locale?: LocaleCode
): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    const selectedLocale = locale || getLocale();

    const optionsMap: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      medium: { year: 'numeric', month: 'long', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
      full: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      },
    };
    const options = optionsMap[style];

    return date.toLocaleDateString(selectedLocale, options);
  } catch {
    return 'N/A';
  }
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return formatDate(dateString, 'short');
    }
  } catch {
    return 'N/A';
  }
}

/**
 * Format currency with locale handling
 * Ensures negative values are clamped to 0
 * Automatically detects if value is in cents (integer) or dollars (with decimals)
 * - If value has decimals (e.g., 88.49), treats as dollars
 * - If value is integer (e.g., 8849), treats as cents and divides by 100
 * Preserves exact values - formatting is only for display purposes
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'USD',
  locale?: LocaleCode,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '$0.00';

  // Clamp negative values to 0
  const clampedAmount = Math.max(0, numAmount);

  // Detect if value is in cents (integer) or dollars (has decimals)
  // If the value has a decimal part, assume it's already in dollars
  // Otherwise, assume it's in cents and divide by 100
  const hasDecimals = clampedAmount % 1 !== 0;
  const currencyAmount = hasDecimals ? clampedAmount : clampedAmount / 100;

  const selectedLocale = locale || getLocale();

  // Use provided options or default to 2 decimal places for currency
  const minFractionDigits = options?.minimumFractionDigits ?? 2;
  const maxFractionDigits = options?.maximumFractionDigits ?? 2;

  try {
    return new Intl.NumberFormat(selectedLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    }).format(currencyAmount);
  } catch {
    // Fallback formatting - preserve exact value
    return `${currency === 'USD' ? '$' : currency} ${currencyAmount.toFixed(maxFractionDigits)}`;
  }
}

/**
 * Format number with locale-specific separators
 * Ensures negative values are clamped to 0
 */
export function formatNumber(
  value: number | string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: LocaleCode;
    allowNegative?: boolean;
  }
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '0';

  // Clamp negative values to 0 unless explicitly allowed
  const clampedValue = options?.allowNegative ? numValue : Math.max(0, numValue);

  const selectedLocale = options?.locale || getLocale();
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options || {};

  try {
    return new Intl.NumberFormat(selectedLocale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(clampedValue);
  } catch {
    return clampedValue.toFixed(maximumFractionDigits);
  }
}

/**
 * Format percentage
 * Removes trailing zeros when decimal part is zero (e.g., 100.00% -> 100%)
 */
export function formatPercentage(
  value: number | string,
  decimals: number = 2
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '0%';

  // Format with specified decimals, then remove trailing zeros
  const formatted = numValue.toFixed(decimals);
  // Remove trailing zeros and decimal point if not needed
  const cleaned = parseFloat(formatted).toString();
  
  return `${cleaned}%`;
}

/**
 * Format file size (bytes to human-readable)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration (seconds to human-readable)
 * Ensures negative values are clamped to 0
 */
export function formatDuration(seconds: number): string {
  // Clamp negative values to 0
  const clampedSeconds = Math.max(0, seconds);

  if (clampedSeconds < 60) {
    return `${Math.round(clampedSeconds)}s`;
  } else if (clampedSeconds < 3600) {
    const minutes = Math.floor(clampedSeconds / 60);
    const remainingSeconds = Math.round(clampedSeconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(clampedSeconds / 3600);
    const minutes = Math.floor((clampedSeconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Get user display name from user object
 */
export function getUserDisplayName(user: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  if (user?.name) return user.name;
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user?.email || 'User';
}

/**
 * Format number in compact notation (e.g., 1.2M for 1,200,000)
 * Supports K (thousands), M (millions), B (billions)
 * Maintains precision with 1-2 decimal places
 */
export function formatCompactNumber(
  value: number | string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    threshold?: number; // Minimum value to apply compact formatting (default: 1000)
    locale?: LocaleCode;
    allowNegative?: boolean;
  }
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '0';

  // Clamp negative values to 0 unless explicitly allowed
  const clampedValue = options?.allowNegative ? numValue : Math.max(0, numValue);
  const threshold = options?.threshold ?? 1000;

  // If value is below threshold, use regular formatting
  if (Math.abs(clampedValue) < threshold) {
    return formatNumber(clampedValue, {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      locale: options?.locale,
      allowNegative: options?.allowNegative,
    });
  }

  const absValue = Math.abs(clampedValue);
  const sign = clampedValue < 0 ? '-' : '';
  const selectedLocale = options?.locale || getLocale();

  // Determine the appropriate unit and divisor
  let unit: string;
  let divisor: number;
  let decimals: number;

  if (absValue >= 1_000_000_000) {
    // Billions
    unit = 'B';
    divisor = 1_000_000_000;
    decimals = options?.maximumFractionDigits ?? 2;
  } else if (absValue >= 1_000_000) {
    // Millions
    unit = 'M';
    divisor = 1_000_000;
    decimals = options?.maximumFractionDigits ?? 2;
  } else if (absValue >= 1_000) {
    // Thousands
    unit = 'K';
    divisor = 1_000;
    decimals = options?.maximumFractionDigits ?? 1;
  } else {
    // Below threshold, should not reach here, but fallback
    return formatNumber(clampedValue, {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      locale: options?.locale,
      allowNegative: options?.allowNegative,
    });
  }

  const compactValue = absValue / divisor;
  const minFractionDigits = options?.minimumFractionDigits ?? 0;
  const maxFractionDigits = decimals;

  try {
    const formatted = new Intl.NumberFormat(selectedLocale, {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    }).format(compactValue);

    return `${sign}${formatted}${unit}`;
  } catch {
    return `${sign}${compactValue.toFixed(maxFractionDigits)}${unit}`;
  }
}

/**
 * Format currency in compact notation (e.g., $1.2M for $1,200,000.00)
 * Similar to formatCompactNumber but preserves currency symbol and formatting
 */
export function formatCompactCurrency(
  amount: number | string,
  currency: string = 'USD',
  locale?: LocaleCode,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    threshold?: number; // Minimum value to apply compact formatting (default: 1000)
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return formatCurrency(0, currency, locale, options);
  }

  // Clamp negative values to 0
  const clampedAmount = Math.max(0, numAmount);
  const threshold = options?.threshold ?? 1000;

  // Detect if value is in cents (integer) or dollars (has decimals)
  const hasDecimals = clampedAmount % 1 !== 0;
  const currencyAmount = hasDecimals ? clampedAmount : clampedAmount / 100;

  // If value is below threshold, use regular currency formatting
  if (currencyAmount < threshold) {
    return formatCurrency(currencyAmount, currency, locale, options);
  }

  const selectedLocale = locale || getLocale();

  // Determine the appropriate unit and divisor
  let unit: string;
  let divisor: number;
  let decimals: number;

  if (currencyAmount >= 1_000_000_000) {
    // Billions
    unit = 'B';
    divisor = 1_000_000_000;
    decimals = options?.maximumFractionDigits ?? 2;
  } else if (currencyAmount >= 1_000_000) {
    // Millions
    unit = 'M';
    divisor = 1_000_000;
    decimals = options?.maximumFractionDigits ?? 2;
  } else if (currencyAmount >= 1_000) {
    // Thousands
    unit = 'K';
    divisor = 1_000;
    decimals = options?.maximumFractionDigits ?? 1;
  } else {
    // Below threshold, should not reach here, but fallback
    return formatCurrency(currencyAmount, currency, locale, options);
  }

  const compactValue = currencyAmount / divisor;
  const minFractionDigits = options?.minimumFractionDigits ?? 0;
  const maxFractionDigits = decimals;

  try {
    // Format the compact value
    const formatted = new Intl.NumberFormat(selectedLocale, {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    }).format(compactValue);

    // Get currency symbol
    const currencySymbol = new Intl.NumberFormat(selectedLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(0)
      .replace(/\d/g, '')
      .trim();

    return `${currencySymbol}${formatted}${unit}`;
  } catch {
    // Fallback formatting
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${compactValue.toFixed(maxFractionDigits)}${unit}`;
  }
}

