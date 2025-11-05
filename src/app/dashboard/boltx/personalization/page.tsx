'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { Card, CardBody } from '@heroui/react';

export default function PersonalizationPage() {
  const t = useTranslations('dashboard.boltx');

  return (
    <PlanGuard requiredPlan="enterprise">
      <PageWrapper>
        <PageHeader
          title={t('personalization.title')}
          description={t('personalization.description')}
          icon={LightBulbIcon}
        />

        <div className="mt-8">
          <Card className="border border-gray-100">
            <CardBody className="p-6">
              <p className="text-gray-600">
                Personalization dashboard will display user profiles, personalization configurations,
                and allow customization of checkout personalization rules.
              </p>
            </CardBody>
          </Card>
        </div>
      </PageWrapper>
    </PlanGuard>
  );
}

