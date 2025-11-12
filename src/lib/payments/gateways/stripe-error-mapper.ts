/**
 * Stripe Error Mapper
 * 
 * Maps Stripe-specific errors to our internal error types
 */

import Stripe from 'stripe';
import {
  PaymentGatewayError,
  PaymentValidationError,
  PaymentProcessingError,
} from '../types';

/**
 * Map Stripe error to our internal error types
 */
export function mapStripeError(error: Stripe.errors.StripeError, _context: string): PaymentGatewayError {
  // Handle Stripe API errors
  if (error instanceof Stripe.errors.StripeCardError) {
    // Card errors - validation errors
    return new PaymentValidationError(
      error.message || 'Card error occurred',
      error.code || 'card_error'
    );
  }

  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    // Invalid request - validation error
    return new PaymentValidationError(
      error.message || 'Invalid request',
      error.param || 'invalid_request'
    );
  }

  if (error instanceof Stripe.errors.StripeAPIError) {
    // API errors - may be retryable
    return new PaymentGatewayError(
      error.message || 'API error occurred',
      error.type || 'api_error',
      error.statusCode || 500,
      error
    );
  }

  if (error instanceof Stripe.errors.StripeConnectionError) {
    // Connection errors - retryable
    return new PaymentGatewayError(
      'Connection error. Please check your internet connection and try again.',
      'connection_error',
      503,
      error
    );
  }

  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    // Authentication errors - configuration issue
    return new PaymentGatewayError(
      'Authentication failed. Please contact support.',
      'authentication_error',
      401,
      error
    );
  }

  if (error instanceof Stripe.errors.StripeRateLimitError) {
    // Rate limit errors - retryable with backoff
    return new PaymentGatewayError(
      'Too many requests. Please wait a moment and try again.',
      'rate_limit_error',
      429,
      error
    );
  }

  if (error instanceof Stripe.errors.StripeIdempotencyError) {
    // Idempotency errors - duplicate request
    return new PaymentProcessingError(
      'A payment with the same information was already processed.',
      'idempotency_error',
      error
    );
  }

  // Generic Stripe error
  return new PaymentGatewayError(
    error.message || 'Stripe error occurred',
    error.type || 'stripe_error',
    error.statusCode || 500,
    error
  );
}

/**
 * Extract specific error details from Stripe error
 */
export function extractStripeErrorDetails(error: Stripe.errors.StripeError): {
  code: string;
  message: string;
  type: string;
  statusCode?: number;
  param?: string;
  declineCode?: string;
} {
  const details: any = {
    code: error.code || 'unknown',
    message: error.message || 'Unknown error',
    type: error.type || 'unknown',
  };

  if ('statusCode' in error && error.statusCode) {
    details.statusCode = error.statusCode;
  }

  if ('param' in error && error.param) {
    details.param = error.param;
  }

  if (error instanceof Stripe.errors.StripeCardError && error.decline_code) {
    details.declineCode = error.decline_code;
  }

  return details;
}

