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
    }).format(clampedAmount);
  } catch {
    // Fallback formatting - preserve exact value
    return `${currency === 'USD' ? '$' : currency} ${clampedAmount.toFixed(maxFractionDigits)}`;
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
 */
export function formatPercentage(
  value: number | string,
  decimals: number = 1
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';

  return `${numValue.toFixed(decimals)}%`;
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

