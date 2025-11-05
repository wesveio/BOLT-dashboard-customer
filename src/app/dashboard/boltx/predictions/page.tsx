'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@heroui/react';

export default function PredictionsPage() {
  const t = useTranslations('dashboard.boltx');

  return (
    <PlanGuard requiredPlan="enterprise">
      <PageWrapper>
        <PageHeader
          title={t('predictions.title')}
          description={t('predictions.description')}
          icon={ChartBarIcon}
        />

        <div className="mt-8">
          <Card className="border border-gray-100">
            <CardBody className="p-6">
              <p className="text-gray-600">
                Predictions dashboard will display real-time abandonment risk scores,
                prediction history, and model performance metrics.
              </p>
            </CardBody>
          </Card>
        </div>
      </PageWrapper>
    </PlanGuard>
  );
}

