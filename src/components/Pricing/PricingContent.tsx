'use client';

import { useApi } from '@/hooks/useApi';
import { Plan } from '@/utils/plans';
import { PublicPricingCard } from '@/components/Pricing/PublicPricingCard';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { useTranslations } from 'next-intl';
import { lazy, Suspense } from 'react';

const CACHE_KEY = 'pricing_plans';
const CACHE_TTL_MINUTES = 60 * 6;

interface PricingResponse {
  plans: Plan[];
}

const PlanComparisonLazy = lazy(() => 
  import('@/components/Dashboard/Plans/PlanComparison').then(mod => ({ default: mod.PlanComparison }))
);

export function PricingContent() {
  const t = useTranslations('public.pricing');
  const { data, isLoading, error, refetch } = useApi<PricingResponse>('/api/public/pricing', {
    cacheKey: CACHE_KEY,
    cacheTTL: CACHE_TTL_MINUTES,
    refetchOnMount: true,
  });

  const plans = data?.plans || [];

  return (
    <>
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

      {/* Comparison Table Section */}
      {plans.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 animate-fade-in-up">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {t('comparePlans.title')}
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {t('comparePlans.subtitle')}
                </p>
              </div>
              <Suspense fallback={<div className="py-20"><LoadingState message={t('loading.loadingPlans')} fullScreen={false} /></div>}>
                <PlanComparisonLazy plans={plans} />
              </Suspense>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

