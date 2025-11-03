'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Button, Spinner } from '@heroui/react';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import {
  sanitizeEmail,
  sanitizeVTEXAccount,
  sanitizeText,
  sanitizeCompanyName,
} from '@/utils/auth/sanitize';

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function SignUpForm({ onSuccess, onSwitchToLogin }: SignUpFormProps) {
  const t = useTranslations('auth.signup');
  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    first_name: '',
    last_name: '',
    vtex_account: '',
    company_name: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof SignupInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
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
    const result = signupSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupInput, string>> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof SignupInput] = err.message;
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
      // Sanitize all inputs before sending
      const sanitizedData = {
        email: sanitizeEmail(formData.email),
        first_name: sanitizeText(formData.first_name, 100),
        last_name: sanitizeText(formData.last_name, 100),
        vtex_account: sanitizeVTEXAccount(formData.vtex_account),
        company_name: formData.company_name ? sanitizeCompanyName(formData.company_name) : undefined,
      };

      const response = await fetch('/api/dashboard/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('error.generic'));
        return;
      }

      setSuccess(true);
      
      // Call onSuccess callback after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);

    } catch (err) {
      setError(t('error.network'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-green-800 font-bold text-lg">{t('success.title')}</h3>
          </div>
          <p className="text-green-700 text-sm">{t('success.message')}</p>
        </div>
        
        {onSwitchToLogin && (
          <Button
            onClick={onSwitchToLogin}
            color="primary"
            size="lg"
            className="w-full font-bold text-base py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {t('success.loginButton')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <p className="text-red-700 font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* Email */}
      <Input
        type="email"
        label={t('emailLabel')}
        placeholder={t('emailPlaceholder')}
        value={formData.email}
        onChange={handleChange('email')}
        variant="bordered"
        size="lg"
        isRequired
        isDisabled={isLoading}
        isInvalid={!!errors.email}
        errorMessage={errors.email}
        classNames={{
          input: 'text-base',
          label: 'text-sm font-semibold',
        }}
      />

      {/* First Name */}
      <Input
        type="text"
        label={t('firstNameLabel')}
        placeholder={t('firstNamePlaceholder')}
        value={formData.first_name}
        onChange={handleChange('first_name')}
        variant="bordered"
        size="lg"
        isRequired
        isDisabled={isLoading}
        isInvalid={!!errors.first_name}
        errorMessage={errors.first_name}
        classNames={{
          input: 'text-base',
          label: 'text-sm font-semibold',
        }}
      />

      {/* Last Name */}
      <Input
        type="text"
        label={t('lastNameLabel')}
        placeholder={t('lastNamePlaceholder')}
        value={formData.last_name}
        onChange={handleChange('last_name')}
        variant="bordered"
        size="lg"
        isRequired
        isDisabled={isLoading}
        isInvalid={!!errors.last_name}
        errorMessage={errors.last_name}
        classNames={{
          input: 'text-base',
          label: 'text-sm font-semibold',
        }}
      />

      {/* VTEX Account */}
      <Input
        type="text"
        label={t('vtexAccountLabel')}
        placeholder={t('vtexAccountPlaceholder')}
        value={formData.vtex_account}
        onChange={(e) => {
          // Only allow alphanumeric, hyphens, and underscores
          const value = e.target.value.replace(/[^a-zA-Z0-9\-_]/g, '');
          setFormData((prev) => ({ ...prev, vtex_account: value }));
          if (errors.vtex_account) {
            setErrors((prev) => ({ ...prev, vtex_account: undefined }));
          }
        }}
        variant="bordered"
        size="lg"
        isRequired
        isDisabled={isLoading}
        isInvalid={!!errors.vtex_account}
        errorMessage={errors.vtex_account}
        classNames={{
          input: 'text-base',
          label: 'text-sm font-semibold',
        }}
        description={t('vtexAccountDescription')}
      />

      {/* Company Name (Optional) */}
      <Input
        type="text"
        label={t('companyNameLabel')}
        placeholder={t('companyNamePlaceholder')}
        value={formData.company_name}
        onChange={handleChange('company_name')}
        variant="bordered"
        size="lg"
        isDisabled={isLoading}
        isInvalid={!!errors.company_name}
        errorMessage={errors.company_name}
        classNames={{
          input: 'text-base',
          label: 'text-sm font-semibold',
        }}
        description={t('companyNameDescription')}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        color="primary"
        size="lg"
        className="w-full font-bold text-base py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        isLoading={isLoading}
        spinner={<Spinner size="sm" />}
      >
        {isLoading ? t('creating') : t('createAccount')}
      </Button>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {t('alreadyHaveAccount')}{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50"
            >
              {t('loginLink')}
            </button>
          </p>
        </div>
      )}
    </form>
  );
}

