/**
 * Utility functions for generating breadcrumbs based on route paths
 */

export interface BreadcrumbItem {
  href: string;
  label: string;
  translationKey: string;
}

/**
 * Maps route paths to translation keys for breadcrumb labels
 */
const routeToTranslationKey: Record<string, string> = {
  '/dashboard': 'dashboard.overview.title',
  '/dashboard/performance': 'dashboard.performance.title',
  '/dashboard/revenue': 'dashboard.revenue.title',
  '/dashboard/analytics': 'dashboard.analytics.title',
  '/dashboard/analytics/payment': 'dashboard.analytics.payment.title',
  '/dashboard/analytics/shipping': 'dashboard.analytics.shipping.title',
  '/dashboard/analytics/coupons': 'dashboard.analytics.coupons.title',
  '/dashboard/analytics/micro-conversions': 'dashboard.analytics.microConversions.title',
  '/dashboard/analytics/geography': 'dashboard.analytics.geography.title',
  '/dashboard/analytics/ltv': 'dashboard.analytics.ltv.title',
  '/dashboard/analytics/cac': 'dashboard.analytics.cac.title',
  '/dashboard/analytics/retention': 'dashboard.analytics.retention.title',
  '/dashboard/analytics/abandonment-prediction': 'dashboard.analytics.abandonmentPrediction.title',
  '/dashboard/analytics/cohorts': 'dashboard.analytics.cohorts.title',
  '/dashboard/analytics/segments': 'dashboard.analytics.segments.title',
  '/dashboard/analytics/optimization-roi': 'dashboard.analytics.optimizationROI.title',
  '/dashboard/analytics/friction-score': 'dashboard.analytics.frictionScore.title',
  '/dashboard/analytics/revenue-forecast': 'dashboard.analytics.revenueForecast.title',
  '/dashboard/analytics/devices': 'dashboard.analytics.devices.title',
  '/dashboard/analytics/browsers': 'dashboard.analytics.browsers.title',
  '/dashboard/themes': 'dashboard.themes.title',
  '/dashboard/insights': 'dashboard.insights.title',
  '/dashboard/plans': 'dashboard.plans.title',
  '/dashboard/integrations': 'dashboard.integrations.title',
  '/dashboard/settings': 'dashboard.settings.title',
  '/dashboard/profile': 'dashboard.profile.title',
};

/**
 * Generates breadcrumb items based on the current pathname
 * @param pathname - The current pathname (e.g., '/dashboard/analytics/payment')
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Always start with Dashboard
  const breadcrumbs: BreadcrumbItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      translationKey: 'dashboard.overview.title',
    },
  ];

  // If we're at the root dashboard, return just that
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return breadcrumbs;
  }

  // Split the path into segments, excluding empty strings
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumbs for each segment beyond 'dashboard'
  let currentPath = '/dashboard';
  for (let i = 1; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    
    // Check if we have a translation key for this path
    const translationKey = routeToTranslationKey[currentPath];
    
    if (translationKey) {
      breadcrumbs.push({
        href: currentPath,
        label: segments[i], // Fallback label
        translationKey,
      });
    }
  }

  return breadcrumbs;
}

/**
 * Determines if breadcrumbs should be shown for a given pathname
 * Breadcrumbs are shown when there are 2+ levels (e.g., /dashboard/analytics/payment)
 * @param pathname - The current pathname
 * @returns Whether to show breadcrumbs
 */
export function shouldShowBreadcrumbs(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  // Show breadcrumbs if we have more than just 'dashboard'
  return segments.length > 1;
}

