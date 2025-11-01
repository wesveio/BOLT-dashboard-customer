import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

export function middleware(request: NextRequest) {
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/_vercel') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get locale from cookie or Accept-Language header
  const cookieStore = request.cookies;
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  
  // Check Accept-Language header if no cookie
  let locale = localeCookie;
  if (!locale || !routing.locales.includes(locale as any)) {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const preferredLocales = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase());
      
      locale = routing.locales.find(loc => 
        preferredLocales.some(pref => pref.startsWith(loc.toLowerCase()))
      ) || routing.defaultLocale;
    } else {
      locale = routing.defaultLocale;
    }
  }

  // Ensure locale is valid
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Set locale in request headers for server components
  const response = NextResponse.next();
  response.headers.set('x-locale', locale);
  
  // Set cookie if not present
  if (!localeCookie || localeCookie !== locale) {
    response.cookies.set('NEXT_LOCALE', locale, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
  }

  return response;
}

export const config = {
  // Match all pathnames except API routes, static files, and Next.js internals
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ],
};
