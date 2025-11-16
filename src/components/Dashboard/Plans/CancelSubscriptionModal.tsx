'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
} from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { Subscription } from '@/utils/plans';
import { toast } from 'sonner';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onSuccess?: () => void;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  if (!subscription) {
    return null;
  }

  const handleCancel = async () => {
    if (!subscription) return;

    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/dashboard/subscriptions/${subscription.id}/cancel`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.cancelledImmediately) {
          toast.success('Subscription cancelled immediately');
        } else {
          const endDate = new Date(data.endedAt);
          toast.success(
            `Subscription will remain active until ${endDate.toLocaleDateString()}`
          );
        }
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Cancel Subscription
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <p className="text-foreground/80 mb-4">
                Are you sure you want to cancel your subscription to the{' '}
                <strong>{subscription.plan?.name || 'current plan'}</strong> plan?
              </p>
            </div>

            <Card className="border border-warning/20 bg-warning/10">
              <CardBody className="p-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-warning">
                    Important Information:
                  </p>
                  <ul className="text-sm text-warning space-y-1 list-disc list-inside">
                    <li>
                      No refunds will be issued for the current billing period
                    </li>
                    <li>
                      You will retain access to all features until the end of
                      your current billing cycle
                    </li>
                    <li>
                      The subscription will not renew automatically after the
                      current period ends
                    </li>
                  </ul>
                </div>
              </CardBody>
            </Card>

            {subscription.ended_at && (
              <Card className="border border-primary/20 bg-primary/10">
                <CardBody className="p-4">
                  <p className="text-sm text-primary">
                    <strong>Access until:</strong>{' '}
                    {formatDate(subscription.ended_at)}
                  </p>
                </CardBody>
              </Card>
            )}

            <div className="text-sm text-foreground/70">
              <p>
                If you change your mind, you can reactivate your subscription
                at any time before the end of the current period.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
            disabled={isCancelling}
          >
            Keep Subscription
          </Button>
          <Button
            color="danger"
            onPress={handleCancel}
            isLoading={isCancelling}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Cancelling...
              </>
            ) : (
              'Cancel Subscription'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

