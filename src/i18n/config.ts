import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { routing } from './routing';
import { defaultLocale } from './constants';

export default getRequestConfig(async () => {
  // Locale is now managed via cookie/header, not route segment
  // Get locale from cookie or header
  const cookieStore = await cookies();
  const headersList = await headers();
  
  let locale = cookieStore.get('NEXT_LOCALE')?.value || 
               headersList.get('x-locale') || 
               routing.defaultLocale;

  // Validate and fallback to default if needed
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

