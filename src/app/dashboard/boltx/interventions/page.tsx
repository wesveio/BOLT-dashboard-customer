'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import { BoltIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@heroui/react';

export default function InterventionsPage() {
  const t = useTranslations('dashboard.boltx');

  return (
    <PlanGuard requiredPlan="enterprise">
      <PageWrapper>
        <PageHeader
          title={t('interventions.title')}
          description={t('interventions.description')}
          icon={BoltIcon}
        />

        <div className="mt-8">
          <Card className="border border-gray-100">
            <CardBody className="p-6">
              <p className="text-gray-600">
                Interventions dashboard will display active interventions, their effectiveness,
                and allow configuration of automatic discount offers and other interventions.
              </p>
            </CardBody>
          </Card>
        </div>
      </PageWrapper>
    </PlanGuard>
  );
}

