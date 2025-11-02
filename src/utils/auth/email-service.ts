/**
 * Email service for sending access codes
 * Supports multiple providers: Resend, SendGrid, AWS SES
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailService {
  sendEmail(options: SendEmailOptions): Promise<void>;
}

class ResendEmailService implements EmailService {
  private apiKey: string;
  private from: string;

  constructor() {
    this.apiKey = process.env.EMAIL_SERVICE_API_KEY || '';
    this.from = process.env.EMAIL_SERVICE_FROM || 'noreply@example.com';
  }

  async sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
    if (!this.apiKey) {
      throw new Error('EMAIL_SERVICE_API_KEY is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send email: ${error.message || response.statusText}`);
    }
  }
}

class SendGridEmailService implements EmailService {
  private apiKey: string;
  private from: string;

  constructor() {
    this.apiKey = process.env.EMAIL_SERVICE_API_KEY || '';
    this.from = process.env.EMAIL_SERVICE_FROM || 'noreply@example.com';
  }

  async sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
    if (!this.apiKey) {
      throw new Error('EMAIL_SERVICE_API_KEY is not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: this.from },
        personalizations: [
          {
            to: [{ email: to }],
            subject,
          },
        ],
        content: [
          {
            type: 'text/html',
            value: html,
          },
          ...(text
            ? [
              {
                type: 'text/plain',
                value: text,
              },
            ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error || response.statusText}`);
    }
  }
}

/**
 * Get email service instance based on provider configuration
 */
