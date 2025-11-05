'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn, staggerContainer } from '@/utils/animations';
import { AnimatedWrapper } from '@/components/Dashboard/AnimatedWrapper/AnimatedWrapper';
import { PublicPricingCard } from '@/components/Pricing/PublicPricingCard';
import { PlanComparison } from '@/components/Dashboard/Plans/PlanComparison';
import { Plan } from '@/utils/plans';
import { useApi } from '@/hooks/useApi';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { PublicHeader } from '@/components/Public/PublicHeader/PublicHeader';
import { PublicFooter } from '@/components/Public/PublicFooter/PublicFooter';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  BoltIcon,
  PaintBrushIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

const CACHE_KEY = 'pricing_plans';
const CACHE_TTL_MINUTES = 60 * 6; // Cache for 6 hours

interface PricingResponse {
  plans: Plan[];
}

export default function PricingPage() {
  const t = useTranslations('public.pricing');
  const { data, isLoading, error, refetch } = useApi<PricingResponse>('/api/public/pricing', {
    cacheKey: CACHE_KEY,
    cacheTTL: CACHE_TTL_MINUTES,
    refetchOnMount: true,
  });

  const plans = data?.plans || [];

  return (
    <AnimatedWrapper>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PublicHeader />
        <main className="flex-1">
          {/* Hero Section */}
        <m.section
          className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 md:py-32"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <m.div className="max-w-4xl mx-auto text-center" variants={fadeIn}>
              <m.h1
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t('hero.title')}
              </m.h1>
              <m.p
                className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t('hero.subtitle')}
              </m.p>
            </m.div>
          </div>
        </m.section>

        {/* Pricing Cards Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <LoadingState message={t('loading.loadingPlans')} fullScreen={false} className="py-20" />
            ) : error ? (
              <ErrorState
                message={t('loading.failedToLoad')}
                onRetry={refetch}
                className="my-20"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {plans.map((plan) => (
                  <PublicPricingCard
                    key={plan.id}
                    plan={plan}
                    isPopular={plan.code === 'professional'}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Dashboard Features Showcase */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <m.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('dashboardFeatures.title')}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('dashboardFeatures.subtitle')}
              </p>
            </m.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {[
                {
                  icon: <ChartBarIcon className="w-6 h-6" />,
                  title: t('dashboardFeatures.overview.title'),
                  description: t('dashboardFeatures.overview.description'),
                },
                {
                  icon: <BoltIcon className="w-6 h-6" />,
                  title: t('dashboardFeatures.performance.title'),
                  description: t('dashboardFeatures.performance.description'),
                },
                {
                  icon: <CurrencyDollarIcon className="w-6 h-6" />,
                  title: t('dashboardFeatures.revenue.title'),
                  description: t('dashboardFeatures.revenue.description'),
                },
                {
                  icon: <ChartBarIcon className="w-6 h-6" />,
                  title: t('dashboardFeatures.analytics.title'),
                  description: t('dashboardFeatures.analytics.description'),
                },
                {
                  icon: <PaintBrushIcon className="w-6 h-6" />,
                  title: t('dashboardFeatures.themes.title'),
                  description: t('dashboardFeatures.themes.description'),
                },
                {
                  icon: <LightBulbIcon className="w-6 h-6" />,
                  title: t('dashboardFeatures.insights.title'),
                  description: t('dashboardFeatures.insights.description'),
                },
              ].map((feature, index) => (
                <m.div
                  key={feature.title}
                  className="bg-white rounded-xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </m.div>
              ))}
            </div>

            <m.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-sm text-gray-500">{t('dashboardFeatures.included')}</p>
            </m.div>
          </div>
        </section>

        {/* Comparison Table Section */}
        {plans.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <m.div
                  className="text-center mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {t('comparePlans.title')}
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    {t('comparePlans.subtitle')}
                  </p>
                </m.div>
                <PlanComparison plans={plans} />
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <m.section
          className="py-20 bg-gradient-to-r from-blue-600 to-purple-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <m.h2
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {t('cta.title')}
            </m.h2>
            <m.p
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {t('cta.description')}
            </m.p>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <a
                href="/login"
                className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {t('cta.startFreeTrial')}
              </a>
            </m.div>
          </div>
        </m.section>
        </main>
        <PublicFooter />
      </div>
    </AnimatedWrapper>
  );
}

