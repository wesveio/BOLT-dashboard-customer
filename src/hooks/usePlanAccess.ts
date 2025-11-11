/**
 * Hook to check user's plan access
 * 
 * Checks if user has Enterprise plan and active subscription
 * Provides feature-based access control for dashboard routes
 * 
 * Uses PlanAccessContext to share data across components and prevent duplicate API calls
 */

import { usePlanAccessContext } from '@/contexts/PlanAccessContext';
import { PlanCode, Subscription, Plan } from '@/utils/plans';

export interface UsePlanAccessResult {
  hasEnterpriseAccess: boolean;
  isLoading: boolean;
  currentPlan: PlanCode | null;
  subscription: Subscription | null;
  plan: Plan | null;
  isDemoMode: boolean;
  hasActiveSubscription: boolean;
  hasFeature: (featureCode: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

/**
 * Hook to check if user has Enterprise plan access
 * 
 * This hook now uses the PlanAccessContext to share subscription data
 * across all components, preventing duplicate API calls.
 */
export function usePlanAccess(): UsePlanAccessResult {
  const context = usePlanAccessContext();
  
  return {
    hasEnterpriseAccess: context.hasEnterpriseAccess,
    isLoading: context.isLoading,
    currentPlan: context.currentPlan,
    subscription: context.subscription,
    plan: context.plan,
    isDemoMode: context.isDemoMode,
    hasActiveSubscription: context.hasActiveSubscription,
    hasFeature: context.hasFeature,
    canAccessRoute: context.canAccessRoute,
  };
}

