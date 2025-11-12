/**
 * Feature Routes Mapping
 * Maps dashboard routes to required features for access control
 */

import { Plan } from './plans';
import { hasFeature } from './plans';

/**
 * Map of dashboard routes to their required features
 * null means the route is always available (no feature required)
 */
export const FEATURE_ROUTE_MAP: Record<string, string | null> = {
  '/dashboard': 'bolt_core', // Overview - available to all plans
  '/dashboard/performance': 'bolt_core', // Performance - available to all plans
  '/dashboard/revenue': 'bolt_core', // Revenue - available to all plans
  '/dashboard/analytics': 'boltmetrics', // Analytics - Professional and Enterprise
  '/dashboard/dashboards': 'boltmetrics', // Dashboards - Professional and Enterprise
  '/dashboard/themes': 'boltflow_complete', // Themes - Professional and Enterprise
  '/dashboard/insights': 'boltmetrics', // Insights - Professional and Enterprise
  '/dashboard/security': 'boltguard', // Security - Professional and Enterprise (BoltGuard)
  '/dashboard/boltx': 'boltx', // BoltX - Enterprise only
  '/dashboard/plans': null, // Plans - always available
  '/dashboard/integrations': 'bolt_core', // Integrations - available to all plans
  '/dashboard/settings': null, // Settings - always available
};

/**
 * Get the required feature for a route
 * @param route - The route path to check
 * @returns The feature code required, or null if no feature is required, or undefined if route is unknown
 */
export function getRouteRequiredFeature(route: string): string | null | undefined {
  // Normalize route (remove trailing slash, ensure it starts with /dashboard)
  const normalizedRoute = route.replace(/\/$/, '') || '/dashboard';
  
  // Check exact match first
  if (FEATURE_ROUTE_MAP[normalizedRoute] !== undefined) {
    return FEATURE_ROUTE_MAP[normalizedRoute];
  }
  
  // Check for sub-routes (e.g., /dashboard/analytics/payment should use /dashboard/analytics)
  const routeParts = normalizedRoute.split('/');
  if (routeParts.length > 2) {
    const parentRoute = `/${routeParts.slice(0, 2).join('/')}`;
    if (FEATURE_ROUTE_MAP[parentRoute] !== undefined) {
      return FEATURE_ROUTE_MAP[parentRoute];
    }
  }
  
  // Unknown route - return undefined to deny access by default
  return undefined;
}

/**
 * Check if a plan can access a specific route
 * @param plan - The plan to check
 * @param route - The route path to check
 * @returns true if the plan has access to the route, false otherwise
 */
export function canAccessRoute(plan: Plan | null, route: string): boolean {
  const requiredFeature = getRouteRequiredFeature(route);
  
  // If route is unknown (undefined), deny access by default
  if (requiredFeature === undefined) {
    return false;
  }
  
  // If no feature is required (null), allow access
  if (requiredFeature === null) {
    return true;
  }
  
  // If no plan, deny access (feature is required but no plan available)
  if (!plan) {
    return false;
  }
  
  // Check if plan has the required feature
  return hasFeature(plan, requiredFeature);
}

