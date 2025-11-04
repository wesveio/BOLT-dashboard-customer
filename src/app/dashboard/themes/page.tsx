'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { useApi } from '@/hooks/useApi';
import { Card, CardBody, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { ThemeEditor } from '@/components/Dashboard/ThemeEditor/ThemeEditor';
import { RoleGuard } from '@/components/Dashboard/RoleGuard/RoleGuard';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { PlusIcon, PaintBrushIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { getDefaultThemeConfig } from '@/components/Dashboard/ThemeEditor/defaults';
import { formatRelativeTime } from '@/utils/formatters';


export default function ThemesPage() {
  const t = useTranslations('dashboard.themes');
  const tCommon = useTranslations('dashboard.common');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [duplicatingTheme, setDuplicatingTheme] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [deletingTheme, setDeletingTheme] = useState<{ id: string; name: string } | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Get default themes with translations
  const getDefaultThemes = () => [
    {
      id: 'default-theme',
      name: t('defaultThemes.default.name'),
      description: t('defaultThemes.default.description'),
      baseTheme: 'default' as const,
      isDefault: true,
      isReadonly: true,
    },
    {
      id: 'single-page-theme',
      name: t('defaultThemes.singlePage.name'),
      description: t('defaultThemes.singlePage.description'),
      baseTheme: 'single-page' as const,
      isDefault: true,
      isReadonly: true,
    },
    {
      id: 'liquid-glass-theme',
      name: t('defaultThemes.liquidGlass.name'),
      description: t('defaultThemes.liquidGlass.description'),
      baseTheme: 'liquid-glass' as const,
      isDefault: true,
      isReadonly: true,
    },
  ];
  
  const defaultThemes = getDefaultThemes();

  const { data, isLoading, refetch } = useApi<{ themes: any[] }>('/api/dashboard/themes', {
    cacheKey: 'themes',
    cacheTTL: 5,
  });
  const themes = data?.themes || [];

  // Find the active theme
  const activeTheme = themes.find((t) => t.isActive);

  // Helper to check if a default theme is active
  const isDefaultThemeActive = (baseTheme: 'default' | 'single-page' | 'liquid-glass') => {
    return activeTheme?.baseTheme === baseTheme || activeTheme?.base_theme === baseTheme;
  };
  
  // Helper to check if a theme is active
  const isThemeActive = (theme: any) => {
    return theme.is_active === true;
  };

  const handleActivateTheme = async (themeId: string) => {
    try {
      const response = await fetch(`/api/dashboard/themes/${themeId}`, {
        method: 'POST',
      });
      if (response.ok) {
        toast.success(t('toast.activateSuccess'));
        refetch();
      }
    } catch (error) {
      console.error('❌ [DEBUG] Activate theme error:', error);
      toast.error(t('toast.activateError'));
    }
  };

  const handleUseDefaultTheme = async (baseTheme: 'default' | 'single-page' | 'liquid-glass') => {
    try {
      // Check if there's already a theme with this baseTheme that's active
      const existingActiveTheme = themes.find(
        (t) => (t.baseTheme === baseTheme || t.base_theme === baseTheme) && t.isActive
      );
      
      if (existingActiveTheme) {
        toast.success(t('toast.alreadyActive', { name: existingActiveTheme.name }));
        return;
      }

      // Check if there's a theme with this baseTheme (even if not active)
      const themeWithSameBase = themes.find(
        (t) => t.baseTheme === baseTheme || t.base_theme === baseTheme
      );
      
      if (themeWithSameBase) {
        // Activate the existing theme
        const response = await fetch(`/api/dashboard/themes/${themeWithSameBase.id}`, {
          method: 'POST',
        });
        
        if (response.ok) {
          toast.success(t('toast.activateSuccess'));
          refetch();
        } else {
          throw new Error('Failed to activate theme');
        }
      } else {
        // Create a new theme based on the default theme config
        const defaultConfig = getDefaultThemeConfig(baseTheme);
        const themeName = defaultThemes.find((dt) => dt.baseTheme === baseTheme)?.name || 
                          `Default ${baseTheme.charAt(0).toUpperCase() + baseTheme.slice(1)}`;
        
        // Ensure baseTheme is set in the config
        const configWithBaseTheme = {
          ...defaultConfig,
          baseTheme: baseTheme,
        };
        
        const response = await fetch('/api/dashboard/themes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...configWithBaseTheme,
            name: themeName,
          }),
        });

        if (response.ok) {
          const { theme: newTheme } = await response.json();
          
          // Activate the newly created theme
          const activateResponse = await fetch(`/api/dashboard/themes/${newTheme.id}`, {
            method: 'POST',
          });
          
          if (activateResponse.ok) {
            toast.success(t('toast.createdAndActivated', { name: themeName }));
            refetch();
          } else {
            throw new Error('Failed to activate theme');
          }
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create theme');
        }
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Use default theme error:', error);
      toast.error(error.message || 'Failed to use default theme');
    }
  };

  const handleDuplicateTheme = async (themeId: string, newName: string) => {
    try {
      const response = await fetch(`/api/dashboard/themes/${themeId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      });
      if (response.ok) {
        toast.success(t('toast.duplicateSuccess'));
        setDuplicatingTheme(null);
        setDuplicateName('');
        onClose();
        refetch();
      } else {
        const error = await response.json();
        throw new Error(error.error || t('toast.duplicateError'));
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Duplicate theme error:', error);
      toast.error(error.message || t('toast.duplicateError'));
    }
  };

  const startDuplicate = (themeId: string, currentName: string) => {
    setDuplicatingTheme(themeId);
    setDuplicateName(`${currentName} (Copy)`);
    onOpen();
  };

  const handleDeleteTheme = async (themeId: string) => {
    try {
      const response = await fetch(`/api/dashboard/themes/${themeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('deleteSuccess'));
        setDeletingTheme(null);
        onDeleteClose();
        refetch();
      } else {
        const error = await response.json();
        throw new Error(error.error || t('deleteError'));
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Delete theme error:', error);
      
      // Check if error message indicates active theme
      if (error.message?.includes('active theme')) {
        toast.error(t('cannotDeleteActive'));
      } else {
        toast.error(error.message || t('deleteError'));
      }
    }
  };

  const startDelete = (themeId: string, themeName: string) => {
    setDeletingTheme({ id: themeId, name: themeName });
    onDeleteOpen();
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
          <LoadingState message={t('labels.loading')} fullScreen={false} />
        ) : (
          <>
            {/* Default Themes Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('sections.defaultThemes')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defaultThemes.map((defaultTheme) => {
                  const isActive = isDefaultThemeActive(defaultTheme.baseTheme);
                  // Find the active theme that matches this default theme to get updated_at
                  const activeThemeForDefault = isActive ? activeTheme : null;
                  return (
                    <div
                      key={defaultTheme.id}
                      className="transform transition-transform hover:scale-105 active:scale-95 flex relative"
                    >
                      {/* Active Badge - Ribbon Style (outside Card to avoid overflow issues) */}
                      {isActive && (
                        <div className="absolute -top-2 -right-2 z-30">
                          <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5 border-2 border-white">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs font-bold tracking-wide whitespace-nowrap">{t('labels.active').toUpperCase()}</span>
                          </div>
                        </div>
                      )}
                      <Card
                        className={`border transition-all duration-200 flex flex-col w-full relative ${
                          isActive
                            ? 'border-green-500 bg-green-50/50 shadow-lg ring-2 ring-green-500/20'
                            : 'border-gray-100 hover:border-blue-200 hover:shadow-lg'
                        }`}
                      >
                        <CardBody className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center relative">
                              <PaintBrushIcon className="w-8 h-8 text-white" />
                              {isActive && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900">{defaultTheme.name}</h3>
                                {isActive && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {t('labels.active')}
                                  </span>
                                )}
                              </div>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                {t('labels.default')}
                              </span>
                              {activeThemeForDefault?.updated_at && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {t('labels.updatedAt')} <span className="font-medium">{formatRelativeTime(activeThemeForDefault.updated_at)}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4 flex-1">{defaultTheme.description}</p>
                          <div className="flex gap-2 mt-auto">
                            <Button
                              size="sm"
                              color={isActive ? 'success' : 'primary'}
                              variant={isActive ? 'solid' : 'flat'}
                              className="flex-1"
                              onPress={() => handleUseDefaultTheme(defaultTheme.baseTheme)}
                              startContent={
                                isActive && (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )
                              }
                            >
                              {isActive ? t('labels.currentlyActive') : t('labels.useThisTheme')}
                            </Button>
                          <RoleGuard requiredPermission={{ resource: 'themes', action: 'write' }}>
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => startDuplicate(defaultTheme.id, defaultTheme.name)}
                              title={tCommon('duplicate')}
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </Button>
                          </RoleGuard>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Themes Section */}
            {themes.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('sections.customThemes')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className="transform transition-transform hover:scale-105 active:scale-95 flex relative"
                    >
                      <Card
                        className={`border transition-all duration-200 cursor-pointer flex flex-col w-full relative ${
                          isThemeActive(theme)
                            ? 'border-green-500 bg-green-50/50 shadow-lg ring-2 ring-green-500/20'
                            : 'border-gray-100 hover:border-blue-200 hover:shadow-lg'
                        }`}
                      >
                        <CardBody className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center relative">
                              <PaintBrushIcon className="w-8 h-8 text-white" />
                              {isThemeActive(theme) && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900">{theme.name}</h3>
                                {isThemeActive(theme) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {t('labels.active')}
                                  </span>
                                )}
                              </div>
                              {theme.base_theme && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                                  {t('labels.basedOn')} {theme.base_theme}
                                </span>
                              )}
                              {theme.updated_at && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {t('labels.updatedAt')} <span className="font-medium">{formatRelativeTime(theme.updated_at)}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-auto">
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
                            {!isThemeActive(theme) && (
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
                            {!isThemeActive(theme) && (
                              <>
                                <RoleGuard requiredPermission={{ resource: 'themes', action: 'write' }}>
                                  <Button
                                    size="sm"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => startDuplicate(theme.id, theme.name)}
                                    title={tCommon('duplicate')}
                                  >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                  </Button>
                                </RoleGuard>
                                <RoleGuard requiredPermission={{ resource: 'themes', action: 'write' }}>
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    isIconOnly
                                    onPress={() => startDelete(theme.id, theme.name)}
                                    title={t('delete')}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                </RoleGuard>
                              </>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State (only if no custom themes) */}
            {themes.length === 0 && (
              <div className="text-center py-12">
                <PaintBrushIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('labels.noCustomThemes')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('labels.noCustomThemesDesc')}
                </p>
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
            )}
          </>
        )}

        {/* Duplicate Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">{t('duplicateModal.title')}</ModalHeader>
                <ModalBody>
                  <Input
                    label={t('duplicateModal.newThemeName')}
                    value={duplicateName}
                    onChange={(e) => setDuplicateName(e.target.value)}
                    variant="bordered"
                    size="lg"
                    placeholder={t('duplicateModal.placeholder')}
                    autoFocus
                  />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => {
                      if (duplicatingTheme && duplicateName.trim()) {
                        handleDuplicateTheme(duplicatingTheme, duplicateName.trim());
                      }
                    }}
                    isDisabled={!duplicateName.trim()}
                  >
                    {t('duplicateModal.duplicate')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            {(onDeleteClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">{t('confirmDelete')}</ModalHeader>
                <ModalBody>
                  <p className="text-gray-600">
                    {t('deleteTheme')}: <strong>{deletingTheme?.name}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('deleteWarning')}
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onDeleteClose}>
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    color="danger"
                    onPress={() => {
                      if (deletingTheme) {
                        handleDeleteTheme(deletingTheme.id);
                      }
                    }}
                  >
                    {t('delete')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </PageWrapper>
    </RoleGuard>
  );
}
