'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function CTAButton() {
  const router = useRouter();
  const t = useTranslations('public.home');

  return (
    <button
      onClick={() => router.push('/dashboard')}
      className="bg-background text-primary px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border border-default hover:border-primary/20"
    >
      {t('cta.accessDashboard')}
    </button>
  );
}

