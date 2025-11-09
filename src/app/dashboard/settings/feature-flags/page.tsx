'use client';

import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { FeatureFlagsTab } from '@/components/Dashboard/AppSettings/FeatureFlagsTab';

export default function FeatureFlagsPage() {
  return (
    <PageWrapper>
      <PageHeader
        title="Feature Flags"
        subtitle="Manage application-level feature flags and settings"
      />
      <div className="mt-8">
        <FeatureFlagsTab />
      </div>
    </PageWrapper>
  );
}

