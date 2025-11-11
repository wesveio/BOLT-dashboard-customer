'use client';

import { useState, useEffect } from 'react';
import { DashboardBuilder } from '@/components/Dashboard/Builder/DashboardBuilder';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { useApi, useApiPost } from '@/hooks/useApi';
import type { DashboardLayout } from '@/components/Dashboard/Builder/types';

export default function DashboardBuilderPage() {
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardLayout | null>(null);

  const { data, isLoading } = useApi<{ dashboards: DashboardLayout[] }>(
    '/api/dashboard/dashboards',
  );

  const { mutate: saveDashboard } = useApiPost<{ success: boolean; dashboard: DashboardLayout }, { action: string; dashboard: DashboardLayout }>();

  useEffect(() => {
    if (data?.dashboards) {
      if (data.dashboards.length > 0 && !selectedDashboard) {
        setSelectedDashboard(data.dashboards[0]);
      }
    }
  }, [data, selectedDashboard]);

  const handleSave = async (layout: DashboardLayout) => {
    const result = await saveDashboard(
      '/api/dashboard/dashboards',
      { action: 'save', dashboard: layout },
    );
    
    if (result) {
      // Refresh dashboards list
      window.location.reload();
    }
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

