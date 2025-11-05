/**
 * Hook to check user's plan access
 * 
 * Checks if user has Enterprise plan and active subscription
 */

import { useState, useEffect } from 'react';
import { PlanCode, Subscription, Plan, hasFeature } from '@/utils/plans';

export interface UsePlanAccessResult {
  hasEnterpriseAccess: boolean;
  isLoading: boolean;
  currentPlan: PlanCode | null;
  subscription: Subscription | null;
  plan: Plan | null;
}

/**
 * Hook to check if user has Enterprise plan access
 */
export function usePlanAccess(): UsePlanAccessResult {
  const [hasEnterpriseAccess, setHasEnterpriseAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanCode | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const checkPlanAccess = async () => {
      try {
        setIsLoading(true);

        // Fetch subscriptions
        const response = await fetch('/api/dashboard/subscriptions');
        if (!response.ok) {
          console.warn('⚠️ [DEBUG] Failed to fetch subscriptions:', response.statusText);
          setHasEnterpriseAccess(false);
          return;
        }

        const data = await response.json();
        const subscriptions: Subscription[] = data.subscriptions || [];

        // Find active subscription
        const activeSubscription = subscriptions.find(
          (sub) => sub.status === 'active'
        );

        if (!activeSubscription) {
          setHasEnterpriseAccess(false);
          setSubscription(null);
          setPlan(null);
          setCurrentPlan(null);
          return;
        }

        setSubscription(activeSubscription);

        // Check if plan is Enterprise
        if (activeSubscription.plan) {
          const userPlan = activeSubscription.plan;
          setPlan(userPlan);
          setCurrentPlan(userPlan.code);

          // Verify plan has 'boltx' feature
          const hasBoltXFeature = hasFeature(userPlan, 'boltx');
          const isEnterprise = userPlan.code === 'enterprise';

          setHasEnterpriseAccess(isEnterprise && hasBoltXFeature);
        } else {
          // Plan not loaded, try to fetch it
          const plansResponse = await fetch('/api/dashboard/plans');
          if (plansResponse.ok) {
            const plansData = await plansResponse.json();
            const plans: Plan[] = plansData.plans || [];
            const userPlan = plans.find((p) => p.id === activeSubscription.plan_id);

            if (userPlan) {
              setPlan(userPlan);
              setCurrentPlan(userPlan.code);

              const hasBoltXFeature = hasFeature(userPlan, 'boltx');
              const isEnterprise = userPlan.code === 'enterprise';

              setHasEnterpriseAccess(isEnterprise && hasBoltXFeature);
            } else {
              setHasEnterpriseAccess(false);
            }
          } else {
            setHasEnterpriseAccess(false);
          }
        }
      } catch (error) {
        console.error('❌ [DEBUG] Error checking plan access:', error);
        setHasEnterpriseAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPlanAccess();
  }, []);

  return {
    hasEnterpriseAccess,
    isLoading,
    currentPlan,
    subscription,
    plan,
  };
}

