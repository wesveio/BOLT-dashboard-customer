/**
 * Payment Gateway Factory Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPaymentGateway, getPaymentGatewayFromEnv } from '../payment-gateway-factory';
import { PaymentGatewayConfig } from '../types';

describe('Payment Gateway Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentGateway', () => {
    it('should create Stripe gateway', () => {
      const config: PaymentGatewayConfig = {
        provider: 'stripe',
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      };

      const gateway = createPaymentGateway('stripe', config);
      expect(gateway).toBeDefined();
      expect(gateway.getProvider()).toBe('stripe');
    });

    it('should throw error for unsupported provider', () => {
      const config: PaymentGatewayConfig = {
        provider: 'paddle' as any,
        secretKey: 'test',
      };

      expect(() => createPaymentGateway('paddle' as any, config)).toThrow('not yet implemented');
    });

    it('should throw error for unknown provider', () => {
      const config: PaymentGatewayConfig = {
        provider: 'unknown' as any,
        secretKey: 'test',
      };

      expect(() => createPaymentGateway('unknown' as any, config)).toThrow('Unsupported');
    });
  });

  describe('getPaymentGatewayFromEnv', () => {
    it('should create gateway from environment variables', () => {
      const originalProvider = process.env.PAYMENT_GATEWAY_PROVIDER;
      const originalSecretKey = process.env.STRIPE_SECRET_KEY;
      const originalPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      process.env.PAYMENT_GATEWAY_PROVIDER = 'stripe';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

      const gateway = getPaymentGatewayFromEnv();
      expect(gateway).toBeDefined();
      expect(gateway.getProvider()).toBe('stripe');

      if (originalProvider) {
        process.env.PAYMENT_GATEWAY_PROVIDER = originalProvider;
      } else {
        delete process.env.PAYMENT_GATEWAY_PROVIDER;
      }

      if (originalSecretKey) {
        process.env.STRIPE_SECRET_KEY = originalSecretKey;
      } else {
        delete process.env.STRIPE_SECRET_KEY;
      }

      if (originalPublishableKey) {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalPublishableKey;
      } else {
        delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      }
    });

    it('should throw error when secret key is missing', () => {
      const originalSecretKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      expect(() => getPaymentGatewayFromEnv()).toThrow('Missing');

      if (originalSecretKey) {
        process.env.STRIPE_SECRET_KEY = originalSecretKey;
      }
    });

    it('should default to stripe when provider not specified', () => {
      const originalProvider = process.env.PAYMENT_GATEWAY_PROVIDER;
      const originalSecretKey = process.env.STRIPE_SECRET_KEY;

      delete process.env.PAYMENT_GATEWAY_PROVIDER;
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';

      const gateway = getPaymentGatewayFromEnv();
      expect(gateway.getProvider()).toBe('stripe');

      if (originalProvider) {
        process.env.PAYMENT_GATEWAY_PROVIDER = originalProvider;
      }

      if (originalSecretKey) {
        process.env.STRIPE_SECRET_KEY = originalSecretKey;
      } else {
        delete process.env.STRIPE_SECRET_KEY;
      }
    });
  });
});

