'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input, Button } from '@heroui/react';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common.errors');
  const tButtons = useTranslations('common.buttons');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStep('code');
      } else {
        const data = await response.json();
        setError(data.error || tCommon('generic'));
      }
    } catch (err) {
      setError(tCommon('network'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || t('invalidCode'));
      }
    } catch (err) {
      setError(tCommon('network'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600 mb-6">{t('subtitle')}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <Input
                type="email"
                label={t('emailLabel')}
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="bordered"
                size="lg"
                isRequired
              />
              <Button
                onClick={handleSendCode}
                isLoading={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                size="lg"
              >
                {t('sendCode')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="text"
                label={t('codeLabel')}
                placeholder={t('codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                variant="bordered"
                size="lg"
                maxLength={6}
                isRequired
              />
              <Button
                onClick={handleVerifyCode}
                isLoading={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                size="lg"
              >
                {t('verifyCode')}
              </Button>
              <Button
                variant="light"
                onClick={() => setStep('email')}
                className="w-full"
                size="sm"
              >
                {tButtons('back')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

