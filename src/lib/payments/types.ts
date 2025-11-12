/**
 * Payment Gateway Types and Interfaces
 * 
 * This module defines the abstraction layer for payment gateways,
 * allowing easy switching between different providers (Stripe, Paddle, etc.)
 */

/**
 * Supported payment gateway providers
 */
export type PaymentGatewayType = 'stripe' | 'paddle';

/**
 * Payment gateway configuration
 */
export interface PaymentGatewayConfig {
  provider: PaymentGatewayType;
  secretKey: string;
  publishableKey?: string;
  webhookSecret?: string;
  apiVersion?: string;
  [key: string]: any; // Allow additional provider-specific config
}

/**
 * Customer data for payment gateway
 */
export interface CustomerData {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

/**
 * Payment method data
 */
export interface PaymentMethodData {
  type: 'card';
  card?: {
    number?: string;
    exp_month?: number;
    exp_year?: number;
    cvc?: string;
  };
  payment_method_id?: string; // For saved payment methods
}

/**
 * Subscription creation data
 */
export interface SubscriptionData {
  customerId: string; // Our internal customer/account ID
  planId: string; // Our internal plan ID
  priceId?: string; // Gateway-specific price/product ID
  amount: number; // Amount in cents (or smallest currency unit)
  currency: string; // ISO 4217 currency code (USD, BRL, etc.)
  billingCycle: 'monthly' | 'yearly';
  paymentMethodId?: string; // Gateway payment method ID
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

/**
 * Transaction data
 */
export interface TransactionData {
  id: string; // Our internal transaction ID
  subscriptionId: string; // Our internal subscription ID
  amount: number; // Amount in cents
  currency: string; // ISO 4217 currency code
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transactionType: 'subscription' | 'upgrade' | 'downgrade' | 'refund';
  gatewayTransactionId?: string; // Gateway-specific transaction ID
  gatewayInvoiceId?: string; // Gateway-specific invoice ID
  receiptUrl?: string;
  invoiceUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Webhook event data
 */
export interface WebhookEventData {
  id: string; // Gateway event ID
  type: string; // Event type (e.g., 'invoice.payment_succeeded')
  data: {
    object: any; // Gateway-specific event object
  };
  created: number; // Unix timestamp
}

/**
 * Payment gateway result types
 */
export interface CreateCustomerResult {
  customerId: string; // Gateway customer ID
  email: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionResult {
  subscriptionId: string; // Gateway subscription ID
  customerId: string; // Gateway customer ID
  status: string;
  currentPeriodStart: number; // Unix timestamp
  currentPeriodEnd: number; // Unix timestamp
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface GetTransactionResult {
  id: string; // Gateway transaction ID
  amount: number;
  currency: string;
  status: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Payment Gateway Interface
 * 
 * All payment gateway implementations must implement this interface
 */
export interface IPaymentGateway {
  /**
   * Get the payment gateway provider name
   */
  getProvider(): PaymentGatewayType;

  /**
   * Create a customer in the payment gateway
   */
  createCustomer(data: CustomerData): Promise<CreateCustomerResult>;

  /**
   * Get customer information from payment gateway
   */
  getCustomer(customerId: string): Promise<CustomerData & { id: string }>;

  /**
   * Update customer information
   */
  updateCustomer(customerId: string, data: Partial<CustomerData>): Promise<void>;

  /**
   * Create a subscription in the payment gateway
   */
  createSubscription(data: SubscriptionData): Promise<CreateSubscriptionResult>;

  /**
   * Get subscription information from payment gateway
   */
  getSubscription(subscriptionId: string): Promise<CreateSubscriptionResult>;

  /**
   * Update subscription (e.g., change plan, update payment method)
   */
  updateSubscription(
    subscriptionId: string,
    updates: {
      planId?: string;
      priceId?: string;
      paymentMethodId?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<CreateSubscriptionResult>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void>;

  /**
   * Create a payment intent for one-time or subscription payments
   */
  createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string,
    paymentMethodId?: string,
    metadata?: Record<string, string>
  ): Promise<CreatePaymentIntentResult>;

  /**
   * Get transaction/invoice information
   */
  getTransaction(transactionId: string): Promise<GetTransactionResult>;

  /**
   * Get invoice information
   */
  getInvoice(invoiceId: string): Promise<GetTransactionResult>;

  /**
   * Handle webhook events from payment gateway
   */
  handleWebhook(event: WebhookEventData): Promise<{
    type: string;
    data: any;
    processed: boolean;
  }>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean;
}

/**
 * Payment gateway error types
 */
export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

export class PaymentValidationError extends PaymentGatewayError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'PaymentValidationError';
  }
}

export class PaymentProcessingError extends PaymentGatewayError {
  constructor(message: string, code?: string, originalError?: any) {
    super(message, code || 'PROCESSING_ERROR', 402, originalError);
    this.name = 'PaymentProcessingError';
  }
}

