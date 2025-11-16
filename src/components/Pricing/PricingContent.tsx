'use client';

import { PUBLIC_PRICING_PLANS } from '@/utils/plans';
import { PublicPricingCard } from '@/components/Pricing/PublicPricingCard';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { useTranslations } from 'next-intl';
import { lazy, Suspense } from 'react';

const PlanComparisonLazy = lazy(() => 
  import('@/components/Dashboard/Plans/PlanComparison').then(mod => ({ default: mod.PlanComparison }))
);

export function PricingContent() {
  const t = useTranslations('public.pricing');
  const plans = PUBLIC_PRICING_PLANS;

  return (
    <>
      {/* Pricing Cards Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <PublicPricingCard
                key={plan.id}
                plan={plan}
                isPopular={plan.code === 'professional'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 bg-default-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t('comparePlans.title')}
              </h2>
              <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                {t('comparePlans.subtitle')}
              </p>
            </div>
            <Suspense fallback={<div className="py-20"><LoadingState message={t('loading.loadingPlans')} fullScreen={false} /></div>}>
              <PlanComparisonLazy plans={plans} />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
}

