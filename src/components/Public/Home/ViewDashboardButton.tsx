'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function ViewDashboardButton() {
  const router = useRouter();
  const t = useTranslations('public.home');

  return (
    <button
      onClick={() => router.push('/dashboard')}
      className="btn-primary-enhanced group"
    >
      {t('viewDashboard')}
      <svg
        className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </button>
  );
}

