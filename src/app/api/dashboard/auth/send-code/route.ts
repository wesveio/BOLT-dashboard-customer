import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateAccessCode, hashCode } from '@/utils/auth/code-generator';
import { getEmailService, generateAccessCodeEmail } from '@/utils/auth/email-service';
import { headers } from 'next/headers';

const sendCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/dashboard/auth/send-code
 * Send access code to user's email (passwordless auth)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = sendCodeSchema.parse(body);

    // Get client IP for rate limiting and locale from middleware
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const locale = headersList.get('x-locale') || 'en';

    const supabaseAdmin = getSupabaseAdmin();

    // Check rate limit (max 3 codes per hour per email)
    const { data: recentCodes } = await supabaseAdmin
      .from('auth_codes')
      .select('created_at')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentCodes && recentCodes.length >= 3) {
      const oldestCode = recentCodes[recentCodes.length - 1];
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (new Date(oldestCode.created_at) > oneHourAgo) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Generate access code
    const code = generateAccessCode();
    const codeHash = hashCode(code);

    // Set expiration (10 minutes)
    const expirationMinutes = parseInt(
      process.env.AUTH_CODE_EXPIRATION_MINUTES || '10',
      10
    );
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Store hashed code in database
    const [codeSalt, codeHashValue] = codeHash.split(':');
    
    const { error: dbError } = await supabaseAdmin
      .from('auth_codes')
      .insert({
        email: email.toLowerCase(),
        code_hash: codeHashValue,
        code_salt: codeSalt,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to store access code' },
        { status: 500 }
      );
    }

    // Send email with code
    try {
      const emailService = getEmailService();
      const { html, text } = generateAccessCodeEmail(code, locale);

      await emailService.sendEmail({
        to: email,
        subject: locale === 'pt-BR' 
          ? 'Seu Código de Acesso do Dashboard BOLT'
          : locale === 'es'
          ? 'Su Código de Acceso del Dashboard BOLT'
          : 'Your BOLT Dashboard Access Code',
        html,
        text,
      });
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Don't expose email errors to client
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Access code sent to your email',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

