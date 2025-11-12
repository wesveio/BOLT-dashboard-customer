/**
 * Stripe Payment Gateway Implementation
 * 
 * Implements IPaymentGateway interface for Stripe
 */

import Stripe from 'stripe';
import { BasePaymentGateway } from '../base-gateway';
import {
  IPaymentGateway,
  PaymentGatewayType,
  PaymentGatewayConfig,
  CustomerData,
  SubscriptionData,
  CreateCustomerResult,
  CreateSubscriptionResult,
  CreatePaymentIntentResult,
  GetTransactionResult,
  WebhookEventData,
  PaymentGatewayError,
  PaymentProcessingError,
} from '../types';

export class StripeGateway extends BasePaymentGateway implements IPaymentGateway {
  private stripe: Stripe;

  constructor(config: PaymentGatewayConfig) {
    super(config);
    
    if (!config.secretKey) {
      throw new Error('Stripe secret key is required');
    }

    this.stripe = new Stripe(config.secretKey, {
      apiVersion: config.apiVersion || '2024-11-20.acacia',
    });
  }

  getProvider(): PaymentGatewayType {
    return 'stripe';
  }

  async createCustomer(data: CustomerData): Promise<CreateCustomerResult> {
    try {
      this.log('info', 'Creating Stripe customer', { email: data.email });

      const customer = await this.stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata || {},
        address: data.address
          ? {
              line1: data.address.line1,
              line2: data.address.line2,
              city: data.address.city,
              state: data.address.state,
              postal_code: data.address.postal_code,
              country: data.address.country,
            }
          : undefined,
      });

      this.log('info', 'Stripe customer created', { customerId: customer.id });

