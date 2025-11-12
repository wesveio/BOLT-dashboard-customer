/**
 * Stripe Error Mapper Tests
 */

import { describe, it, expect } from 'vitest';
import Stripe from 'stripe';
import { mapStripeError, extractStripeErrorDetails } from '../gateways/stripe-error-mapper';
import { PaymentValidationError, PaymentGatewayError, PaymentProcessingError } from '../types';

describe('Stripe Error Mapper', () => {
  describe('mapStripeError', () => {
    it('should map StripeCardError to PaymentValidationError', () => {
      const stripeError = {
        type: 'StripeCardError',
        message: 'Your card was declined.',
        code: 'card_declined',
        param: undefined,
        statusCode: 402,
        decline_code: 'generic_decline',
      } as unknown as Stripe.errors.StripeCardError;

      const error = mapStripeError(stripeError, 'test');
      expect(error).toBeInstanceOf(PaymentValidationError);
      expect(error.message).toContain('declined');
    });

    it('should map StripeInvalidRequestError to PaymentValidationError', () => {
      const stripeError = {
        type: 'StripeInvalidRequestError',
        message: 'Invalid request',
        code: 'invalid_request',
        param: 'amount',
        statusCode: 400,
      } as unknown as Stripe.errors.StripeInvalidRequestError;

      const error = mapStripeError(stripeError, 'test');
      expect(error).toBeInstanceOf(PaymentValidationError);
      expect((error as PaymentValidationError).field).toBe('amount');
    });

    it('should map StripeAPIError to PaymentGatewayError', () => {
      const stripeError = {
        type: 'StripeAPIError',
        message: 'API error',
        statusCode: 500,
      } as unknown as Stripe.errors.StripeAPIError;

      const error = mapStripeError(stripeError, 'test');
      expect(error).toBeInstanceOf(PaymentGatewayError);
      expect(error.statusCode).toBe(500);
    });

    it('should map StripeConnectionError to PaymentGatewayError with 503', () => {
      const stripeError = {
        type: 'StripeConnectionError',
        message: 'Connection error',
      } as unknown as Stripe.errors.StripeConnectionError;

      const error = mapStripeError(stripeError, 'test');
      expect(error).toBeInstanceOf(PaymentGatewayError);
      expect(error.statusCode).toBe(503);
      expect(error.message).toContain('Connection');
    });

    it('should map StripeAuthenticationError to PaymentGatewayError with 401', () => {
      const stripeError = {
        type: 'StripeAuthenticationError',
        message: 'Authentication failed',
      } as unknown as Stripe.errors.StripeAuthenticationError;

      const error = mapStripeError(stripeError, 'test');
      expect(error).toBeInstanceOf(PaymentGatewayError);
      expect(error.statusCode).toBe(401);
    });

    it('should map StripeRateLimitError to PaymentGatewayError with 429', () => {
      const stripeError = {
        type: 'StripeRateLimitError',
        message: 'Rate limit exceeded',
      } as unknown as Stripe.errors.StripeRateLimitError;

      const error = mapStripeError(stripeError, 'test');
      expect(error).toBeInstanceOf(PaymentGatewayError);
      expect(error.statusCode).toBe(429);
      expect(error.message).toContain('wait');
    });

    it('should map StripeIdempotencyError to PaymentProcessingError', () => {
      const stripeError = {
        type: 'StripeIdempotencyError',
        message: 'Idempotency error',
      } as unknown as Stripe.errors.StripeIdempotencyError;

      const error = mapStripeError(stripeError, 'test');
      expect(error).toBeInstanceOf(PaymentProcessingError);
      expect(error.message).toContain('already processed');
    });
  });

  describe('extractStripeErrorDetails', () => {
    it('should extract details from StripeCardError', () => {
      const stripeError = {
        type: 'StripeCardError',
        message: 'Card declined',
        code: 'card_declined',
        statusCode: 402,
        param: 'card',
        decline_code: 'generic_decline',
      } as unknown as Stripe.errors.StripeCardError;

      const details = extractStripeErrorDetails(stripeError);
      expect(details.code).toBe('card_declined');
      expect(details.message).toBe('Card declined');
      expect(details.type).toBe('StripeCardError');
      expect(details.statusCode).toBe(402);
      expect(details.param).toBe('card');
      expect(details.declineCode).toBe('generic_decline');
    });

    it('should extract details from StripeAPIError', () => {
      const stripeError = {
        type: 'StripeAPIError',
        message: 'API error',
        code: 'api_error',
        statusCode: 500,
      } as unknown as Stripe.errors.StripeAPIError;

      const details = extractStripeErrorDetails(stripeError);
      expect(details.code).toBe('api_error');
      expect(details.statusCode).toBe(500);
    });

    it('should handle errors without optional fields', () => {
      const stripeError = {
        type: 'StripeError',
        message: 'Generic error',
        code: 'generic_error',
      } as unknown as Stripe.errors.StripeError;

      const details = extractStripeErrorDetails(stripeError);
      expect(details.code).toBe('generic_error');
      expect(details.statusCode).toBeUndefined();
      expect(details.param).toBeUndefined();
    });
  });
});