export function getEmailService(): EmailService {
  const provider = process.env.EMAIL_SERVICE_PROVIDER || 'resend';

  switch (provider.toLowerCase()) {
    case 'resend':
      return new ResendEmailService();
    case 'sendgrid':
      return new SendGridEmailService();
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

/**
 * Generate HTML email template for access code
 * Enhanced with engaging messages, Bolt logo, and light/dark theme support
 */
export function generateAccessCodeEmail(code: string, locale: string = 'en'): { html: string; text: string } {
  const translations: Record<string, {
    subject: string;
    greeting: string;
    welcome: string;
    message: string;
    codeLabel: string;
    expires: string;
    footer: string;
    securityNote: string;
  }> = {
    en: {
      subject: '🚀 Your BOLT Access Code',
      greeting: 'Hello! 👋',
      welcome: 'You\'re just one step away from accessing your dashboard!',
      message: 'We\'re excited to help you get started. Here\'s your secure access code:',
      codeLabel: 'Your Access Code',
      expires: '⚡ This code will expire in 10 minutes for your security.',
      footer: 'If you didn\'t request this code, you can safely ignore this email. Your account remains secure.',
      securityNote: '🔒 This is a one-time use code. Never share it with anyone.',
    },
    'pt-BR': {
      subject: '🚀 Seu Código de Acesso do BOLT',
      greeting: 'Olá! 👋',
      welcome: 'Você está a um passo de acessar seu dashboard!',
      message: 'Estamos animados em ajudá-lo a começar. Aqui está seu código de acesso seguro:',
      codeLabel: 'Seu Código de Acesso',
      expires: '⚡ Este código expirará em 10 minutos para sua segurança.',
      footer: 'Se você não solicitou este código, pode ignorar este email com segurança. Sua conta permanece segura.',
      securityNote: '🔒 Este é um código de uso único. Nunca compartilhe com ninguém.',
    },
    es: {
      subject: '🚀 Su Código de Acceso del BOLT',
      greeting: '¡Hola! 👋',
      welcome: '¡Estás a un paso de acceder a tu dashboard!',
      message: 'Estamos emocionados de ayudarte a comenzar. Aquí está tu código de acceso seguro:',
      codeLabel: 'Tu Código de Acceso',
      expires: '⚡ Este código expirará en 10 minutos por tu seguridad.',
      footer: 'Si no solicitaste este código, puedes ignorar este correo con seguridad. Tu cuenta permanece segura.',
      securityNote: '🔒 Este es un código de un solo uso. Nunca lo compartas con nadie.',
    },
  };

  const t = translations[locale] || translations.en;

  // SVG Logo - Using inline fill colors that adapt to dark mode via media queries
  // Note: Some email clients may not support CSS in SVG, so we provide fallback colors
  const boltLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 670 120" fill="none" style="width: 180px; height: auto; max-width: 100%;">
  <g transform="matrix(2.19 0 0 2.19 335 60)">
    <g transform="translate(-122.724,-0.108)">
      <path fill="#111827" style="fill: #111827;"
        d="M24.516-2.412c1.44-2.304 2.304-5.04 2.304-7.92 0-8.28-6.696-14.904-14.904-14.976H-30.636v50.616h45.792c8.568 0 15.48-6.912 15.48-15.408 0-5.04-2.448-9.504-6.12-12.312zm-44.856-12.744h32.256c2.592 0 4.752 2.16 4.752 4.824 0 2.592-2.16 4.752-4.752 4.752h-32.256zm35.496 30.312H-20.34v-10.584h35.136c2.952-.072 5.4 2.232 5.472 5.112.144 2.952-2.16 5.4-5.112 5.472z" />
    </g>
    <g transform="translate(-35.028,0.108)">
      <path fill="#111827" style="fill: #111827;"
        d="M28.836-25.308H-28.908C-42.876-25.308-54.18-14.004-54.18-.036s11.304 25.344 25.272 25.344H28.836C42.804 25.308 54.18 13.932 54.18-.036S42.804-25.308 28.836-25.308zm0 40.464H-28.908c-8.352 0-15.12-6.768-15.12-15.192 0-8.352 6.768-15.12 15.12-15.12H28.836c8.424 0 15.192 6.768 15.192 15.12 0 8.424-6.768 15.192-15.192 15.192z" />
    </g>
    <g transform="translate(54.828,-0.108)">
      <path fill="#111827" style="fill: #111827;" d="M30.636 15.156H-20.34v-40.464H-30.636v50.616H30.636z" />
    </g>
    <g transform="translate(119.52,-0.108)">
      <path fill="#111827" style="fill: #111827;" d="M33.804-15.156v-10.152H-33.876v10.152h29.232v40.464h10.296v-40.464z" />
    </g>
  </g>
</svg>`;

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${t.subject}</title>
  <style>
    /* Dark mode support for email clients */
    @media (prefers-color-scheme: dark) {
      .email-body {
        background-color: #0f172a !important;
        color: #f1f5f9 !important;
      }
      .email-container {
        background-color: #1e293b !important;
        border-color: #334155 !important;
      }
      .email-heading {
        color: #f1f5f9 !important;
      }
      .email-text {
        color: #cbd5e1 !important;
      }
      .email-subtitle {
        color: #94a3b8 !important;
      }
      .code-container {
        background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%) !important;
      }
      .security-note {
        background-color: #1e293b !important;
        border-color: #334155 !important;
        color: #cbd5e1 !important;
      }
      .divider {
        border-color: #334155 !important;
      }
      .footer-text {
        color: #64748b !important;
      }
      .logo-container svg path {
        fill: #FEFEFE !important;
      }
    }
  </style>
</head>
<body class="email-body" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; padding: 20px; margin: 0;">
  <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #e5e7eb;">
    
    <!-- Logo Section -->
    <div class="logo-container" style="text-align: center; margin-bottom: 32px;">
      ${boltLogoSvg}
    </div>
    
    <!-- Greeting -->
    <h1 class="email-heading" style="font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 12px 0; text-align: center; line-height: 1.2;">
      ${t.greeting}
    </h1>
    
    <!-- Welcome Message -->
    <p class="email-text" style="font-size: 18px; font-weight: 600; color: #374151; margin: 0 0 24px 0; text-align: center; line-height: 1.4;">
      ${t.welcome}
    </p>
    
    <!-- Main Message -->
    <p class="email-text" style="font-size: 16px; color: #4b5563; margin: 0 0 32px 0; text-align: center; line-height: 1.6;">
      ${t.message}
    </p>
    
    <!-- Access Code Container -->
    <div class="code-container" style="background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); border-radius: 16px; padding: 32px 24px; text-align: center; margin: 32px 0; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.3);">
      <p style="font-size: 13px; color: rgba(255, 255, 255, 0.95); margin: 0 0 12px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        ${t.codeLabel}
      </p>
      <p style="font-size: 42px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        ${code}
      </p>
    </div>
    
    <!-- Security Note -->
    <div class="security-note" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
      <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
        ${t.securityNote}
      </p>
    </div>
    
    <!-- Expiry Notice -->
    <p class="email-subtitle" style="font-size: 14px; color: #6b7280; margin: 24px 0 0 0; text-align: center; font-weight: 500;">
      ${t.expires}
    </p>
    
    <!-- Divider -->
    <hr class="divider" style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <!-- Footer -->
    <p class="footer-text" style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.5;">
      ${t.footer}
    </p>
    
    <!-- Brand Footer -->
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 11px; color: #d1d5db; margin: 0;">
        Powered by <span style="font-weight: 600; background: linear-gradient(to right, #2563eb, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BOLT</span>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${t.greeting}

${t.welcome}

${t.message}

${t.codeLabel}: ${code}

${t.securityNote}

${t.expires}

${t.footer}

---
Powered by BCKSTG
  `.trim();

  return { html, text };
}

