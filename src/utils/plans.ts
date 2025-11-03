/**
 * Plans utilities and constants
 * Helper functions for pricing, plan management, and calculations
 */

export type PlanCode = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded';
export type BillingCycle = 'monthly' | 'yearly';

export interface Plan {
  id: string;
  name: string;
  code: PlanCode;
  monthly_price: number;
  transaction_fee_percent: number;
  features: string[];
  is_active: boolean;
  display_order: number;
}

export interface Subscription {
  id: string;
  account_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  ended_at: string | null;
  billing_cycle: BillingCycle;
  plan?: Plan;
}

export interface SubscriptionTransaction {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  transaction_date: string;
  status: TransactionStatus;
  transaction_type: 'subscription' | 'upgrade' | 'downgrade' | 'refund';
  metadata?: Record<string, any>;
}

/**
 * Feature definitions for each Bolt product
 */
export const BOLT_FEATURES = {
  bolt_core: {
    code: 'bolt_core',
    name: 'Bolt Core',
    description: 'Checkout engine and headless flow',
  },
  boltflow_basic: {
    code: 'boltflow_basic',
    name: 'BoltFlow Basic',
    description: 'React components and APIs for custom UIs (basic)',
  },
  boltflow_complete: {
    code: 'boltflow_complete',
    name: 'BoltFlow Complete',
    description: 'React components and APIs for custom UIs (complete)',
  },
  boltguard: {
    code: 'boltguard',
    name: 'BoltGuard',
    description: 'Monitors, validates, and protects transactions',
  },
  boltmetrics: {
    code: 'boltmetrics',
    name: 'BoltMetrics',
    description: 'Real-time analytics and A/B performance dashboard',
  },
  boltx: {
    code: 'boltx',
    name: 'BoltX',
    description: 'AI-powered optimizations and predictive UX flows',
  },
  priority_support: {
    code: 'priority_support',
    name: 'Priority Support',
    description: 'Dedicated support with faster response times',
  },
} as const;

/**
 * Plan definitions with features
 */
export const PLAN_DEFINITIONS: Record<PlanCode, { features: string[]; description: string }> = {
  starter: {
    features: ['bolt_core', 'boltflow_basic'],
    description: 'Perfect for small stores getting started',
  },
  professional: {
    features: ['bolt_core', 'boltflow_complete', 'boltguard', 'boltmetrics'],
    description: 'For growing businesses that need advanced features',
  },
  enterprise: {
    features: ['bolt_core', 'boltflow_complete', 'boltguard', 'boltmetrics', 'boltx', 'priority_support'],
    description: 'Custom solutions for large enterprises',
  },
};

/**
 * Format currency amount based on currency code
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format percentage (e.g., 1.00 -> "1%", 0.50 -> "0.5%")
 */
export function formatPercentage(value: number): string {
  // Remove trailing zeros and format
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(2);
  return `${formatted}%`;
}

/**
 * Calculate total monthly cost (monthly fee + estimated transaction fees)
 */
export function calculateMonthlyCost(
  monthlyPrice: number,
  _transactionFeePercent: number,
  _estimatedMonthlyTransactions: number = 0
): number {
  // This is a simplified calculation
  // In reality, transaction fees would be calculated per transaction
  return monthlyPrice;
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(code: PlanCode): string {
  const names: Record<PlanCode, string> = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return names[code] || code;
}

/**
 * Check if a plan upgrade is valid
 */
export function canUpgrade(currentPlan: PlanCode, targetPlan: PlanCode): boolean {
  const planOrder: PlanCode[] = ['starter', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  return targetIndex > currentIndex;
}

/**
 * Check if a plan downgrade is valid
 */
export function canDowngrade(currentPlan: PlanCode, targetPlan: PlanCode): boolean {
  const planOrder: PlanCode[] = ['starter', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  return targetIndex < currentIndex;
}

/**
 * Get plan features list as readable names
 */
export function getPlanFeatures(featureCodes: string[]): Array<{ code: string; name: string; description: string }> {
  return featureCodes
    .map((code) => {
      const feature = BOLT_FEATURES[code as keyof typeof BOLT_FEATURES];
      return feature ? { code: feature.code, name: feature.name, description: feature.description } : null;
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);
}

/**
 * Check if plan has a specific feature
 */
export function hasFeature(plan: Plan, featureCode: string): boolean {
  return plan.features.includes(featureCode);
}

/**
 * Compare two plans and determine the relationship
 */
export function comparePlans(plan1: PlanCode, plan2: PlanCode): 'same' | 'upgrade' | 'downgrade' {
  if (plan1 === plan2) return 'same';
  return canUpgrade(plan1, plan2) ? 'upgrade' : 'downgrade';
}

