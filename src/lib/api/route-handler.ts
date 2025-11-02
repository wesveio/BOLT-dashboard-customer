import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, AuthResult, AuthError } from './auth';
import { apiError, apiValidationError, apiInternalError } from './responses';

/**
 * Route handler function signature
 */
export type RouteHandler<TRequest = NextRequest> = (
  request: TRequest,
  context: AuthResult & { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Route handler with validation
 */
export type RouteHandlerWithValidation<TRequest = NextRequest, TBody = unknown> = (
  request: TRequest,
  context: AuthResult & { params?: Record<string, string>; body: TBody }
) => Promise<NextResponse>;

/**
 * Wrapper for routes that require authentication
 * Automatically extracts user and session, handles auth errors
 * 
 * @param handler - Route handler function
 * @returns Wrapped handler with automatic auth
 * 
 * @example
 * ```ts
 * export const GET = withAuth(async (request, { user, session }) => {
 *   return apiSuccess({ data: user });
 * });
 * ```
 */
export function withAuth<TParams extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<NextRequest>
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<TParams> | TParams }
  ): Promise<NextResponse> => {
    try {
      const authResult = await getAuthenticatedUser();
      
      // Handle params if provided
      const params = context?.params 
        ? (context.params instanceof Promise ? await context.params : context.params)
        : {};

      return await handler(request, { ...authResult, params });
    } catch (error) {
      if (error instanceof AuthError) {
        return apiError(error.message, error.status);
      }
      return apiInternalError(error);
    }
  };
}

/**
 * Wrapper for routes that require authentication and request body validation
 * Automatically validates request body with Zod schema
 * 
 * @param schema - Zod schema for request body validation
 * @param handler - Route handler function with validated body
 * @returns Wrapped handler with automatic auth and validation
 * 
 * @example
 * ```ts
 * const updateSchema = z.object({ name: z.string() });
 * 
 * export const PATCH = withAuthAndValidation(
 *   updateSchema,
 *   async (request, { user, body }) => {
 *     // body is validated and typed
 *     return apiSuccess({ updated: true });
 *   }
 * );
 * ```
 */
export function withAuthAndValidation<
  TSchema extends z.ZodType,
  TParams extends Record<string, string> = Record<string, string>
>(
  schema: TSchema,
  handler: RouteHandlerWithValidation<NextRequest, z.infer<TSchema>>
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<TParams> | TParams }
  ): Promise<NextResponse> => {
    try {
      // Authenticate first
      const authResult = await getAuthenticatedUser();
      
      // Parse and validate request body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return apiError('Invalid JSON in request body', 400);
      }

      const validationResult = schema.safeParse(body);
      if (!validationResult.success) {
        return apiValidationError(validationResult.error);
      }

      // Handle params if provided
      const params = context?.params 
        ? (context.params instanceof Promise ? await context.params : context.params)
        : {};

      return await handler(request, {
        ...authResult,
        params,
        body: validationResult.data,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return apiError(error.message, error.status);
      }
      return apiInternalError(error);
    }
  };
}

/**
 * Wrapper for routes that only require request body validation (no auth)
 * Useful for public endpoints like signup
 * 
 * @param schema - Zod schema for request body validation
 * @param handler - Route handler function with validated body
 * @returns Wrapped handler with automatic validation
 * 
 * @example
 * ```ts
 * const signupSchema = z.object({ email: z.string().email() });
 * 
 * export const POST = withValidation(
 *   signupSchema,
 *   async (request, { body }) => {
 *     // body is validated and typed
 *     return apiSuccess({ created: true });
 *   }
 * );
 * ```
 */
export function withValidation<TSchema extends z.ZodType>(
  schema: TSchema,
  handler: (request: NextRequest, context: { body: z.infer<TSchema> }) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Parse and validate request body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return apiError('Invalid JSON in request body', 400);
      }

      const validationResult = schema.safeParse(body);
      if (!validationResult.success) {
        return apiValidationError(validationResult.error);
      }

      return await handler(request, { body: validationResult.data });
    } catch (error) {
      return apiInternalError(error);
    }
  };
}

