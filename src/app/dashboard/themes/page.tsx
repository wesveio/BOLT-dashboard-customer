'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { useApi } from '@/hooks/useApi';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { ThemeEditor } from '@/components/Dashboard/ThemeEditor/ThemeEditor';
import { RoleGuard } from '@/components/Dashboard/RoleGuard/RoleGuard';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { PlusIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

export default function ThemesPage() {
  const t = useTranslations('dashboard.themes');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const { data, isLoading, refetch } = useApi<{ themes: any[] }>('/api/dashboard/themes', {
    cacheKey: 'themes',
    cacheTTL: 5,
  });
  const themes = data?.themes || [];

  const handleActivateTheme = async (themeId: string) => {
    try {
      const response = await fetch(`/api/dashboard/themes/${themeId}`, {
        method: 'POST',
      });
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error('Activate theme error:', error);
    }
  };

  if (selectedTheme) {
    return (
      <ThemeEditor
        themeId={selectedTheme}
        onBack={() => setSelectedTheme(null)}
        onSave={() => {
          setSelectedTheme(null);
          refetch();
        }}
      />
    );
  }

  return (
    <RoleGuard requiredPermission={{ resource: 'themes', action: 'read' }}>
      <PageWrapper>
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          action={
            <RoleGuard requiredPermission={{ resource: 'themes', action: 'write' }}>
              <Button
                color="primary"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={() => setSelectedTheme('new')}
              >
                {t('createNew')}
              </Button>
            </RoleGuard>
          }
        />

        {isLoading ? (
          <LoadingState message="Loading themes..." fullScreen={false} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <PaintBrushIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Themes Yet</h3>
                <p className="text-gray-600 mb-4">Create your first theme to get started</p>
                <RoleGuard requiredPermission={{ resource: 'themes', action: 'write' }}>
                  <Button
                    color="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    startContent={<PlusIcon className="w-5 h-5" />}
                    onPress={() => setSelectedTheme('new')}
                  >
                    {t('createNew')}
                  </Button>
                </RoleGuard>
              </div>
            ) : (
              themes.map((theme) => (
                <div
                  key={theme.id}
                  className="transform transition-transform hover:scale-105 active:scale-95"
                >
                  <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <CardBody className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <PaintBrushIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{theme.name}</h3>
                          {theme.isActive && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <RoleGuard requiredPermission={{ resource: 'themes', action: 'write' }}>
                          <Button
                            size="sm"
                            variant="flat"
                            className="flex-1"
                            onPress={() => setSelectedTheme(theme.id)}
                          >
                            {t('edit')}
                          </Button>
                        </RoleGuard>
                        {!theme.isActive && (
                          <RoleGuard requiredPermission={{ resource: 'themes', action: 'write' }}>
                            <Button
                              size="sm"
                              color="primary"
                              variant="light"
                              onPress={() => handleActivateTheme(theme.id)}
                            >
                              {t('activate')}
                            </Button>
                          </RoleGuard>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ))
            )}
          </div>
        )}
      </PageWrapper>
    </RoleGuard>
  );
}

