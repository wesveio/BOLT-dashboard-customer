import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Create a success response
 * 
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with JSON data
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create an error response
 * 
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @param details - Additional error details
 * @returns NextResponse with error JSON
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  const response: { error: string; details?: unknown } = { error: message };
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create a validation error response from Zod error
 * 
 * @param zodError - Zod validation error
 * @returns NextResponse with validation error details
 */
export function apiValidationError(zodError: z.ZodError): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation error',
      details: zodError.issues,
    },
    { status: 400 }
  );
}

/**
 * Create an unauthorized (401) error response
 * 
 * @param message - Error message (default: 'Not authenticated')
 * @returns NextResponse with 401 status
 */
export function apiUnauthorized(message: string = 'Not authenticated'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create a not found (404) error response
 * 
 * @param message - Error message (default: 'Resource not found')
 * @returns NextResponse with 404 status
 */
export function apiNotFound(message: string = 'Resource not found'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Create an internal server error (500) response
 * 
 * @param error - Error object or message
 * @returns NextResponse with 500 status
 */
export function apiInternalError(error?: unknown): NextResponse {
  if (error instanceof Error) {
    console.error('Internal server error:', error);
  } else if (error) {
    console.error('Internal server error:', error);
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Create a too many requests (429) error response
 * 
 * @param message - Error message (default: 'Too many requests')
 * @returns NextResponse with 429 status
 */
export function apiTooManyRequests(message: string = 'Too many requests'): NextResponse {
  return NextResponse.json({ error: message }, { status: 429 });
}

