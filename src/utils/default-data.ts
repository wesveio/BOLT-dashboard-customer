/**
 * Shared default/fallback data structures
 * Prevents duplication of default values across components
 */

/**
 * Default revenue metrics structure
 */
export const defaultRevenueMetrics = {
  totalRevenue: 0,
  avgOrderValue: '0.00',
  totalOrders: 0,
  revenuePerHour: '0.00',
  revenueGrowth: '0.0',
};

/**
 * Default revenue chart data (weekly)
 */
export const defaultRevenueChartData = [
  { date: 'Mon', revenue: 0 },
  { date: 'Tue', revenue: 0 },
  { date: 'Wed', revenue: 0 },
  { date: 'Thu', revenue: 0 },
  { date: 'Fri', revenue: 0 },
  { date: 'Sat', revenue: 0 },
  { date: 'Sun', revenue: 0 },
];

/**
 * Default performance metrics structure
 */
export const defaultPerformanceMetrics = {
  conversionRate: '0.0',
  avgCheckoutTime: 0,
  abandonmentRate: '0.0',
  totalSessions: 0,
};

/**
 * Default funnel data structure
 */
export const defaultFunnelData = [
  { step: 'cart', label: 'Cart', count: 1000, percentage: 100 },
  { step: 'profile', label: 'Profile', count: 850, percentage: 85 },
  { step: 'shipping', label: 'Shipping', count: 720, percentage: 72 },
  { step: 'payment', label: 'Payment', count: 650, percentage: 65 },
  { step: 'confirmed', label: 'Confirmed', count: 0, percentage: 0 },
];

/**
 * Default step metrics structure
 */
export const defaultStepMetrics = [
  { step: 'cart', label: 'Cart', avgTime: 0, abandonment: 0 },
  { step: 'profile', label: 'Profile', avgTime: 0, abandonment: 0 },
  { step: 'shipping', label: 'Shipping', avgTime: 0, abandonment: 0 },
  { step: 'payment', label: 'Payment', avgTime: 0, abandonment: 0 },
];

/**
 * Default analytics metrics structure
 */
export const defaultAnalyticsMetrics = {
  totalPayments: 0,
  avgSuccessRate: '0.0',
};

/**
 * Default overview metrics structure
 */
export const defaultOverviewMetrics = {
  totalRevenue: 0,
  totalOrders: 0,
  conversionRate: 0,
  totalSessions: 0,
};

/**
 * Period options for data filtering
 * Note: For translated labels, use getTranslatedPeriodOptions() helper
 */
export const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'year', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom Period' },
] as const;

export type Period = typeof periodOptions[number]['value'];

/**
 * Get translated period options
 * @param t - Translation function from useTranslations('dashboard.common.periods')
 */
export function getTranslatedPeriodOptions(t: (key: string) => string) {
  return periodOptions.map(option => ({
    ...option,
    label: t(option.value),
  }));
}

