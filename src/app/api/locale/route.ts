import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';

/**
 * POST /api/locale
 * Set locale cookie for user preference
 */
export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json();

    // Validate locale
    if (!locale || !routing.locales.includes(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      httpOnly: false, // Allow client-side access
    });

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error('Locale update error:', error);
    return NextResponse.json(
      { error: 'Failed to update locale' },
      { status: 500 }
    );
  }
}

