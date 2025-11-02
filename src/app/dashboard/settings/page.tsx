'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import {
  Card,
  CardBody,
  Button,
  Switch,
  Select,
  SelectItem,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ChartBarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useRolePermissions } from '@/hooks/useRolePermissions';

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings');
  const { isAdmin } = useRolePermissions();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    language: 'en',
    timezone: 'America/Sao_Paulo',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailReports: true,
    weeklyDigest: true,
    conversionAlerts: true,
    paymentAlerts: true,
    systemUpdates: false,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
  });

  // Analytics Settings
  const [analyticsSettings, setAnalyticsSettings] = useState({
    dataRetention: '90',
    exportFormat: 'csv',
  });

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/dashboard/settings');
        if (response.ok) {
          const data = await response.json();
          const settings = data.settings || {};
          
          if (settings.general) {
            setGeneralSettings(settings.general);
          }
          if (settings.notifications) {
            setNotificationSettings(settings.notifications);
          }
          if (settings.security) {
            setSecuritySettings(settings.security);
          }
          if (settings.analytics) {
            setAnalyticsSettings(settings.analytics);
          }
        }
      } catch (error) {
        console.error('Load settings error:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'general',
          settings: generalSettings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Save general settings error:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'notifications',
          settings: notificationSettings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Save notification settings error:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'security',
          settings: securitySettings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Save security settings error:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnalytics = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'analytics',
          settings: analyticsSettings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Save analytics settings error:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="mb-6"
        classNames={{
          tabList: 'bg-white border border-gray-200 rounded-lg p-1',
          tab: 'data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-500 data-[selected=true]:to-purple-500 data-[selected=true]:text-white',
        }}
      >
        <Tab
          key="general"
          title={
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5" />
              <span>{t('general')}</span>
            </div>
          }
        >
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('generalSettings')}</h2>
              <div className="space-y-4">
                <Select
                  label={t('language')}
                  selectedKeys={[generalSettings.language]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setGeneralSettings({ ...generalSettings, language: selected });
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="en" textValue="en">English</SelectItem>
                  <SelectItem key="pt-BR" textValue="pt-BR">Português</SelectItem>
                  <SelectItem key="es" textValue="es">Español</SelectItem>
                </Select>

                <Select
                  label={t('timezone')}
                  selectedKeys={[generalSettings.timezone]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setGeneralSettings({ ...generalSettings, timezone: selected });
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="America/Sao_Paulo" textValue="America/Sao_Paulo">
                    America/Sao_Paulo (BRT)
                  </SelectItem>
                  <SelectItem key="America/New_York" textValue="America/New_York">
                    America/New_York (EST)
                  </SelectItem>
                  <SelectItem key="Europe/London" textValue="Europe/London">
                    Europe/London (GMT)
                  </SelectItem>
                  <SelectItem key="Asia/Tokyo" textValue="Asia/Tokyo">
                    Asia/Tokyo (JST)
                  </SelectItem>
                </Select>

                <Select
                  label={t('currency')}
                  selectedKeys={[generalSettings.currency]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setGeneralSettings({ ...generalSettings, currency: selected });
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="USD" textValue="USD">USD ($)</SelectItem>
                  <SelectItem key="BRL" textValue="BRL">BRL (R$)</SelectItem>
                  <SelectItem key="EUR" textValue="EUR">EUR (€)</SelectItem>
                  <SelectItem key="GBP" textValue="GBP">GBP (£)</SelectItem>
                </Select>

                <Select
                  label={t('dateFormat')}
                  selectedKeys={[generalSettings.dateFormat]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setGeneralSettings({ ...generalSettings, dateFormat: selected });
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="MM/DD/YYYY" textValue="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem key="DD/MM/YYYY" textValue="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem key="YYYY-MM-DD" textValue="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </Select>

                <div className="pt-4">
                  <Button
                    color="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    onPress={handleSaveGeneral}
                    isLoading={isSaving}
                  >
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="notifications"
          title={
            <div className="flex items-center gap-2">
              <BellIcon className="w-5 h-5" />
              <span>{t('notifications')}</span>
            </div>
          }
        >
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('notificationSettings')}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t('emailReports')}</p>
                    <p className="text-sm text-gray-600">{t('emailReportsDesc')}</p>
                  </div>
                  <Switch
                    isSelected={notificationSettings.emailReports}
                    onValueChange={(value) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailReports: value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t('weeklyDigest')}</p>
                    <p className="text-sm text-gray-600">{t('weeklyDigestDesc')}</p>
                  </div>
                  <Switch
                    isSelected={notificationSettings.weeklyDigest}
                    onValueChange={(value) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        weeklyDigest: value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t('conversionAlerts')}</p>
                    <p className="text-sm text-gray-600">{t('conversionAlertsDesc')}</p>
                  </div>
                  <Switch
                    isSelected={notificationSettings.conversionAlerts}
                    onValueChange={(value) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        conversionAlerts: value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t('paymentAlerts')}</p>
                    <p className="text-sm text-gray-600">{t('paymentAlertsDesc')}</p>
                  </div>
                  <Switch
                    isSelected={notificationSettings.paymentAlerts}
                    onValueChange={(value) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        paymentAlerts: value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t('systemUpdates')}</p>
                    <p className="text-sm text-gray-600">{t('systemUpdatesDesc')}</p>
                  </div>
                  <Switch
                    isSelected={notificationSettings.systemUpdates}
                    onValueChange={(value) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        systemUpdates: value,
                      })
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button
                    color="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    onPress={handleSaveNotifications}
                    isLoading={isSaving}
                  >
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="security"
          title={
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              <span>{t('security')}</span>
            </div>
          }
        >
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('securitySettings')}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t('twoFactorAuth')}</p>
                    <p className="text-sm text-gray-600">{t('twoFactorAuthDesc')}</p>
                  </div>
                  <Switch
                    isSelected={securitySettings.twoFactorEnabled}
                    onValueChange={(value) =>
                      setSecuritySettings({
                        ...securitySettings,
                        twoFactorEnabled: value,
                      })
                    }
                  />
                </div>

                <Select
                  label={t('sessionTimeout')}
                  selectedKeys={[securitySettings.sessionTimeout]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: selected,
                    });
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="15" textValue="15">15 {t('minutes')}</SelectItem>
                  <SelectItem key="30" textValue="30">30 {t('minutes')}</SelectItem>
                  <SelectItem key="60" textValue="60">1 {t('hour')}</SelectItem>
                  <SelectItem key="120" textValue="120">2 {t('hours')}</SelectItem>
                </Select>

                <div className="pt-4">
                  <Button
                    color="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    onPress={handleSaveSecurity}
                    isLoading={isSaving}
                  >
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="analytics"
          title={
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              <span>{t('analytics')}</span>
            </div>
          }
        >
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('analyticsSettings')}</h2>
              <div className="space-y-4">
                <Select
                  label={t('dataRetention')}
                  selectedKeys={[analyticsSettings.dataRetention]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setAnalyticsSettings({
                      ...analyticsSettings,
                      dataRetention: selected,
                    });
                  }}
                  variant="bordered"
                  size="lg"
                  description={t('dataRetentionDesc')}
                >
                  <SelectItem key="30" textValue="30">30 {t('days')}</SelectItem>
                  <SelectItem key="60" textValue="60">60 {t('days')}</SelectItem>
                  <SelectItem key="90" textValue="90">90 {t('days')}</SelectItem>
                  <SelectItem key="180" textValue="180">180 {t('days')}</SelectItem>
                  <SelectItem key="365" textValue="365">1 {t('year')}</SelectItem>
                </Select>

                <Select
                  label={t('exportFormat')}
                  selectedKeys={[analyticsSettings.exportFormat]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setAnalyticsSettings({
                      ...analyticsSettings,
                      exportFormat: selected,
                    });
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="csv" textValue="csv">CSV</SelectItem>
                  <SelectItem key="json" textValue="json">JSON</SelectItem>
                  <SelectItem key="xlsx" textValue="xlsx">Excel (XLSX)</SelectItem>
                </Select>

                <div className="pt-4">
                  <Button
                    color="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    onPress={handleSaveAnalytics}
                    isLoading={isSaving}
                  >
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {isAdmin && (
          <Tab
            key="danger"
            title={
              <div className="flex items-center gap-2 text-red-600">
                <TrashIcon className="w-5 h-5" />
                <span>{t('dangerZone')}</span>
              </div>
            }
          >
            <Card className="border-2 border-red-300 bg-red-50 hover:shadow-lg transition-all duration-200 mt-6">
              <CardBody className="p-6">
                <h2 className="text-xl font-bold text-red-900 mb-6">{t('dangerZone')}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">{t('deleteAccount')}</h3>
                    <p className="text-sm text-red-700 mb-4">{t('deleteAccountDesc')}</p>
                    <Button
                      color="danger"
                      variant="flat"
                      startContent={<TrashIcon className="w-5 h-5" />}
                      onPress={() => {
                        // TODO: Implement account deletion
                        toast.error(t('deleteAccountComingSoon'));
                      }}
                    >
                      {t('deleteAccountButton')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>
        )}
      </Tabs>
    </PageWrapper>
  );
}

