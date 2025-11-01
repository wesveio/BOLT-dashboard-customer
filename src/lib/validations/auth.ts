import { z } from 'zod';

/**
 * Validation schemas for authentication
 */

/**
 * Schema for signup/sign-up
 */
export const signupSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'First name contains invalid characters'),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Last name contains invalid characters'),
  vtex_account: z
    .string()
    .min(3, 'VTEX Account must be at least 3 characters')
    .max(50, 'VTEX Account is too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'VTEX Account can only contain alphanumeric characters, hyphens, and underscores'),
  company_name: z
    .string()
    .max(200, 'Company name is too long')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for login (send code)
 */
export const sendCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Schema for verify code
 */
export const verifyCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

/**
 * Type inference from schemas
 */
export type SignupInput = z.infer<typeof signupSchema>;
export type SendCodeInput = z.infer<typeof sendCodeSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

