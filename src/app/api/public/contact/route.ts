import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getEmailService } from '@/utils/auth/email-service';
import { generateContactEmail } from '@/utils/contact/email-templates';

const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Name contains invalid characters'),
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  company: z
    .string()
    .max(200, 'Company name is too long')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long'),
  wantsDemo: z.boolean().default(false),
});

// Simple in-memory rate limiting (for production, consider using Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests: number = 3, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Get client IP for rate limiting
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const locale = headersList.get('x-locale') || 'en';

    // Rate limiting: max 3 requests per 15 minutes per IP
    const rateLimitKey = `contact:${ipAddress}:${validatedData.email}`;
    if (!checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get email service
    const emailService = getEmailService();
    const contactEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_SERVICE_FROM || 'hello@bckstg.com';

    // Generate email templates
    const { html, text, subject } = generateContactEmail(validatedData, locale);

    // Send email to company
    try {
      await emailService.sendEmail({
        to: contactEmail,
        subject,
        html,
        text,
      });
    } catch (emailError) {
      console.error('❌ [DEBUG] Email service error:', emailError);
      // Don't expose email errors to client
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    // Optional: Send confirmation email to user
    if (validatedData.email) {
      try {
        const { html: confirmationHtml, text: confirmationText, subject: confirmationSubject } = 
          generateContactEmail(validatedData, locale, true);
        
        await emailService.sendEmail({
          to: validatedData.email,
          subject: confirmationSubject,
          html: confirmationHtml,
          text: confirmationText,
        });
      } catch (confirmationError) {
        // Log but don't fail the request if confirmation email fails
        console.warn('‼️ [DEBUG] Failed to send confirmation email:', confirmationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ [DEBUG] Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

