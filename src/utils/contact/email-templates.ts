/**
 * Email templates for contact form submissions
 * Supports multiple languages and both notification and confirmation emails
 */

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  wantsDemo: boolean;
  source?: string;
}

export function generateContactEmail(
  data: ContactFormData,
  locale: string = 'en',
  isConfirmation: boolean = false,
  source?: string
): { html: string; text: string; subject: string } {
  const translations: Record<string, {
    notification: {
      subject: string;
      greeting: string;
      title: string;
      intro: string;
      fields: {
        name: string;
        email: string;
        company: string;
        phone: string;
        message: string;
        wantsDemo: string;
      };
      footer: string;
    };
    confirmation: {
      subject: string;
      greeting: string;
      title: string;
      message: string;
      footer: string;
    };
  }> = {
    en: {
      notification: {
        subject: '📧 New Contact Form Submission - BOLT',
        greeting: 'Hello Team,',
        title: 'New Contact Form Submission',
        intro: 'You have received a new contact form submission:',
        fields: {
          name: 'Name',
          email: 'Email',
          company: 'Company',
          phone: 'Phone',
          message: 'Message',
          wantsDemo: 'Wants Demo',
        },
        footer: 'Please respond to this inquiry as soon as possible.',
      },
      confirmation: {
        subject: '✅ We received your message - BOLT',
        greeting: `Hello ${data.name},`,
        title: 'We received your message!',
        message: 'Thank you for contacting us. We have received your message and will get back to you as soon as possible. Our team typically responds within 24 hours.',
        footer: 'If you have any urgent questions, please feel free to reach out to us directly at hello@bckstg.com',
      },
    },
    'pt-BR': {
      notification: {
        subject: '📧 Novo Contato do Formulário - BOLT',
        greeting: 'Olá Equipe,',
        title: 'Nova Submissão do Formulário de Contato',
        intro: 'Você recebeu uma nova submissão do formulário de contato:',
        fields: {
          name: 'Nome',
          email: 'Email',
          company: 'Empresa',
          phone: 'Telefone',
          message: 'Mensagem',
          wantsDemo: 'Quer Demo',
        },
        footer: 'Por favor, responda a esta consulta o mais rápido possível.',
      },
      confirmation: {
        subject: '✅ Recebemos sua mensagem - BOLT',
        greeting: `Olá ${data.name},`,
        title: 'Recebemos sua mensagem!',
        message: 'Obrigado por entrar em contato conosco. Recebemos sua mensagem e entraremos em contato o mais breve possível. Nossa equipe geralmente responde em até 24 horas.',
        footer: 'Se você tiver alguma dúvida urgente, sinta-se à vontade para nos contatar diretamente em hello@bckstg.com',
      },
    },
    es: {
      notification: {
        subject: '📧 Nuevo Contacto del Formulario - BOLT',
        greeting: 'Hola Equipo,',
        title: 'Nueva Solicitud del Formulario de Contacto',
        intro: 'Has recibido una nueva solicitud del formulario de contacto:',
        fields: {
          name: 'Nombre',
          email: 'Email',
          company: 'Empresa',
          phone: 'Teléfono',
          message: 'Mensaje',
          wantsDemo: 'Quiere Demo',
        },
        footer: 'Por favor, responde a esta consulta lo antes posible.',
      },
      confirmation: {
        subject: '✅ Recibimos tu mensaje - BOLT',
        greeting: `Hola ${data.name},`,
        title: '¡Recibimos tu mensaje!',
        message: 'Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos lo antes posible. Nuestro equipo generalmente responde en 24 horas.',
        footer: 'Si tienes alguna pregunta urgente, no dudes en contactarnos directamente en hello@bckstg.com',
      },
    },
  };

  const t = translations[locale] || translations.en;

  // SVG Logo (same as other email templates)
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

  if (isConfirmation) {
    // Confirmation email template
    const confirmationContent = t.confirmation;
    const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${confirmationContent.subject}</title>
  <style>
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
      ${confirmationContent.greeting}
    </h1>
    
    <!-- Title -->
    <p class="email-text" style="font-size: 18px; font-weight: 600; color: #374151; margin: 0 0 24px 0; text-align: center; line-height: 1.4;">
      ${confirmationContent.title}
    </p>
    
    <!-- Message -->
    <p class="email-text" style="font-size: 16px; color: #4b5563; margin: 0 0 32px 0; text-align: center; line-height: 1.6;">
      ${confirmationContent.message}
    </p>
    
    ${data.wantsDemo ? `
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
      <p style="font-size: 14px; color: #0369a1; margin: 0; font-weight: 600;">
        💡 Demo Request: We'll contact you soon to schedule your demo!
      </p>
    </div>
    ` : ''}
    
    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <!-- Footer -->
    <p class="footer-text" style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.5;">
      ${confirmationContent.footer}
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
${confirmationContent.greeting}

${confirmationContent.title}

${confirmationContent.message}

${data.wantsDemo ? '\n💡 Demo Request: We\'ll contact you soon to schedule your demo!' : ''}

${confirmationContent.footer}

---
Powered by BCKSTG
    `.trim();

    return { html, text, subject: confirmationContent.subject };
  }

  // Notification email template (to company)
  const notificationContent = t.notification;
  // Add Enterprise suffix to subject if source is enterprise (only for notification emails)
  const notificationSubject = source === 'enterprise' 
    ? `${notificationContent.subject} [🟢 Enterprise]`
    : notificationContent.subject;
  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${notificationContent.subject}</title>
  <style>
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
      .field-label {
        color: #94a3b8 !important;
      }
      .field-value {
        color: #f1f5f9 !important;
      }
      .info-box {
        background-color: #1e293b !important;
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
      ${notificationContent.greeting}
    </h1>
    
    <!-- Title -->
    <p class="email-text" style="font-size: 18px; font-weight: 600; color: #374151; margin: 0 0 8px 0; text-align: center; line-height: 1.4;">
      ${notificationContent.title}
    </p>
    
    <!-- Intro -->
    <p class="email-text" style="font-size: 16px; color: #4b5563; margin: 0 0 32px 0; text-align: center; line-height: 1.6;">
      ${notificationContent.intro}
    </p>
    
    <!-- Contact Information -->
    <div class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <div style="margin-bottom: 16px;">
        <p class="field-label" style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${notificationContent.fields.name}
        </p>
        <p class="field-value" style="font-size: 16px; color: #111827; margin: 0; font-weight: 600;">
          ${data.name}
        </p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <p class="field-label" style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${notificationContent.fields.email}
        </p>
        <p class="field-value" style="font-size: 16px; color: #111827; margin: 0;">
          <a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a>
        </p>
      </div>
      
      ${data.company ? `
      <div style="margin-bottom: 16px;">
        <p class="field-label" style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${notificationContent.fields.company}
        </p>
        <p class="field-value" style="font-size: 16px; color: #111827; margin: 0;">
          ${data.company}
        </p>
      </div>
      ` : ''}
      
      ${data.phone ? `
      <div style="margin-bottom: 16px;">
        <p class="field-label" style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${notificationContent.fields.phone}
        </p>
        <p class="field-value" style="font-size: 16px; color: #111827; margin: 0;">
          <a href="tel:${data.phone}" style="color: #2563eb; text-decoration: none;">${data.phone}</a>
        </p>
      </div>
      ` : ''}
      
      <div style="margin-bottom: 16px;">
        <p class="field-label" style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${notificationContent.fields.message}
        </p>
        <p class="field-value" style="font-size: 16px; color: #111827; margin: 0; white-space: pre-wrap; line-height: 1.6;">
          ${data.message}
        </p>
      </div>
      
      ${data.wantsDemo ? `
      <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-top: 16px;">
        <p style="font-size: 14px; color: #92400e; margin: 0; font-weight: 600;">
          ⭐ ${notificationContent.fields.wantsDemo}: YES
        </p>
      </div>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <p class="footer-text" style="font-size: 12px; color: #9ca3af; margin: 24px 0 0 0; text-align: center; line-height: 1.5;">
      ${notificationContent.footer}
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
${notificationContent.greeting}

${notificationContent.title}

${notificationContent.intro}

${notificationContent.fields.name}: ${data.name}
${notificationContent.fields.email}: ${data.email}
${data.company ? `${notificationContent.fields.company}: ${data.company}` : ''}
${data.phone ? `${notificationContent.fields.phone}: ${data.phone}` : ''}
${notificationContent.fields.message}:
${data.message}

${data.wantsDemo ? `⭐ ${notificationContent.fields.wantsDemo}: YES` : ''}

${notificationContent.footer}

---
Powered by BCKSTG
  `.trim();

  return { html, text, subject: notificationSubject };
}

