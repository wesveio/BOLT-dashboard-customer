/**
 * Error Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isRetryableError,
  getUserFriendlyErrorMessage,
  extractErrorCode,
  retryWithBackoff,
  handlePaymentOperation,
  validatePaymentEnvironment,
  createIdempotencyKey,
  isValidationError,
  isPaymentProcessingError,
} from '../error-handler';
import {
  PaymentGatewayError,
  PaymentValidationError,
  PaymentProcessingError,
} from '../types';

describe('Error Handler', () => {
  describe('isRetryableError', () => {
    it('should return false for validation errors', () => {
      const error = new PaymentValidationError('Invalid input', 'field');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for network errors', () => {
      const error = new Error('ECONNRESET');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('ETIMEDOUT');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for connection refused errors', () => {
      const error = new Error('ECONNREFUSED');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for payment gateway errors that are not retryable', () => {
      const error = new PaymentGatewayError('Invalid card', 'INVALID_CARD', 400);
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return user-friendly message for card declined', () => {
      const error = new PaymentGatewayError('Card declined', 'card_declined', 402);
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('declined');
      expect(message).not.toContain('card_declined');
    });

    it('should return user-friendly message for expired card', () => {
      const error = new PaymentGatewayError('Expired card', 'expired_card', 402);
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('expired');
    });

    it('should return user-friendly message for insufficient funds', () => {
      const error = new PaymentGatewayError('Insufficient funds', 'insufficient_funds', 402);
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('insufficient');
    });

    it('should return user-friendly message for network errors', () => {
      const error = new Error('ECONNRESET');
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('Connection');
    });

    it('should return original message for unknown errors', () => {
      const error = new Error('Custom error message');
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should handle PaymentValidationError', () => {
      const error = new PaymentValidationError('Invalid field', 'field');
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('check your information');
    });
  });

  describe('extractErrorCode', () => {
    it('should extract code from PaymentGatewayError', () => {
      const error = new PaymentGatewayError('Error', 'CARD_DECLINED', 402);
      expect(extractErrorCode(error)).toBe('CARD_DECLINED');
    });

    it('should extract code from error object', () => {
      const error = { code: 'INVALID_CARD', message: 'Error' };
      expect(extractErrorCode(error)).toBe('INVALID_CARD');
    });

    it('should extract type from error object', () => {
      const error = { type: 'card_error', message: 'Error' };
      expect(extractErrorCode(error)).toBe('card_error');
    });

    it('should return UNKNOWN_ERROR for errors without code', () => {
      const error = new Error('Error without code');
      expect(extractErrorCode(error)).toBe('UNKNOWN_ERROR');
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(fn, { maxRetries: 1, retryDelay: 100 });
      
      // Fast-forward time
      await vi.advanceTimersByTimeAsync(100);
      
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on validation errors', async () => {
      const fn = vi.fn().mockRejectedValue(new PaymentValidationError('Invalid', 'field'));
      
      await expect(retryWithBackoff(fn)).rejects.toThrow(PaymentValidationError);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const error = new Error('ECONNRESET');
      const fn = vi.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, { maxRetries: 2, retryDelay: 100 });
      
      // Fast-forward time
      await vi.advanceTimersByTimeAsync(300);
      
      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(fn, {
        maxRetries: 2,
        retryDelay: 100,
        backoffMultiplier: 2,
      });

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      // Second retry after 200ms (100 * 2)
      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('handlePaymentOperation', () => {
    it('should return result on success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await handlePaymentOperation(operation, 'test');
      expect(result).toBe('success');
    });

    it('should wrap error in PaymentGatewayError', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      await expect(handlePaymentOperation(operation, 'test')).rejects.toThrow(PaymentGatewayError);
    });

    it('should preserve PaymentGatewayError', async () => {
      const originalError = new PaymentGatewayError('Test', 'TEST_ERROR', 400);
      const operation = vi.fn().mockRejectedValue(originalError);
      
      await expect(handlePaymentOperation(operation, 'test')).rejects.toThrow(PaymentGatewayError);
    });
  });

  describe('validatePaymentEnvironment', () => {
    it('should not throw when all variables are present', () => {
      const originalStripeKey = process.env.STRIPE_SECRET_KEY;
      const originalPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      
      expect(() => validatePaymentEnvironment()).not.toThrow();
      
      if (originalStripeKey) {
        process.env.STRIPE_SECRET_KEY = originalStripeKey;
      } else {
        delete process.env.STRIPE_SECRET_KEY;
      }
      
      if (originalPublishableKey) {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalPublishableKey;
      } else {
        delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      }
    });

    it('should throw when variables are missing', () => {
      const originalStripeKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      
      expect(() => validatePaymentEnvironment()).toThrow();
      
      if (originalStripeKey) {
        process.env.STRIPE_SECRET_KEY = originalStripeKey;
      }
    });
  });

  describe('createIdempotencyKey', () => {
    it('should create unique keys for different data', () => {
      const key1 = createIdempotencyKey('test', { id: '1' });
      const key2 = createIdempotencyKey('test', { id: '2' });
      expect(key1).not.toBe(key2);
    });

    it('should create same key for same data', () => {
      const data = { id: '1', name: 'test' };
      const key1 = createIdempotencyKey('test', data);
      const key2 = createIdempotencyKey('test', data);
      expect(key1).toBe(key2);
    });

    it('should include prefix', () => {
      const key = createIdempotencyKey('payment', { id: '1' });
      expect(key).toContain('payment');
    });
  });

  describe('isValidationError', () => {
    it('should return true for PaymentValidationError', () => {
      const error = new PaymentValidationError('Invalid', 'field');
      expect(isValidationError(error)).toBe(true);
    });

    it('should return true for errors with VALIDATION_ERROR code', () => {
      const error = { code: 'VALIDATION_ERROR' };
      expect(isValidationError(error)).toBe(true);
    });

    it('should return true for 400 status code', () => {
      const error = { statusCode: 400 };
      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new PaymentGatewayError('Error', 'OTHER_ERROR', 500);
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe('isPaymentProcessingError', () => {
    it('should return true for PaymentProcessingError', () => {
      const error = new PaymentProcessingError('Processing failed');
      expect(isPaymentProcessingError(error)).toBe(true);
    });

    it('should return true for errors with PAYMENT code', () => {
      const error = { code: 'PAYMENT_FAILED' };
      expect(isPaymentProcessingError(error)).toBe(true);
    });

    it('should return true for errors with CARD code', () => {
      const error = { code: 'CARD_DECLINED' };
      expect(isPaymentProcessingError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new PaymentGatewayError('Error', 'NETWORK_ERROR', 500);
      expect(isPaymentProcessingError(error)).toBe(false);
    });
  });
});

