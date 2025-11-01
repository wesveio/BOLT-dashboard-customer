'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import Link from 'next/link';
import { Button } from '@heroui/react';
import {
  CreditCardIcon,
  TruckIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const t = useTranslations('dashboard.analytics');

  const analyticsCategories = [
    {
      title: t('payment.title'),
      description: t('payment.subtitle'),
      icon: <CreditCardIcon className="w-8 h-8" />,
      href: '/dashboard/analytics/payment',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: t('shipping.title'),
      description: t('shipping.subtitle'),
      icon: <TruckIcon className="w-8 h-8" />,
      href: '/dashboard/analytics/shipping',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: t('devices.title'),
      description: t('devices.subtitle'),
      icon: <DevicePhoneMobileIcon className="w-8 h-8" />,
      href: '/dashboard/analytics/devices',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Browser & Platform',
      description: 'Performance metrics by browser and platform',
      icon: <GlobeAltIcon className="w-8 h-8" />,
      href: '/dashboard/analytics/browsers',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analyticsCategories.map((category) => (
          <Link key={category.href} href={category.href}>
            <m.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <ChartCard
                title={category.title}
                subtitle={category.description}
                className="h-full cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-white shadow-lg`}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <Button
                      color="primary"
                      variant="light"
                      className="font-semibold"
                    >
                      View Analytics →
                    </Button>
                  </div>
                </div>
              </ChartCard>
            </m.div>
          </Link>
        ))}
      </div>
    </m.div>
  );
}

