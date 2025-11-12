/**
 * Payment Flow Integration Tests
 * 
 * Tests the complete payment flow from checkout to subscription creation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPaymentGatewayFromEnv } from '../../payment-gateway-factory';
import { CustomerData, SubscriptionData } from '../../types';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: {
        create: vi.fn().mockResolvedValue({
          id: 'cus_test_123',
          email: 'test@example.com',
          metadata: {},
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: 'cus_test_123',
          email: 'test@example.com',
          metadata: {},
        }),
      },
      subscriptions: {
        create: vi.fn().mockResolvedValue({
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          metadata: {},
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          metadata: {},
        }),
      },
      prices: {
        create: vi.fn().mockResolvedValue({
          id: 'price_test_123',
          unit_amount: 20000,
          currency: 'usd',
        }),
      },
      paymentIntents: {
        create: vi.fn().mockResolvedValue({
          id: 'pi_test_123',
          client_secret: 'pi_test_123_secret',
          amount: 20000,
          currency: 'usd',
        }),
      },
    })),
  };
});

describe('Payment Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
  });

  describe('Complete Payment Flow', () => {
    it('should create customer, subscription, and payment intent', async () => {
      const gateway = getPaymentGatewayFromEnv();

      // Step 1: Create customer
      const customerData: CustomerData = {
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          account_id: 'acc_123',
        },
      };

      const customer = await gateway.createCustomer(customerData);
      expect(customer.customerId).toBeDefined();
      expect(customer.email).toBe('test@example.com');

      // Step 2: Create payment intent
      const paymentIntent = await gateway.createPaymentIntent(
        200,
        'USD',
        customer.customerId
      );
      expect(paymentIntent.paymentIntentId).toBeDefined();
      expect(paymentIntent.clientSecret).toBeDefined();
      expect(paymentIntent.amount).toBe(200);
      expect(paymentIntent.currency).toBe('USD');

      // Step 3: Create subscription
      const subscriptionData: SubscriptionData = {
        customerId: customer.customerId,
        planId: 'plan_123',
        amount: 200,
        currency: 'USD',
        billingCycle: 'monthly',
        metadata: {
          plan_id: 'plan_123',
        },
      };

      const subscription = await gateway.createSubscription(subscriptionData);
      expect(subscription.subscriptionId).toBeDefined();
      expect(subscription.customerId).toBe(customer.customerId);
      expect(subscription.status).toBe('active');
    });

    it('should handle currency conversion in subscription flow', async () => {
      const gateway = getPaymentGatewayFromEnv();

      const customer = await gateway.createCustomer({
        email: 'test@example.com',
      });

      // Create subscription with BRL
      const subscription = await gateway.createSubscription({
        customerId: customer.customerId,
        planId: 'plan_123',
        amount: 1000, // BRL amount
        currency: 'BRL',
        billingCycle: 'monthly',
      });

      expect(subscription.subscriptionId).toBeDefined();
      expect(subscription.status).toBe('active');
    });
  });

  describe('Error Handling in Flow', () => {
    it('should handle customer creation failure gracefully', async () => {
      const gateway = getPaymentGatewayFromEnv();
      
      // Mock customer creation to fail
      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe('sk_test_123');
      vi.spyOn(mockStripe.customers, 'create').mockRejectedValueOnce(
        new Error('API error')
      );

      await expect(
        gateway.createCustomer({
          email: 'test@example.com',
        })
      ).rejects.toThrow();
    });

    it('should handle subscription creation failure after customer creation', async () => {
      const gateway = getPaymentGatewayFromEnv();

      const customer = await gateway.createCustomer({
        email: 'test@example.com',
      });

      // Mock subscription creation to fail
      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe('sk_test_123');
      vi.spyOn(mockStripe.subscriptions, 'create').mockRejectedValueOnce(
        new Error('Subscription creation failed')
      );

      await expect(
        gateway.createSubscription({
          customerId: customer.customerId,
          planId: 'plan_123',
          amount: 200,
          currency: 'USD',
          billingCycle: 'monthly',
        })
      ).rejects.toThrow();
    });
  });

  describe('Webhook Processing', () => {
    it('should process payment succeeded webhook', async () => {
      const gateway = getPaymentGatewayFromEnv();

      const webhookEvent = {
        id: 'evt_test_123',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            subscription: 'sub_test_123',
            customer: 'cus_test_123',
            amount_paid: 20000,
            currency: 'usd',
          },
        },
        created: Math.floor(Date.now() / 1000),
      };

      const result = await gateway.handleWebhook(webhookEvent);
      expect(result.processed).toBe(true);
      expect(result.type).toBe('payment_succeeded');
      expect(result.data.subscriptionId).toBe('sub_test_123');
    });

    it('should process payment failed webhook', async () => {
      const gateway = getPaymentGatewayFromEnv();

      const webhookEvent = {
        id: 'evt_test_123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test_123',
            subscription: 'sub_test_123',
            customer: 'cus_test_123',
            amount_due: 20000,
            currency: 'usd',
          },
        },
        created: Math.floor(Date.now() / 1000),
      };

      const result = await gateway.handleWebhook(webhookEvent);
      expect(result.processed).toBe(true);
      expect(result.type).toBe('payment_failed');
    });

    it('should process subscription cancelled webhook', async () => {
      const gateway = getPaymentGatewayFromEnv();

      const webhookEvent = {
        id: 'evt_test_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
          },
        },
        created: Math.floor(Date.now() / 1000),
      };

      const result = await gateway.handleWebhook(webhookEvent);
      expect(result.processed).toBe(true);
      expect(result.type).toBe('subscription_cancelled');
    });
  });
});

