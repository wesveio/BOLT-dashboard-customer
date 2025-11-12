/**
 * Base Payment Gateway
 * 
 * Abstract base class with common functionality for payment gateways
 */

import { IPaymentGateway, PaymentGatewayType, PaymentGatewayError } from './types';

/**
 * Abstract base class for payment gateway implementations
 * Provides common functionality and error handling patterns
 */
export abstract class BasePaymentGateway implements IPaymentGateway {
  protected config: any;

  constructor(config: any) {
    this.config = config;
  }

  abstract getProvider(): PaymentGatewayType;
  abstract createCustomer(data: any): Promise<any>;
  abstract getCustomer(customerId: string): Promise<any>;
  abstract updateCustomer(customerId: string, data: any): Promise<void>;
  abstract createSubscription(data: any): Promise<any>;
  abstract getSubscription(subscriptionId: string): Promise<any>;
  abstract updateSubscription(subscriptionId: string, updates: any): Promise<any>;
  abstract cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void>;
  abstract createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string,
    paymentMethodId?: string,
    metadata?: Record<string, string>
  ): Promise<any>;
  abstract getTransaction(transactionId: string): Promise<any>;
  abstract getInvoice(invoiceId: string): Promise<any>;
  abstract handleWebhook(event: any): Promise<any>;
  abstract verifyWebhookSignature(payload: string | Buffer, signature: string): boolean;

  /**
   * Validate currency code (ISO 4217)
   */
  protected validateCurrency(currency: string): void {
    if (!currency || currency.length !== 3) {
      throw new PaymentGatewayError('Invalid currency code. Must be ISO 4217 format (3 letters)', 'INVALID_CURRENCY');
    }
  }

  /**
   * Validate amount (must be positive)
   */
  protected validateAmount(amount: number): void {
    if (!amount || amount <= 0) {
      throw new PaymentGatewayError('Amount must be greater than zero', 'INVALID_AMOUNT');
    }
  }

  /**
   * Convert amount to smallest currency unit (cents for USD/BRL)
   */
  protected convertToSmallestUnit(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert from smallest currency unit to standard amount
   */
  protected convertFromSmallestUnit(amount: number): number {
    return amount / 100;
  }

  /**
   * Log payment gateway operations (for debugging)
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    const logMessage = `[${prefix}] [DEBUG] [PaymentGateway:${this.getProvider()}] ${message}`;
    
    if (data) {
      console[level](logMessage, data);
    } else {
      console[level](logMessage);
    }
  }

  /**
   * Handle errors from payment gateway APIs
   */
  protected handleError(error: any, context: string): never {
    this.log('error', `Error in ${context}`, error);
    
    if (error instanceof PaymentGatewayError) {
      throw error;
    }

    // Map common error patterns
    const message = error?.message || 'Unknown payment gateway error';
    const code = error?.code || 'UNKNOWN_ERROR';
    const statusCode = error?.statusCode || 500;

    throw new PaymentGatewayError(message, code, statusCode, error);
  }
}

