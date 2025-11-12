/**
 * Payment Error Handler
 * 
 * Comprehensive error handling for payment operations including:
 * - Error mapping from payment gateways to user-friendly messages
 * - Retry logic for transient failures
 * - Network error handling
 * - Edge case handling
 */

import { PaymentGatewayError, PaymentValidationError, PaymentProcessingError } from './types';

/**
 * Stripe error codes mapped to user-friendly messages
 */
const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  // Card errors
  card_declined: 'Your card was declined. Please try a different payment method.',
  expired_card: 'Your card has expired. Please use a different card.',
  incorrect_cvc: 'Your card\'s security code is incorrect. Please check and try again.',
  incorrect_number: 'Your card number is incorrect. Please check and try again.',
  insufficient_funds: 'Your card has insufficient funds. Please use a different payment method.',
  invalid_cvc: 'Your card\'s security code is invalid. Please check and try again.',
  invalid_expiry_month: 'Your card\'s expiration month is invalid.',
  invalid_expiry_year: 'Your card\'s expiration year is invalid.',
  invalid_number: 'Your card number is invalid. Please check and try again.',
  
  // Payment errors
  payment_intent_authentication_failure: 'Your card was declined. Please try a different payment method.',
  payment_intent_payment_attempt_failed: 'Payment failed. Please try again.',
  processing_error: 'An error occurred while processing your payment. Please try again.',
  
  // API errors
  api_connection_error: 'Unable to connect to payment service. Please check your internet connection and try again.',
  api_error: 'An error occurred with the payment service. Please try again later.',
  authentication_error: 'Authentication failed. Please try again.',
  rate_limit_error: 'Too many requests. Please wait a moment and try again.',
  
  // General errors
  invalid_request_error: 'Invalid request. Please check your information and try again.',
  idempotency_error: 'A payment with the same information was already processed.',
};

/**
 * Network error patterns that should trigger retry
 */
const RETRYABLE_ERROR_PATTERNS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'network',
  'timeout',
  'fetch failed',
  'NetworkError',
  'Failed to fetch',
];

/**
 * Check if an error is retryable (transient failure)
 */
export function isRetryableError(error: any): boolean {
  // Payment gateway errors that are not retryable
  if (error instanceof PaymentValidationError) {
    return false;
  }

  // Check error message for retryable patterns
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';
  
  return RETRYABLE_ERROR_PATTERNS.some(
    pattern => errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

/**
 * Get user-friendly error message from payment gateway error
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // If it's already a user-friendly message, return it
  if (error instanceof PaymentGatewayError && error.code) {
    const stripeCode = error.code.toLowerCase();
    
    // Check Stripe error messages
    if (STRIPE_ERROR_MESSAGES[stripeCode]) {
      return STRIPE_ERROR_MESSAGES[stripeCode];
    }
    
    // Check for Stripe error type pattern (e.g., "card_declined")
    for (const [code, message] of Object.entries(STRIPE_ERROR_MESSAGES)) {
      if (stripeCode.includes(code)) {
        return message;
      }
    }
  }

  // Check original error for Stripe error codes
  if (error?.type) {
    const stripeType = error.type.toLowerCase();
    if (STRIPE_ERROR_MESSAGES[stripeType]) {
      return STRIPE_ERROR_MESSAGES[stripeType];
    }
  }

  // Check error code in original error
  if (error?.code) {
    const code = error.code.toLowerCase();
    if (STRIPE_ERROR_MESSAGES[code]) {
      return STRIPE_ERROR_MESSAGES[code];
    }
  }

  // Default messages based on error type
  if (error instanceof PaymentValidationError) {
    return error.message || 'Please check your information and try again.';
  }

  if (error instanceof PaymentProcessingError) {
    return error.message || 'Payment processing failed. Please try again.';
  }

  if (error instanceof PaymentGatewayError) {
    return error.message || 'An error occurred while processing your payment. Please try again.';
  }

  // Network errors
  if (isRetryableError(error)) {
    return 'Connection error. Please check your internet connection and try again.';
  }

  // Generic fallback
  return error?.message || 'An unexpected error occurred. Please try again later.';
}

/**
 * Extract error code from payment gateway error
 */
export function extractErrorCode(error: any): string {
  if (error instanceof PaymentGatewayError && error.code) {
    return error.code;
  }

  if (error?.code) {
    return error.code;
  }

  if (error?.type) {
    return error.type;
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        break;
      }

      // Don't retry if status code is not retryable
      if (error?.statusCode && !finalConfig.retryableStatusCodes.includes(error.statusCode)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = finalConfig.retryDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
      
      console.warn(`⚠️ [DEBUG] Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`, {
        error: error.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Handle payment operation with comprehensive error handling
 */
export async function handlePaymentOperation<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await retryWithBackoff(operation, {
      maxRetries: 3,
      retryDelay: 1000,
    });
  } catch (error: any) {
    const userMessage = getUserFriendlyErrorMessage(error);
    const errorCode = extractErrorCode(error);

    console.error(`❌ [DEBUG] Payment operation failed: ${context}`, {
      error: error.message,
      code: errorCode,
      userMessage,
      originalError: error,
    });

    // Re-throw with user-friendly message
    if (error instanceof PaymentGatewayError) {
      throw new PaymentGatewayError(
        userMessage,
        errorCode,
        error.statusCode,
        error.originalError
      );
    }

    throw new PaymentGatewayError(userMessage, errorCode, 500, error);
  }
}

/**
 * Validate payment environment variables
 */
export function validatePaymentEnvironment(): void {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  ];

  const missing = requiredVars.filter(
    varName => !process.env[varName] && !process.env[varName.replace('NEXT_PUBLIC_', '')]
  );

  if (missing.length > 0) {
    throw new PaymentGatewayError(
      `Missing required environment variables: ${missing.join(', ')}`,
      'MISSING_CONFIG',
      500
    );
  }
}

/**
 * Create idempotency key for payment operations
 */
export function createIdempotencyKey(prefix: string, data: Record<string, any>): string {
  const dataString = JSON.stringify(data);
  // Simple hash function (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${prefix}_${Math.abs(hash)}_${Date.now()}`;
}

/**
 * Check if error is a validation error (should not retry)
 */
export function isValidationError(error: any): boolean {
  return (
    error instanceof PaymentValidationError ||
    error?.code === 'VALIDATION_ERROR' ||
    error?.statusCode === 400
  );
}

/**
 * Check if error is a payment processing error (may retry depending on type)
 */
export function isPaymentProcessingError(error: any): boolean {
  return (
    error instanceof PaymentProcessingError ||
    error?.code?.includes('PAYMENT') ||
    error?.code?.includes('CARD')
  );
}

