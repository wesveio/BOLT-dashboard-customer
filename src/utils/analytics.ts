import type { AnalyticsEvent } from '@/hooks/useDashboardData';

/**
 * Extract revenue from event metadata with multiple fallbacks
 * Tries different field names and validates the value
 */
export function extractRevenue(event: AnalyticsEvent): number {
  const metadata = event.metadata || {};

  // Try different revenue field names
  const revenueValue =
    metadata.revenue ??
    metadata.value ??
    metadata.orderValue ??
    metadata.totalValue ??
    metadata.amount ??
    null;

  if (revenueValue === null || revenueValue === undefined) {
    return 0;
  }

  // Convert to number
  const numValue = typeof revenueValue === 'number'
    ? revenueValue
    : parseFloat(String(revenueValue));

  // Validate and return
  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }

  return numValue;
}
