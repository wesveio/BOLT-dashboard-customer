'use client';

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

const CACHE_KEY = 'pricing_plans';
const CACHE_TTL_MINUTES = 60 * 6; // Cache for 6 hours

interface PricingResponse {
  plans: Plan[];
}

export default function PricingPage() {
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
                Simple, Transparent Pricing
              </m.h1>
              <m.p
                className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Choose the perfect plan for your business. All plans include our core checkout engine and can scale with you.
              </m.p>
            </m.div>
          </div>
        </m.section>

        {/* Pricing Cards Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <LoadingState message="Loading pricing plans..." fullScreen={false} className="py-20" />
            ) : error ? (
              <ErrorState
                message="Failed to load pricing plans. Please try again."
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
                    Compare Plans
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    See what's included in each plan and choose what works best for your needs.
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
              Ready to Get Started?
            </m.h2>
            <m.p
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Start your free trial today. No credit card required.
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
                Start Free Trial
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

