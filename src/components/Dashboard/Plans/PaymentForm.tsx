'use client';

import { useState, FormEvent } from 'react';
import {
  Card,
  CardBody,
  Button,
} from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { getUserFriendlyErrorMessage } from '@/lib/payments/error-handler';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PaymentFormProps {
  planId: string;
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Payment form component using Stripe Elements
 */
function PaymentFormContent({
  planId,
  amount,
  currency,
  onSuccess,
  onCancel,
  isLoading: externalLoading,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment intent via our API
      const response = await fetch('/api/dashboard/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { client_secret, payment_intent_id } = await response.json();

      if (!client_secret) {
        throw new Error('No client secret received');
      }

      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess(payment_intent_id);
      } else {
        throw new Error('Payment not completed');
      }
    } catch (err: any) {
      console.error('❌ [DEBUG] Payment error:', err);
      const userMessage = getUserFriendlyErrorMessage(err);
      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing || externalLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Amount:</span>
          <span className="text-xl font-bold text-gray-900">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
            }).format(amount)}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="light"
          onPress={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="primary"
          disabled={isLoading || !stripe}
          isLoading={isLoading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * Payment form wrapper with Stripe Elements provider
 */
export function PaymentForm(props: PaymentFormProps) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <Card className="border border-red-200">
        <CardBody className="p-6">
          <div className="text-center text-red-600">
            Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}

