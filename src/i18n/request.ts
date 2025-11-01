import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // With localePrefix: 'never', the middleware rewrites to /[locale]/*
  // so requestLocale will contain the locale from the route segment
  let locale = await requestLocale;

  // Validate and fallback to default if needed
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
