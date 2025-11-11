'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardBuilder } from '@/components/Dashboard/Builder/DashboardBuilder';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { useApi, useApiPost, useApiPatch } from '@/hooks/useApi';
import { toast } from 'sonner';
import type { DashboardLayout } from '@/components/Dashboard/Builder/types';

export default function DashboardBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dashboardId = searchParams.get('id');
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardLayout | null>(null);

  // Load specific dashboard if ID is provided
  const { data: dashboardData, isLoading: isLoadingDashboard } = useApi<{ dashboard: DashboardLayout }>(
    dashboardId ? `/api/dashboard/dashboards/${dashboardId}` : '',
    {
      enabled: !!dashboardId,
    }
  );

  // Load all dashboards if no ID (for new dashboard)
  const { data: dashboardsData, isLoading: isLoadingDashboards } = useApi<{ dashboards: DashboardLayout[] }>(
    !dashboardId ? '/api/dashboard/dashboards' : '',
    {
      enabled: !dashboardId,
    }
  );

  const { mutate: createDashboard, isLoading: isCreating } = useApiPost<
    { success: boolean; dashboard: DashboardLayout },
    { name: string; description?: string; isPublic?: boolean; layout: any }
  >();

  const { mutate: updateDashboard, isLoading: isUpdating } = useApiPatch<
    { success: boolean; dashboard: DashboardLayout },
    { name?: string; description?: string; isPublic?: boolean; layout?: any }
  >();

  useEffect(() => {
    if (dashboardId && dashboardData?.dashboard) {
      setSelectedDashboard(dashboardData.dashboard);
    } else if (!dashboardId && dashboardsData?.dashboards && dashboardsData.dashboards.length > 0 && !selectedDashboard) {
      // For new dashboard, don't auto-select
      setSelectedDashboard(null);
    }
  }, [dashboardId, dashboardData, dashboardsData, selectedDashboard]);

  const handleSave = async (layout: DashboardLayout) => {
    try {
      // Check if this is a new dashboard or existing one
      // New dashboards have IDs starting with "dashboard_" (temporary) or no ID
      // Existing dashboards have UUIDs from the database
      const isNew = !layout.id || 
                   layout.id.startsWith('dashboard_') || 
                   !dashboardId;

      console.log('✅ [DEBUG] Saving dashboard:', {
        layoutId: layout.id,
        dashboardId,
        isNew,
        widgetsCount: layout.widgets.length,
      });

      if (isNew) {
        // Create new dashboard
        const result = await createDashboard('/api/dashboard/dashboards', {
          name: layout.name,
          description: layout.description,
          isPublic: layout.isPublic || false,
          layout: {
            widgets: layout.widgets,
            columns: layout.columns || 12,
          },
        });

        if (result?.dashboard) {
          toast.success('Dashboard created successfully');
          router.push(`/dashboard/dashboards/builder?id=${result.dashboard.id}`);
        }
      } else {
        // Update existing dashboard - use dashboardId from URL as source of truth
        const idToUse = dashboardId || layout.id;
        
        if (!idToUse) {
          throw new Error('Dashboard ID is required for update');
        }

        const result = await updateDashboard(`/api/dashboard/dashboards/${idToUse}`, {
          name: layout.name,
          description: layout.description,
          isPublic: layout.isPublic,
          layout: {
            widgets: layout.widgets,
            columns: layout.columns || 12,
          },
        });

        if (result?.dashboard) {
          toast.success('Dashboard saved successfully');
          setSelectedDashboard(result.dashboard);
        } else {
          throw new Error('Failed to update dashboard');
        }
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Error saving dashboard:', error);
      toast.error(error.message || 'Failed to save dashboard');
    }
  };

  const isLoading = isLoadingDashboard || isLoadingDashboards;

  if (isLoading) {
    return (
      <PageWrapper>
        <LoadingState fullScreen={true} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="flex flex-col">
      <DashboardBuilder
        initialLayout={selectedDashboard || undefined}
        onSave={handleSave}
        isSaving={isCreating || isUpdating}
      />
    </PageWrapper>
  );
}

