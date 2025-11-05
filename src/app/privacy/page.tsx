'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn, staggerContainer } from '@/utils/animations';
import { AnimatedWrapper } from '@/components/Dashboard/AnimatedWrapper/AnimatedWrapper';
import { PublicHeader } from '@/components/Public/PublicHeader/PublicHeader';
import { PublicFooter } from '@/components/Public/PublicFooter/PublicFooter';

export default function PrivacyPage() {
  const t = useTranslations('public.privacy');

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
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('informationCollection.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('informationCollection.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>{t('informationCollection.items.personal')}</li>
                    <li>{t('informationCollection.items.usage')}</li>
                    <li>{t('informationCollection.items.device')}</li>
                    <li>{t('informationCollection.items.cookies')}</li>
                  </ul>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('dataUsage.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('dataUsage.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>{t('dataUsage.items.service')}</li>
                    <li>{t('dataUsage.items.communication')}</li>
                    <li>{t('dataUsage.items.improvement')}</li>
                    <li>{t('dataUsage.items.security')}</li>
                  </ul>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('dataProtection.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('dataProtection.content')}</p>
                  <p className="text-gray-700 mb-4">{t('dataProtection.measures')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('cookies.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('cookies.content')}</p>
                  <p className="text-gray-700 mb-4">{t('cookies.types')}</p>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('userRights.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('userRights.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>{t('userRights.items.access')}</li>
                    <li>{t('userRights.items.correction')}</li>
                    <li>{t('userRights.items.deletion')}</li>
                    <li>{t('userRights.items.objection')}</li>
                    <li>{t('userRights.items.portability')}</li>
                  </ul>
                </m.section>

                <m.section variants={fadeIn} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('thirdParty.title')}</h2>
                  <p className="text-gray-700 mb-4">{t('thirdParty.content')}</p>
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
                    <a href="mailto:privacy@bckstg.com" className="text-blue-600 hover:text-blue-700">
                      privacy@bckstg.com
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