      return {
        customerId: customer.id,
        email: customer.email || data.email,
        metadata: customer.metadata,
      };
    } catch (error: any) {
      this.handleError(error, 'createCustomer');
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<CustomerData & { id: string }> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new PaymentGatewayError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
      }

      if (!('email' in customer)) {
        throw new PaymentGatewayError('Invalid customer data', 'INVALID_CUSTOMER', 400);
      }

      return {
        id: customer.id,
        email: customer.email || '',
        name: customer.name || undefined,
        phone: customer.phone || undefined,
        metadata: customer.metadata,
        address: customer.address
          ? {
              line1: customer.address.line1 || undefined,
              line2: customer.address.line2 || undefined,
              city: customer.address.city || undefined,
              state: customer.address.state || undefined,
              postal_code: customer.address.postal_code || undefined,
              country: customer.address.country || undefined,
            }
          : undefined,
      };
    } catch (error: any) {
      this.handleError(error, 'getCustomer');
      throw error;
    }
  }

  async updateCustomer(customerId: string, data: Partial<CustomerData>): Promise<void> {
    try {
      await this.stripe.customers.update(customerId, {
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata,
        address: data.address
          ? {
              line1: data.address.line1,
              line2: data.address.line2,
              city: data.address.city,
              state: data.address.state,
              postal_code: data.address.postal_code,
              country: data.address.country,
            }
          : undefined,
      });

      this.log('info', 'Stripe customer updated', { customerId });
    } catch (error: any) {
      this.handleError(error, 'updateCustomer');
      throw error;
    }
  }

  async createSubscription(data: SubscriptionData): Promise<CreateSubscriptionResult> {
    try {
      this.validateAmount(data.amount);
      this.validateCurrency(data.currency);

      this.log('info', 'Creating Stripe subscription', {
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
      });

      // Create price if priceId not provided
      let priceId = data.priceId;
      if (!priceId) {
        // Create a price on the fly
        const price = await this.stripe.prices.create({
          unit_amount: this.convertToSmallestUnit(data.amount),
          currency: data.currency.toLowerCase(),
          recurring: {
            interval: data.billingCycle === 'yearly' ? 'year' : 'month',
          },
          product_data: {
            name: `Plan ${data.planId}`,
            metadata: {
              plan_id: data.planId,
            },
          },
        });
        priceId = price.id;
      }

      // Create subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: data.customerId,
        items: [{ price: priceId }],
        metadata: {
          plan_id: data.planId,
          ...data.metadata,
        },
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (data.paymentMethodId) {
        subscriptionParams.default_payment_method = data.paymentMethodId;
      }

      if (data.trialPeriodDays) {
        subscriptionParams.trial_period_days = data.trialPeriodDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      this.log('info', 'Stripe subscription created', {
        subscriptionId: subscription.id,
        customerId: data.customerId,
      });

      return {
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        metadata: subscription.metadata,
      };
    } catch (error: any) {
      this.handleError(error, 'createSubscription');
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<CreateSubscriptionResult> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      return {
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        metadata: subscription.metadata,
      };
    } catch (error: any) {
      this.handleError(error, 'getSubscription');
      throw error;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: {
      planId?: string;
      priceId?: string;
      paymentMethodId?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<CreateSubscriptionResult> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (updates.priceId) {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        updateParams.items = [
          {
            id: subscription.items.data[0]?.id,
            price: updates.priceId,
          },
        ];
        updateParams.proration_behavior = 'always';
      }

      if (updates.paymentMethodId) {
        updateParams.default_payment_method = updates.paymentMethodId;
      }

      if (updates.metadata) {
        updateParams.metadata = updates.metadata;
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateParams);

      this.log('info', 'Stripe subscription updated', { subscriptionId });

      return {
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        metadata: subscription.metadata,
      };
    } catch (error: any) {
      this.handleError(error, 'updateSubscription');
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<void> {
    try {
      if (immediately) {
        await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      this.log('info', 'Stripe subscription cancelled', { subscriptionId, immediately });
    } catch (error: any) {
      this.handleError(error, 'cancelSubscription');
      throw error;
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string,
    paymentMethodId?: string,
    metadata?: Record<string, string>
  ): Promise<CreatePaymentIntentResult> {
    try {
      this.validateAmount(amount);
      this.validateCurrency(currency);

      const params: Stripe.PaymentIntentCreateParams = {
        amount: this.convertToSmallestUnit(amount),
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: metadata || {},
      };

      if (customerId) {
        params.customer = customerId;
      }

      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(params);

      this.log('info', 'Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
      });

      return {
        clientSecret: paymentIntent.client_secret || '',
        paymentIntentId: paymentIntent.id,
        amount: this.convertFromSmallestUnit(paymentIntent.amount),
        currency: paymentIntent.currency.toUpperCase(),
      };
    } catch (error: any) {
      this.handleError(error, 'createPaymentIntent');
      throw error;
    }
  }

  async getTransaction(transactionId: string): Promise<GetTransactionResult> {
    try {
      // Try as charge first
      try {
        const charge = await this.stripe.charges.retrieve(transactionId);
        return {
          id: charge.id,
          amount: this.convertFromSmallestUnit(charge.amount),
          currency: charge.currency.toUpperCase(),
          status: charge.status === 'succeeded' ? 'completed' : charge.status,
          receiptUrl: charge.receipt_url || undefined,
          metadata: charge.metadata,
        };
      } catch {
        // If not a charge, try as payment intent
        const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);
        return {
          id: paymentIntent.id,
          amount: this.convertFromSmallestUnit(paymentIntent.amount),
          currency: paymentIntent.currency.toUpperCase(),
          status: paymentIntent.status === 'succeeded' ? 'completed' : paymentIntent.status,
          metadata: paymentIntent.metadata,
        };
      }
    } catch (error: any) {
      this.handleError(error, 'getTransaction');
      throw error;
    }
  }

  async getInvoice(invoiceId: string): Promise<GetTransactionResult> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);

      return {
        id: invoice.id,
        amount: this.convertFromSmallestUnit(invoice.amount_paid || invoice.amount_due),
        currency: invoice.currency.toUpperCase(),
        status: invoice.status === 'paid' ? 'completed' : invoice.status || 'pending',
        receiptUrl: invoice.hosted_invoice_url || undefined,
        invoiceUrl: invoice.invoice_pdf || undefined,
        metadata: invoice.metadata,
      };
    } catch (error: any) {
      this.handleError(error, 'getInvoice');
      throw error;
    }
  }

  async handleWebhook(event: WebhookEventData): Promise<{
    type: string;
    data: any;
    processed: boolean;
  }> {
    try {
      const stripeEvent = event as any;

      this.log('info', 'Processing Stripe webhook', { type: stripeEvent.type, id: stripeEvent.id });

      // Map Stripe event types to our internal event types
      const eventHandlers: Record<string, (data: any) => Promise<any>> = {
        'invoice.payment_succeeded': async (data) => {
          return {
            type: 'payment_succeeded',
            invoiceId: data.object.id,
            subscriptionId: data.object.subscription,
            customerId: data.object.customer,
            amount: this.convertFromSmallestUnit(data.object.amount_paid),
            currency: data.object.currency.toUpperCase(),
          };
        },
        'invoice.payment_failed': async (data) => {
          return {
            type: 'payment_failed',
            invoiceId: data.object.id,
            subscriptionId: data.object.subscription,
            customerId: data.object.customer,
            amount: this.convertFromSmallestUnit(data.object.amount_due),
            currency: data.object.currency.toUpperCase(),
          };
        },
        'customer.subscription.updated': async (data) => {
          return {
            type: 'subscription_updated',
            subscriptionId: data.object.id,
            customerId: data.object.customer,
            status: data.object.status,
          };
        },
        'customer.subscription.deleted': async (data) => {
          return {
            type: 'subscription_cancelled',
            subscriptionId: data.object.id,
            customerId: data.object.customer,
          };
        },
        'charge.refunded': async (data) => {
          return {
            type: 'refund_processed',
            chargeId: data.object.id,
            amount: this.convertFromSmallestUnit(data.object.amount_refunded),
            currency: data.object.currency.toUpperCase(),
          };
        },
      };

      const handler = eventHandlers[stripeEvent.type];
      if (handler) {
        const result = await handler(stripeEvent);
        return {
          type: result.type,
          data: result,
          processed: true,
        };
      }

      // Event type not handled
      return {
        type: stripeEvent.type,
        data: stripeEvent.data.object,
        processed: false,
      };
    } catch (error: any) {
      this.handleError(error, 'handleWebhook');
      throw error;
    }
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    try {
      if (!this.config.webhookSecret) {
        this.log('warn', 'Webhook secret not configured, skipping signature verification');
        return true; // In development, allow without secret
      }

      const webhookSecret = this.config.webhookSecret;
      const sig = signature;

      try {
        this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
        return true;
      } catch (err: any) {
        this.log('error', 'Webhook signature verification failed', { error: err.message });
        return false;
      }
    } catch (error: any) {
      this.handleError(error, 'verifyWebhookSignature');
      throw error;
    }
  }
}

