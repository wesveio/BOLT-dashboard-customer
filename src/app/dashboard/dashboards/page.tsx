'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { useApi, useApiDelete } from '@/hooks/useApi';
import { Card, CardBody, Button } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { PlusIcon, PencilIcon, DocumentDuplicateIcon, TrashIcon, Squares2X2Icon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/utils/formatters';
import type { DashboardLayout } from '@/components/Dashboard/Builder/types';

export default function DashboardsPage() {
  const t = useTranslations('dashboard.dashboards');
  const tCommon = useTranslations('dashboard.common');
  const router = useRouter();
  const [deletingDashboard, setDeletingDashboard] = useState<string | null>(null);

  const { data, isLoading, refetch, clearCache } = useApi<{ dashboards: DashboardLayout[] }>(
    '/api/dashboard/dashboards',
    {
      cacheKey: 'dashboards',
      cacheTTL: 5,
    },
  );

  const { mutate: deleteDashboard, isLoading: isDeleting } = useApiDelete<{ success: boolean; message: string }>();

  const dashboards = data?.dashboards || [];

  const handleCreateNew = () => {
    router.push('/dashboard/dashboards/builder');
  };

  const handleEdit = (dashboardId: string) => {
    router.push(`/dashboard/dashboards/builder?id=${dashboardId}`);
  };

  const handleDuplicate = async (dashboard: DashboardLayout) => {
    try {
      const duplicatedDashboard: DashboardLayout = {
        ...dashboard,
        id: `dashboard_${Date.now()}`,
        name: `${dashboard.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/dashboard/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          dashboard: duplicatedDashboard,
        }),
      });

      if (response.ok) {
        toast.success(t('duplicateSuccess'));
        refetch();
      } else {
        const error = await response.json();
        throw new Error(error.error || t('duplicateError'));
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Duplicate dashboard error:', error);
      toast.error(error.message || t('duplicateError'));
    }
  };

  const handleDelete = async () => {
    if (!deletingDashboard) return;

    try {
      const result = await deleteDashboard(`/api/dashboard/dashboards/${deletingDashboard}`);
      
      if (result?.success) {
        toast.success(t('deleteSuccess'));
        // Clear cache and refetch
        clearCache();
        await refetch();
        setDeletingDashboard(null);
      } else {
        throw new Error('Failed to delete dashboard');
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Delete dashboard error:', error);
      toast.error(error.message || t('deleteError'));
      setDeletingDashboard(null);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Button
            color="primary"
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleCreateNew}
          >
            {t('createNew')}
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message={t('loading')} fullScreen={false} />
      ) : (
        <>
          {dashboards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((dashboard) => (
                <motion.div
                  key={dashboard.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="transform transition-transform hover:scale-105 active:scale-95"
                >
                  <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 flex flex-col h-full">
                    <CardBody className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Squares2X2Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{dashboard.name}</h3>
                          {dashboard.updatedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('updatedAt')} <span className="font-medium">{formatRelativeTime(dashboard.updatedAt)}</span>
                            </p>
                          )}
                          {dashboard.createdAt && dashboard.createdAt !== dashboard.updatedAt && (
                            <p className="text-xs text-gray-500">
                              {t('createdAt')} <span className="font-medium">{formatRelativeTime(dashboard.createdAt)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-gray-600">
                          {dashboard.widgets?.length || 0} {t('widgets')}
                        </span>
                        {dashboard.isPublic !== undefined && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              dashboard.isPublic
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {dashboard.isPublic ? (
                              <>
                                <GlobeAltIcon className="w-3 h-3 inline mr-1" />
                                Public
                              </>
                            ) : (
                              <>
                                <LockClosedIcon className="w-3 h-3 inline mr-1" />
                                Private
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Button
                          size="sm"
                          variant="flat"
                          className="flex-1"
                          startContent={<PencilIcon className="w-4 h-4" />}
                          onPress={() => handleEdit(dashboard.id)}
                        >
                          {t('edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => handleDuplicate(dashboard)}
                          title={tCommon('duplicate')}
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={() => setDeletingDashboard(dashboard.id)}
                          title={t('delete')}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Squares2X2Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('empty')}</h3>
              <p className="text-gray-600 mb-4">{t('emptyDescription')}</p>
              <Button
                color="primary"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={handleCreateNew}
              >
                {t('createNew')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation - Simple toast confirmation for now */}
      {deletingDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4">
            <CardBody className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('confirmDelete')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('deleteWarning')}</p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="light"
                  onPress={() => setDeletingDashboard(null)}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  color="danger"
                  isLoading={isDeleting}
                  disabled={isDeleting}
                  onPress={handleDelete}
                >
                  {isDeleting ? tCommon('deleting') || 'Deleting...' : t('delete')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}

