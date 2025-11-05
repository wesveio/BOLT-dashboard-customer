'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@heroui/react';

export default function OptimizationPage() {
  const t = useTranslations('dashboard.boltx');

  return (
    <PlanGuard requiredPlan="enterprise">
      <PageWrapper>
        <PageHeader
          title={t('optimization.title')}
          description={t('optimization.description')}
          icon={PaintBrushIcon}
        />

        <div className="mt-8">
          <Card className="border border-gray-100">
            <CardBody className="p-6">
              <p className="text-gray-600">
                Form optimization dashboard will display field performance metrics,
                optimization recommendations, and allow configuration of form field order and visibility.
              </p>
            </CardBody>
          </Card>
        </div>
      </PageWrapper>
    </PlanGuard>
  );
}

