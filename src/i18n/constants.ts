/**
 * i18n constants that can be safely imported in client components
 * These are separated from config.ts to avoid importing next/headers in client components
 */

export const locales = ['en', 'pt-BR', 'es'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

