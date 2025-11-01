'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Card, CardBody, Input, Button, Spinner } from '@heroui/react';
import { SignUpForm } from '@/components/Auth/SignUpForm';

function LoginContent() {
  const t = useTranslations('auth.login');
  const tSignup = useTranslations('auth.signup');
  const router = useRouter();
  const locale = useLocale();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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

  const handleSignupSuccess = () => {
    // Switch to login mode after successful signup
    setMode('login');
    setError(null);
    // Optionally pre-fill email if available
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding & Benefits */}
      <m.div
        className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 lg:p-16 flex items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Welcome to BOLT Dashboard</h1>
            <p className="text-xl text-blue-100 mb-12">
              {mode === 'login' 
                ? 'Sign in to access your dashboard and manage your checkout analytics.'
                : 'Create your account and start tracking your checkout performance.'}
            </p>
          </m.div>

          {/* Benefits List */}
          <m.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ),
                title: 'Secure Authentication',
                description: 'Passwordless authentication with email codes',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ),
                title: 'Analytics Dashboard',
                description: 'Track your checkout performance and metrics',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                ),
                title: 'Easy to Use',
                description: 'Intuitive interface for smooth experience',
              },
            ].map((benefit, index) => (
              <m.div
                key={benefit.title}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                  <p className="text-blue-100">{benefit.description}</p>
                </div>
              </m.div>
            ))}
          </m.div>

          {/* Trust Badges */}
          <m.div
            className="mt-12 pt-12 border-t border-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>24/7 Support</span>
              </div>
            </div>
          </m.div>
        </div>
      </m.div>

      {/* Right Side - Login/Signup Form */}
      <m.div
        className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setStep('email');
                  setError(null);
                  setCodeSent(false);
                }}
                className={`px-6 py-2 rounded-md font-semibold text-sm transition-all ${
                  mode === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('title')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`px-6 py-2 rounded-md font-semibold text-sm transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tSignup('title')}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <m.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
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
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h2>
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
                        <p className="text-green-700 font-semibold text-sm">{t('codeSent')}</p>
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
              </m.div>
            ) : (
              <m.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
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
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{tSignup('title')}</h2>
                      <p className="text-gray-600">{tSignup('subtitle')}</p>
                    </div>

                    <SignUpForm onSuccess={handleSignupSuccess} onSwitchToLogin={() => setMode('login')} />
                  </CardBody>
                </Card>
              </m.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Powered by <span className="font-bold text-blue-600">BOLT</span>
          </p>
        </div>
      </m.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
