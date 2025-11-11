'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useApi } from '@/hooks/useApi';
import { PlanCode, Subscription, Plan, hasFeature as checkPlanFeature } from '@/utils/plans';
import { canAccessRoute as checkRouteAccess } from '@/utils/feature-routes';

interface SubscriptionsResponse {
  subscriptions: Subscription[];
}

interface PlansResponse {
  plans: Plan[];
}

interface PlanAccessContextValue {
  hasEnterpriseAccess: boolean;
  isLoading: boolean;
  currentPlan: PlanCode | null;
  subscription: Subscription | null;
  subscriptions: Subscription[];
  plan: Plan | null;
  isDemoMode: boolean;
  hasActiveSubscription: boolean;
  hasFeature: (featureCode: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  refetch: () => Promise<void>;
}

const PlanAccessContext = createContext<PlanAccessContextValue | undefined>(undefined);

interface PlanAccessProviderProps {
  children: ReactNode;
}

/**
 * Provider for plan access data
 * 
 * Fetches subscription and plan data once and shares it across all components
 * Uses caching and request deduplication to prevent multiple API calls
 */
export function PlanAccessProvider({ children }: PlanAccessProviderProps) {
  // Fetch subscriptions with cache and deduplication
  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    refetch: refetchSubscriptions,
  } = useApi<SubscriptionsResponse>('/api/dashboard/subscriptions', {
    cacheKey: 'dashboard-subscriptions',
    cacheTTL: 5, // 5 minutes
    deduplicateRequests: true,
    refetchOnMount: true,
  });

  // Fetch plans with cache and deduplication
  const {
    data: plansData,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = useApi<PlansResponse>('/api/dashboard/plans', {
    cacheKey: 'dashboard-plans',
    cacheTTL: 30, // 30 minutes (plans change less frequently)
    deduplicateRequests: true,
    refetchOnMount: true,
  });

  const isLoading = subscriptionsLoading || plansLoading;

  // Compute derived state
  const computedState = useMemo(() => {
    const subscriptions: Subscription[] = subscriptionsData?.subscriptions || [];
    const plans: Plan[] = plansData?.plans || [];

    // Find active subscription
    const activeSubscription = subscriptions.find(
      (sub) => sub.status === 'active'
    );

    const hasActive = !!activeSubscription;
    const isDemoMode = !hasActive;

    // Get plan details
    let plan: Plan | null = null;
    let currentPlan: PlanCode | null = null;

    if (activeSubscription) {
      // Try to get plan from subscription first
      if (activeSubscription.plan) {
        plan = activeSubscription.plan;
        currentPlan = plan.code;
      } else if (activeSubscription.plan_id) {
        // Fallback to plans array
        plan = plans.find((p) => p.id === activeSubscription.plan_id) || null;
        currentPlan = plan?.code || null;
      }
    }

    // Check enterprise access
    let hasEnterpriseAccess = false;
    if (plan) {
      const hasBoltXFeature = checkPlanFeature(plan, 'boltx');
      const isEnterprise = plan.code === 'enterprise';
      hasEnterpriseAccess = isEnterprise && hasBoltXFeature;
    }

    // Create feature check function
    const hasFeature = (featureCode: string) => {
      if (!plan) return false;
      return checkPlanFeature(plan, featureCode);
    };

    // Create route access check function
    const canAccessRoute = (route: string) => {
      return checkRouteAccess(plan, route);
    };

    return {
      hasEnterpriseAccess,
      currentPlan,
      subscription: activeSubscription || null,
      subscriptions,
      plan,
      isDemoMode,
      hasActiveSubscription: hasActive,
      hasFeature,
      canAccessRoute,
    };
  }, [subscriptionsData, plansData]);

  // Combined refetch function
  const refetch = async () => {
    await Promise.all([refetchSubscriptions(), refetchPlans()]);
  };

  const value: PlanAccessContextValue = {
    ...computedState,
    isLoading,
    refetch,
  };

  return (
    <PlanAccessContext.Provider value={value}>
      {children}
    </PlanAccessContext.Provider>
  );
}

/**
 * Hook to access plan access data from context
 * 
 * @throws Error if used outside PlanAccessProvider
 */
export function usePlanAccessContext(): PlanAccessContextValue {
  const context = useContext(PlanAccessContext);
  if (context === undefined) {
    throw new Error('usePlanAccessContext must be used within a PlanAccessProvider');
  }
  return context;
}

