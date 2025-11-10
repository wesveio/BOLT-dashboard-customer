'use client';

import { lazy, Suspense } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const LanguageSwitcher = lazy(() => import('@/components/LanguageSwitcher').then(mod => ({ default: mod.LanguageSwitcher })));

interface PublicFooterProps {
  contactEmail?: string;
  contactPhone?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
}

export function PublicFooter({
  contactEmail = 'hello@bckstg.com',
  contactPhone,
  privacyPolicyUrl = '/privacy',
  termsUrl = '/terms',
}: PublicFooterProps) {
  const t = useTranslations('public.footer');
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Contact Section */}
          <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.contactUs')}</h3>
            <div className="space-y-3">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  aria-label={`Email us at ${contactEmail}`}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm md:text-base break-all">{contactEmail}</span>
                </a>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  aria-label={`Call us at ${contactPhone}`}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-sm md:text-base">{contactPhone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Legal Links Section */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.legal')}</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href={privacyPolicyUrl}
                className="text-sm md:text-base text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                {t('privacyPolicy')}
              </Link>
              <Link
                href={termsUrl}
                className="text-sm md:text-base text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                {t('termsAndConditions')}
              </Link>
            </nav>
          </div>

          {/* Security Badges Section */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sections.secureCheckout')}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-900">{t('badges.sslEncrypted')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-900">{t('badges.pciCompliant')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">{t('badges.safeCheckout')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-center md:text-left text-sm text-gray-600">
              © {new Date().getFullYear()} {t('copyright')}{' '}
              <span className="font-bold text-blue-600">{t('poweredBy')}</span>
            </p>
            <div className="flex items-center gap-2">
              <Suspense fallback={<div className="w-20 h-10 bg-gray-200 rounded animate-pulse" />}>
              <LanguageSwitcher />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

