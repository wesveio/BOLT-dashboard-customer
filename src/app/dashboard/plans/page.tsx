'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Spinner } from '@heroui/react';
import { fadeIn, slideIn } from '@/utils/animations';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { usePlanAccessContext } from '@/contexts/PlanAccessContext';
import { useApi } from '@/hooks/useApi';
import { PricingCard } from '@/components/Dashboard/Plans/PricingCard';
import { SubscriptionHistory } from '@/components/Dashboard/Plans/SubscriptionHistory';
import { PlanComparison } from '@/components/Dashboard/Plans/PlanComparison';
import { Plan, SubscriptionTransaction, comparePlans, getPlanDisplayName } from '@/utils/plans';
import { toast } from 'sonner';

interface PlansResponse {
  plans: Plan[];
}

interface TransactionsResponse {
  transactions: SubscriptionTransaction[];
}

export default function PlansPage() {
  const t = useTranslations('dashboard.plans');
  const { user, isLoading: authLoading } = useDashboardAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Use context for subscriptions (shared across app)
  const { subscriptions, subscription: currentSubscription, refetch: refetchSubscriptions } = usePlanAccessContext();
  
  // Use useApi for plans and transactions with caching
  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useApi<PlansResponse>(
    '/api/dashboard/plans',
    {
      cacheKey: 'dashboard-plans',
      cacheTTL: 30, // 30 minutes
      deduplicateRequests: true,
    }
  );
  
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useApi<TransactionsResponse>(
    '/api/dashboard/subscriptions/transactions',
    {
      cacheKey: 'dashboard-subscriptions-transactions',
      cacheTTL: 5, // 5 minutes
      deduplicateRequests: true,
    }
  );

  const plans = plansData?.plans || [];
  const transactions = transactionsData?.transactions || [];
  const isLoading = plansLoading || transactionsLoading || authLoading;
  
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    // Refetch all data when needed
    await Promise.all([
      refetchPlans(),
      refetchSubscriptions(),
      refetchTransactions(),
    ]);
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    onOpen();
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/dashboard/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
        }),
      });

      if (response.ok) {
        toast.success(t('toast.updateSuccess'));
        onClose();
        setSelectedPlan(null);
        // Refresh all data after subscription update
        await fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || t('toast.updateError'));
      }
    } catch (error) {
      console.error('❌ [DEBUG] Failed to update plan:', error);
      toast.error(t('toast.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const currentPlanId = currentSubscription?.plan_id;
  const currentPlanCode = currentSubscription?.plan?.code || '';

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Current Plan Section */}
      {currentSubscription && (
        <m.div variants={slideIn} initial="hidden" animate="visible" className="mb-8">
          <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 mb-8">
            <CardBody className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Current Plan</h2>
                  <p className="text-gray-700">
                    You&apos;re currently on the <strong>{getPlanDisplayName(currentPlanCode as any)}</strong> plan.
                    {currentSubscription.started_at && (
                      <span className="text-sm text-gray-600 ml-2">
                        Started {new Date(currentSubscription.started_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </m.div>
      )}

      {/* Available Plans */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  currentPlanId={currentPlanId}
                  isCurrentPlan={isCurrent}
                  onSelect={isCurrent ? undefined : handlePlanSelect}
                  isLoading={isUpdating}
                />
              );
            })}
          </div>
        ) : (
          <Card className="border border-gray-100">
            <CardBody className="p-6">
              <div className="text-center py-8 text-gray-500">No plans available.</div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Comparison Table */}
      {plans.length > 0 && (
        <div className="mb-12">
          <PlanComparison plans={plans} />
        </div>
      )}

      {/* Subscription History */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('history')}</h2>
        <SubscriptionHistory subscriptions={subscriptions} transactions={transactions} isLoading={isLoading} />
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {selectedPlan && (
              <>
                {comparePlans(currentPlanCode as any, selectedPlan.code as any) === 'upgrade'
                  ? 'Upgrade Plan'
                  : 'Change Plan'}
              </>
            )}
          </ModalHeader>
          <ModalBody>
            {selectedPlan && (
              <div>
                <p className="text-gray-600 mb-4">
                  {currentPlanCode && comparePlans(currentPlanCode as any, selectedPlan.code as any) === 'upgrade'
                    ? `You're about to upgrade to the ${selectedPlan.name} plan.`
                    : `You're about to change to the ${selectedPlan.name} plan.`}
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">New plan details:</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Monthly fee: ${selectedPlan.monthly_price}</li>
                    <li>• Transaction fee: {selectedPlan.transaction_fee_percent}%</li>
                    <li>• Features: {selectedPlan.features.length} included</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Note: This change will take effect immediately. Your billing cycle will be updated.
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleConfirmChange}
              isLoading={isUpdating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </m.div>
  );
}

