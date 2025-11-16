'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { fadeIn, slideIn } from '@/utils/animations';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { usePlanAccessContext } from '@/contexts/PlanAccessContext';
import { useApi } from '@/hooks/useApi';
import { PricingCard } from '@/components/Dashboard/Plans/PricingCard';
import { SubscriptionHistory } from '@/components/Dashboard/Plans/SubscriptionHistory';
import { PlanComparison } from '@/components/Dashboard/Plans/PlanComparison';
import { PaymentForm } from '@/components/Dashboard/Plans/PaymentForm';
import { CancelSubscriptionModal } from '@/components/Dashboard/Plans/CancelSubscriptionModal';
import { ContactSalesModal } from '@/components/Dashboard/Plans/ContactSalesModal';
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
  const { isLoading: authLoading } = useDashboardAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const { isOpen: isContactOpen, onOpen: onContactOpen, onClose: onContactClose } = useDisclosure();
  
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
    // If Enterprise plan, open contact sales modal
    if (plan.code === 'enterprise') {
      onContactOpen();
      return;
    }

    setSelectedPlan(plan);
    // If plan has a price, show payment form first
    if (plan.monthly_price > 0) {
      onPaymentOpen();
    } else {
      // Free plan, go directly to confirmation
      onOpen();
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!selectedPlan) return;

    onPaymentClose();
    setIsUpdating(true);

    // Create subscription with payment intent
    try {
      const response = await fetch('/api/dashboard/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          payment_intent_id: paymentIntentId,
          currency: 'USD', // TODO: Get from user preference or plan
        }),
      });

      if (response.ok) {
        toast.success(t('toast.updateSuccess'));
        setSelectedPlan(null);
        // Refresh all data after subscription update
        await fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || t('toast.updateError'));
      }
    } catch (error) {
      console.error('❌ [DEBUG] Failed to create subscription:', error);
      toast.error(t('toast.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentCancel = () => {
    onPaymentClose();
    setSelectedPlan(null);
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;

    // If plan has a price, payment should have been processed already
    if (selectedPlan.monthly_price > 0) {
      toast.error('Please complete payment first');
      return;
    }

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
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-foreground/70">{t('subtitle')}</p>
      </div>

      {/* Current Plan Section */}
      {currentSubscription && (
        <m.div variants={slideIn} initial="hidden" animate="visible" className="mb-8">
          <Card className="border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 mb-8">
            <CardBody className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Current Plan</h2>
                  <p className="text-foreground/80">
                    You&apos;re currently on the <strong>{getPlanDisplayName(currentPlanCode as any)}</strong> plan.
                    {currentSubscription.started_at && (
                      <span className="text-sm text-foreground/70 ml-2">
                        Started {new Date(currentSubscription.started_at).toLocaleDateString()}
                      </span>
                    )}
                    {currentSubscription.ended_at && currentSubscription.status === 'active' && (
                      <span className="text-sm text-orange-600 dark:text-orange-400 ml-2 font-semibold">
                        (Access until {new Date(currentSubscription.ended_at).toLocaleDateString()})
                      </span>
                    )}
                  </p>
                </div>
                {currentSubscription.status === 'active' && (
                  <Button
                    color="danger"
                    variant="bordered"
                    onPress={onCancelOpen}
                    disabled={isUpdating}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </m.div>
      )}

      {/* Available Plans */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Available Plans</h2>
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
          <Card className="border border-default">
            <CardBody className="p-6">
              <div className="text-center py-8 text-foreground/60">No plans available.</div>
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
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('history')}</h2>
        <SubscriptionHistory subscriptions={subscriptions} transactions={transactions} isLoading={isLoading} />
      </div>

      {/* Payment Modal */}
      {selectedPlan && selectedPlan.monthly_price > 0 && (
        <Modal isOpen={isPaymentOpen} onClose={handlePaymentCancel} size="lg">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Payment Information
            </ModalHeader>
            <ModalBody>
              <div className="mb-4">
                <p className="text-foreground/70 mb-2">
                  Complete payment to subscribe to the <strong>{selectedPlan.name}</strong> plan.
                </p>
                <div className="bg-default-50 p-4 rounded-lg">
                  <p className="text-sm text-foreground/70 mb-2">Plan details:</p>
                  <ul className="space-y-1 text-sm text-foreground/80">
                    <li>• Monthly fee: ${selectedPlan.monthly_price.toFixed(2)}</li>
                    <li>• Transaction fee: {selectedPlan.transaction_fee_percent}%</li>
                    <li>• Features: {selectedPlan.features.length} included</li>
                  </ul>
                </div>
              </div>
              <PaymentForm
                planId={selectedPlan.id}
                amount={selectedPlan.monthly_price}
                currency="USD"
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                isLoading={isUpdating}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Cancel Subscription Modal */}
      {currentSubscription && (
        <CancelSubscriptionModal
          isOpen={isCancelOpen}
          onClose={onCancelClose}
          subscription={currentSubscription}
          onSuccess={fetchData}
        />
      )}

      {/* Contact Sales Modal */}
      <ContactSalesModal
        isOpen={isContactOpen}
        onClose={onContactClose}
      />

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
                <p className="text-foreground/70 mb-4">
                  {currentPlanCode && comparePlans(currentPlanCode as any, selectedPlan.code as any) === 'upgrade'
                    ? `You're about to upgrade to the ${selectedPlan.name} plan.`
                    : `You're about to change to the ${selectedPlan.name} plan.`}
                </p>
                <div className="bg-default-50 p-4 rounded-lg">
                  <p className="text-sm text-foreground/70 mb-2">New plan details:</p>
                  <ul className="space-y-1 text-sm text-foreground/80">
                    <li>• Monthly fee: ${selectedPlan.monthly_price}</li>
                    <li>• Transaction fee: {selectedPlan.transaction_fee_percent}%</li>
                    <li>• Features: {selectedPlan.features.length} included</li>
                  </ul>
                </div>
                <p className="text-xs text-foreground/60 mt-4">
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

