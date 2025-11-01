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
 */
export function generateAccessCodeEmail(code: string, locale: string = 'en'): { html: string; text: string } {
  const translations: Record<string, { subject: string; greeting: string; message: string; codeLabel: string; expires: string; footer: string }> = {
    en: {
      subject: 'Your BOLT Dashboard Access Code',
      greeting: 'Hello!',
      message: 'Use this code to access your BOLT Dashboard:',
      codeLabel: 'Access Code',
      expires: 'This code will expire in 10 minutes.',
      footer: 'If you did not request this code, please ignore this email.',
    },
    'pt-BR': {
      subject: 'Seu Código de Acesso do Dashboard BOLT',
      greeting: 'Olá!',
      message: 'Use este código para acessar seu Dashboard BOLT:',
      codeLabel: 'Código de Acesso',
      expires: 'Este código expirará em 10 minutos.',
      footer: 'Se você não solicitou este código, ignore este email.',
    },
    es: {
      subject: 'Su Código de Acceso del Dashboard BOLT',
      greeting: '¡Hola!',
      message: 'Use este código para acceder a su Dashboard BOLT:',
      codeLabel: 'Código de Acceso',
      expires: 'Este código expirará en 10 minutos.',
      footer: 'Si no solicitó este código, ignore este correo.',
    },
  };

  const t = translations[locale] || translations.en;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; font-weight: bold; margin: 0; background: linear-gradient(to right, #2563eb, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        BOLT Dashboard
      </h1>
    </div>
    
    <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px;">
      ${t.greeting}
    </h2>
    
    <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
      ${t.message}
    </p>
    
    <div style="background: linear-gradient(to right, #2563eb, #9333ea); border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
      <p style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin: 0 0 8px 0; font-weight: 500;">
        ${t.codeLabel}
      </p>
      <p style="font-size: 36px; font-weight: bold; color: #ffffff; margin: 0; letter-spacing: 8px; font-family: monospace;">
        ${code}
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 24px; margin-bottom: 0;">
      ${t.expires}
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      ${t.footer}
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
${t.greeting}

${t.message}

${t.codeLabel}: ${code}

${t.expires}

${t.footer}
  `.trim();

  return { html, text };
}

