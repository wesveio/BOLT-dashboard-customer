'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardBuilder } from '@/components/Dashboard/Builder/DashboardBuilder';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { useApi, useApiPost } from '@/hooks/useApi';
import type { DashboardLayout } from '@/components/Dashboard/Builder/types';

export default function DashboardsPage() {
  const t = useTranslations('dashboard.boltmetrics.dashboards');
  const [dashboards, setDashboards] = useState<DashboardLayout[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardLayout | null>(null);

  const { data, isLoading } = useApi<{ dashboards: DashboardLayout[] }>(
    '/api/dashboard/boltmetrics/dashboards',
  );

  const { mutate: saveDashboard, isLoading: isSaving } = useApiPost(
    '/api/dashboard/boltmetrics/dashboards',
  );

  useEffect(() => {
    if (data?.dashboards) {
      setDashboards(data.dashboards);
      if (data.dashboards.length > 0 && !selectedDashboard) {
        setSelectedDashboard(data.dashboards[0]);
      }
    }
  }, [data, selectedDashboard]);

  const handleSave = (layout: DashboardLayout) => {
    saveDashboard(
      { action: 'save', dashboard: layout },
      {
        onSuccess: () => {
          // Refresh dashboards list
          window.location.reload();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <LoadingState fullScreen={true} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="h-screen flex flex-col">
        <DashboardBuilder
          initialLayout={selectedDashboard || undefined}
          onSave={handleSave}
        />
      </div>
    </PageWrapper>
  );
}

