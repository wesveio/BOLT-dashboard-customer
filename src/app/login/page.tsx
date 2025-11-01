'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion as m } from 'framer-motion';
import { Card, CardBody, Input, Button, Spinner } from '@heroui/react';
import { fadeIn } from '@/utils/animations';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const locale = useLocale();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/dashboard/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-locale': locale,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send code');
        return;
      }

      setCodeSent(true);
      setStep('code');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/dashboard/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('invalidCode'));
        return;
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setCode('');
    setError(null);
    await handleSendCode(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <m.div
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Card className="border border-gray-100 shadow-xl">
          <CardBody className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('title')}
              </h1>
              <p className="text-gray-600">{t('subtitle')}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-700 font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {codeSent && step === 'code' && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-green-700 font-semibold text-sm">
                  {t('codeSent')}
                </p>
              </div>
            )}

            {/* Email Step */}
            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-6">
                <Input
                  type="email"
                  label={t('emailLabel')}
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  variant="bordered"
                  size="lg"
                  isRequired
                  isDisabled={isLoading}
                  classNames={{
                    input: 'text-base',
                    label: 'text-sm font-semibold',
                  }}
                />

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full font-bold text-base py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  isLoading={isLoading}
                  spinner={<Spinner size="sm" />}
                >
                  {isLoading ? 'Loading...' : t('sendCode')}
                </Button>
              </form>
            )}

            {/* Code Verification Step */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <Input
                    type="text"
                    label={t('codeLabel')}
                    placeholder={t('codePlaceholder')}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    variant="bordered"
                    size="lg"
                    isRequired
                    isDisabled={isLoading}
                    maxLength={6}
                    classNames={{
                      input: 'text-base font-mono text-center text-2xl tracking-widest',
                      label: 'text-sm font-semibold',
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {t('codePlaceholder')}
                  </p>
                </div>

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full font-bold text-base py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  isLoading={isLoading}
                  spinner={<Spinner size="sm" />}
                  isDisabled={code.length !== 6}
                >
                  {isLoading ? 'Loading...' : t('verifyCode')}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50"
                  >
                    {t('resendCode')}
                  </button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Powered by <span className="font-bold text-blue-600">BOLT</span>
        </p>
      </m.div>
    </div>
  );
}

