/**
 * Payment Gateway Factory
 * 
 * Factory pattern to create payment gateway instances based on configuration
 */

import { IPaymentGateway, PaymentGatewayType, PaymentGatewayConfig } from './types';
import { StripeGateway } from './gateways/stripe-gateway';

/**
 * Create a payment gateway instance based on provider type
 */
export function createPaymentGateway(
  type: PaymentGatewayType,
  config: PaymentGatewayConfig
): IPaymentGateway {
  switch (type) {
    case 'stripe':
      return new StripeGateway(config);
    case 'paddle':
      // TODO: Implement Paddle gateway when needed
      throw new Error('Paddle gateway not yet implemented');
    default:
      throw new Error(`Unsupported payment gateway provider: ${type}`);
  }
}

/**
 * Get payment gateway from environment configuration
 */
export function getPaymentGatewayFromEnv(): IPaymentGateway {
  const provider = (process.env.PAYMENT_GATEWAY_PROVIDER || 'stripe') as PaymentGatewayType;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) {
    throw new Error(`Missing ${provider.toUpperCase()}_SECRET_KEY environment variable`);
  }

  const config: PaymentGatewayConfig = {
    provider,
    secretKey,
    publishableKey,
    webhookSecret,
  };

  return createPaymentGateway(provider, config);
}

