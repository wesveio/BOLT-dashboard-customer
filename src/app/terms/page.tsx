'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn, staggerContainer } from '@/utils/animations';
import { AnimatedWrapper } from '@/components/Dashboard/AnimatedWrapper/AnimatedWrapper';
import { PublicHeader } from '@/components/Public/PublicHeader/PublicHeader';
import { PublicFooter } from '@/components/Public/PublicFooter/PublicFooter';

export default function TermsPage() {
  const t = useTranslations('public.terms');

  return (
    <AnimatedWrapper>
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1">
          <m.article
            className="py-12 md:py-20 bg-white"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
              {/* Header */}
              <m.header
                className="mb-12"
                variants={fadeIn}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {t('title')}
                </h1>
                <p className="text-lg text-gray-600">
                  {t('lastUpdated')}: {t('lastUpdatedDate')}
                </p>
              </m.header>

              {/* Content Sections */}
              <div className="prose prose-lg max-w-none">
                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('introduction.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('introduction.content')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('acceptance.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('acceptance.content')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('serviceDescription.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('serviceDescription.content')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('userAccounts.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('userAccounts.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>{t('userAccounts.items.accountability')}</li>
                    <li>{t('userAccounts.items.security')}</li>
                    <li>{t('userAccounts.items.notification')}</li>
                  </ul>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('userObligations.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('userObligations.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>{t('userObligations.items.lawful')}</li>
                    <li>{t('userObligations.items.prohibited')}</li>
                    <li>{t('userObligations.items.accuracy')}</li>
                  </ul>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('intellectualProperty.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('intellectualProperty.content')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('paymentTerms.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('paymentTerms.content')}</p>
                  <p className="text-gray-700 mb-4">{t('paymentTerms.refunds')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('limitationLiability.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('limitationLiability.content')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termination.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('termination.content')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('disputeResolution.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('disputeResolution.content')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('changes.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('changes.content')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('contact.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('contact.content')}</p>
                  <p className="text-gray-700">
                    <strong>{t('contact.email')}:</strong>{' '}
                    <a href="mailto:legal@bckstg.com" className="text-blue-600 hover:text-blue-700">
                      legal@bckstg.com
                    </a>
                  </p>
                </m.section>
              </div>
            </div>
          </m.article>
        </main>
        <PublicFooter privacyPolicyUrl="/privacy" termsUrl="/terms" />
      </div>
    </AnimatedWrapper>
  );
}

