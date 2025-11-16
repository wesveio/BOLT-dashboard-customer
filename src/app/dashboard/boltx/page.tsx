'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { Card, CardBody } from '@heroui/react';
import { fadeIn, slideIn } from '@/utils/animations';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import {
  CpuChipIcon,
  ChartBarIcon,
  LightBulbIcon,
  PaintBrushIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function BoltXPage() {
  const t = useTranslations('dashboard.boltx');

  const features = [
    {
      icon: ChartBarIcon,
      title: t('predictions.title'),
      description: t('predictions.description'),
      href: '/dashboard/boltx/predictions',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: BoltIcon,
      title: t('interventions.title'),
      description: t('interventions.description'),
      href: '/dashboard/boltx/interventions',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: LightBulbIcon,
      title: t('personalization.title'),
      description: t('personalization.description'),
      href: '/dashboard/boltx/personalization',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: PaintBrushIcon,
      title: t('optimization.title'),
      description: t('optimization.description'),
      href: '/dashboard/boltx/optimization',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <PlanGuard requiredPlan="enterprise">
      <PageWrapper>
        <PageHeader
          title={t('title')}
          description={t('description')}
          icon={CpuChipIcon}
        />

        <m.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mt-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.href} href={feature.href}>
                  <m.div
                    variants={slideIn}
                    custom={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                      <CardBody className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-foreground/70">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </m.div>
                </Link>
              );
            })}
          </div>
        </m.div>
      </PageWrapper>
    </PlanGuard>
  );
}

