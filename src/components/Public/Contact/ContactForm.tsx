'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';

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

interface ContactFormState {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  wantsDemo: boolean;
  source?: string;
}

interface ContactFormProps {
  source?: string;
  onSuccess?: () => void;
}

export function ContactForm({ source: sourceProp, onSuccess }: ContactFormProps = {}) {
  const t = useTranslations('public.contact.form');
  const tMessages = useTranslations('public.contact.messages');
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<ContactFormState>({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    wantsDemo: false,
    source: sourceProp,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormState, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read sales parameter from URL and set source (only if source prop is not provided)
  useEffect(() => {
    if (sourceProp) {
      // If source is provided via prop, use it
      setFormData((prev) => ({ ...prev, source: sourceProp }));
    } else {
      // Otherwise, check URL params as fallback
      const salesParam = searchParams.get('sales');
      if (salesParam === 'enterprise') {
        setFormData((prev) => ({ ...prev, source: 'enterprise' }));
      }
    }
  }, [searchParams, sourceProp]);

  const handleChange = (field: keyof ContactFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    const result = contactSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormState, string>> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          const field = err.path[0] as keyof ContactFormState;
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tMessages('error.generic'));
        return;
      }

      setSuccess(true);
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        message: '',
        wantsDemo: false,
        source: sourceProp,
      });
      
      // Call onSuccess callback if provided (e.g., to close modal)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000); // Wait 2 seconds to show success message before closing
      } else {
        // Reset success message after 5 seconds (default behavior)
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      }

    } catch (err) {
      setError(tMessages('error.network'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-background rounded-xl p-8 border border-default shadow-lg text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{tMessages('success.title')}</h3>
        <p className="text-foreground/70">{tMessages('success.message')}</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl p-6 md:p-8 border border-default shadow-lg animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
            {t('name.label')} <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange('name')}
            className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground ${
              errors.name
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-default-300 focus:border-primary focus:ring-primary/20'
            } focus:outline-none focus:ring-2 transition-colors duration-200`}
            placeholder={t('name.placeholder')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-danger" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
            {t('email.label')} <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange('email')}
            className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground ${
              errors.email
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-default-300 focus:border-primary focus:ring-primary/20'
            } focus:outline-none focus:ring-2 transition-colors duration-200`}
            placeholder={t('email.placeholder')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-danger" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Company and Phone Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Field */}
          <div>
            <label htmlFor="company" className="block text-sm font-semibold text-foreground mb-2">
              {t('company.label')}
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange('company')}
              className="w-full px-4 py-3 rounded-lg border border-default-300 focus:border-primary focus:ring-primary/20 focus:outline-none focus:ring-2 transition-colors duration-200 bg-background text-foreground"
              placeholder={t('company.placeholder')}
            />
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-2">
              {t('phone.label')}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              className="w-full px-4 py-3 rounded-lg border border-default-300 focus:border-primary focus:ring-primary/20 focus:outline-none focus:ring-2 transition-colors duration-200 bg-background text-foreground"
              placeholder={t('phone.placeholder')}
            />
          </div>
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
            {t('message.label')} <span className="text-danger">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange('message')}
            rows={6}
            className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground ${
              errors.message
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-default-300 focus:border-primary focus:ring-primary/20'
            } focus:outline-none focus:ring-2 transition-colors duration-200 resize-none`}
            placeholder={t('message.placeholder')}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && (
            <p id="message-error" className="mt-1 text-sm text-danger" role="alert">
              {errors.message}
            </p>
          )}
        </div>

        {/* Demo Checkbox */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="wantsDemo"
            name="wantsDemo"
            checked={formData.wantsDemo}
            onChange={handleChange('wantsDemo')}
            className="mt-1 w-4 h-4 text-primary border-default-300 rounded focus:ring-primary/20 focus:ring-2"
          />
          <label htmlFor="wantsDemo" className="ml-3 text-sm text-foreground/80">
            {t('demo.label')}
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-4" role="alert">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-danger mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-danger">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" color="default" className="text-white" />
              <span>{t('submit.loading')}</span>
            </>
          ) : (
            <span>{t('submit.label')}</span>
          )}
        </button>
      </form>
    </div>
  );
}

