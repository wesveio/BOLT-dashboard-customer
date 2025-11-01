import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/locale
 * Set locale preference in cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locale = body.locale;

    if (!locale || !['en', 'pt-BR', 'es'].includes(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
