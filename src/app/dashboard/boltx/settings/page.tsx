'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import {
  Card,
  CardBody,
  Button,
  Switch,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Spinner,
} from '@heroui/react';
import {
  Cog6ToothIcon,
  KeyIcon,
  CpuChipIcon,
  ChartBarIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';

interface BoltXConfiguration {
  enabled: boolean;
  ai_provider: 'openai' | 'local';
  openai_api_key_masked: string | null;
  openai_model: string;
  openai_max_tokens: number;
  openai_temperature: number;
  cache_enabled: boolean;
  cache_ttl: number;
  rate_limit: number;
  prediction_model_version: string;
  interventions_enabled?: boolean;
  personalization_enabled?: boolean;
  optimizations_enabled?: boolean;
  metadata?: Record<string, any>;
}

export default function BoltXSettingsPage() {
  const t = useTranslations('dashboard.boltx.settings');
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration state
  const [config, setConfig] = useState<BoltXConfiguration>({
    enabled: false,
    ai_provider: 'openai',
    openai_api_key_masked: null,
    openai_model: 'gpt-4-turbo-preview',
    openai_max_tokens: 2000,
    openai_temperature: 0.7,
    cache_enabled: true,
    cache_ttl: 3600,
    rate_limit: 60,
    prediction_model_version: 'v1',
    interventions_enabled: true,
    personalization_enabled: true,
    optimizations_enabled: true,
    metadata: {},
  });

  // Form state for new API key
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Load configuration
  const { data, error, isLoading: apiLoading } = useApi<{ configuration: BoltXConfiguration }>(
    '/api/boltx/settings'
  );

  useEffect(() => {
    if (data?.configuration) {
      setConfig(data.configuration);
      setIsLoading(false);
    } else if (error) {
      console.error('Error loading BoltX configuration:', error);
      setIsLoading(false);
    } else if (!apiLoading) {
      setIsLoading(false);
    }
  }, [data, error, apiLoading]);

  const handleSave = async (section?: string) => {
    setIsSaving(true);
    try {
      const updateData: Partial<BoltXConfiguration> = {};

      if (section === 'general' || !section) {
        updateData.enabled = config.enabled;
        updateData.ai_provider = config.ai_provider;
        if (newApiKey.trim()) {
          (updateData as any).openai_api_key = newApiKey.trim();
        }
      }

      if (section === 'openai' || !section) {
        updateData.openai_model = config.openai_model;
        updateData.openai_max_tokens = config.openai_max_tokens;
        updateData.openai_temperature = config.openai_temperature;
        if (newApiKey.trim()) {
          (updateData as any).openai_api_key = newApiKey.trim();
        }
      }

      if (section === 'performance' || !section) {
        updateData.cache_enabled = config.cache_enabled;
        updateData.cache_ttl = config.cache_ttl;
        updateData.rate_limit = config.rate_limit;
      }

      if (section === 'advanced' || !section) {
        updateData.prediction_model_version = config.prediction_model_version;
      }

      if (section === 'features' || !section) {
        updateData.interventions_enabled = config.interventions_enabled;
        updateData.personalization_enabled = config.personalization_enabled;
        updateData.optimizations_enabled = config.optimizations_enabled;
      }

      const response = await fetch('/api/boltx/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      const result = await response.json();
      if (result.data?.configuration) {
        setConfig(result.data.configuration);
        setNewApiKey('');
        setShowApiKeyInput(false);
      }

      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Save configuration error:', error);
      toast.error(error instanceof Error ? error.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PlanGuard requiredPlan="enterprise">
        <PageWrapper>
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
          </div>
        </PageWrapper>
      </PlanGuard>
    );
  }

  return (
    <PlanGuard requiredPlan="enterprise">
      <PageWrapper>
        <PageHeader
          title={t('title')}
          subtitle={t('description')}
        />

        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="mb-6 mt-8"
          classNames={{
            tabList: 'bg-white border border-gray-200 rounded-lg p-1',
            tab: 'data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-500 data-[selected=true]:to-purple-500 data-[selected=true]:text-white data-[selected=true]:[&_*]:text-white data-[selected=true]:[&_svg]:text-white',
          }}
        >
          {/* General Settings Tab */}
          <Tab
            key="general"
            title={
              <div className="flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5" />
                <span>{t('general.title')}</span>
              </div>
            }
          >
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
              <CardBody className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('general.title')}</h2>
                <div className="space-y-6">
                  {/* Enabled Switch */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        {t('general.enabled')}
                        <span className="text-red-500 text-sm">*</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{t('general.enabledDesc')}</p>
                    </div>
                    <Switch
                      isSelected={config.enabled}
                      onValueChange={(value) => setConfig({ ...config, enabled: value })}
                    />
                  </div>

                  {/* AI Provider */}
                  <Select
                    label={
                      <span>
                        {t('general.aiProvider')}
                        <span className="text-red-500 ml-1">*</span>
                      </span>
                    }
                    selectedKeys={[config.ai_provider]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as 'openai' | 'local';
                      setConfig({ ...config, ai_provider: selected });
                    }}
                    variant="bordered"
                    size="lg"
                    description={t('general.aiProviderDesc')}
                  >
                    <SelectItem key="openai" textValue="openai">OpenAI</SelectItem>
                    <SelectItem key="local" textValue="local">Local (ML Models)</SelectItem>
                  </Select>

                  <div className="pt-4">
                    <Button
                      color="primary"
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      onPress={() => handleSave('general')}
                      isLoading={isSaving}
                    >
                      {t('saveChanges')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* OpenAI Configuration Tab */}
          <Tab
            key="openai"
            title={
              <div className="flex items-center gap-2">
                <KeyIcon className="w-5 h-5" />
                <span>{t('openai.title')}</span>
              </div>
            }
          >
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
              <CardBody className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('openai.title')}</h2>
                <div className="space-y-6">
                  {/* API Key */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-gray-900 flex items-center gap-2">
                        {t('openai.apiKey')}
                        {config.ai_provider === 'openai' && config.enabled && (
                          <span className="text-red-500 text-sm">*</span>
                        )}
                      </label>
                      {config.openai_api_key_masked && (
                        <Button
                          variant="light"
                          size="sm"
                          onPress={() => setShowApiKeyInput(!showApiKeyInput)}
                        >
                          {showApiKeyInput ? t('openai.cancel') : t('openai.update')}
                        </Button>
                      )}
                    </div>
                    {config.openai_api_key_masked && !showApiKeyInput ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 font-mono">{config.openai_api_key_masked}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('openai.apiKeyMasked')}</p>
                      </div>
                    ) : (
                      <Input
                        type="password"
                        placeholder={t('openai.apiKeyPlaceholder')}
                        value={newApiKey}
                        onValueChange={setNewApiKey}
                        variant="bordered"
                        size="lg"
                        description={
                          config.ai_provider === 'openai' && config.enabled
                            ? t('openai.apiKeyRequired')
                            : t('openai.apiKeyDesc')
                        }
                      />
                    )}
                  </div>

                  {/* Model */}
                  <Select
                    label={t('openai.model')}
                    selectedKeys={[config.openai_model]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setConfig({ ...config, openai_model: selected });
                    }}
                    variant="bordered"
                    size="lg"
                    description={t('openai.modelDesc')}
                  >
                    <SelectItem key="gpt-4-turbo-preview" textValue="gpt-4-turbo-preview">
                      GPT-4 Turbo Preview
                    </SelectItem>
                    <SelectItem key="gpt-4" textValue="gpt-4">GPT-4</SelectItem>
                    <SelectItem key="gpt-3.5-turbo" textValue="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem key="gpt-4o" textValue="gpt-4o">GPT-4o</SelectItem>
                  </Select>

                  {/* Max Tokens */}
                  <Input
                    type="number"
                    label={t('openai.maxTokens')}
                    value={String(config.openai_max_tokens)}
                    onValueChange={(value) =>
                      setConfig({ ...config, openai_max_tokens: parseInt(value) || 2000 })
                    }
                    variant="bordered"
                    size="lg"
                    min={1}
                    max={100000}
                    description={t('openai.maxTokensDesc')}
                  />

                  {/* Temperature */}
                  <Input
                    type="number"
                    label={t('openai.temperature')}
                    value={String(config.openai_temperature)}
                    onValueChange={(value) =>
                      setConfig({ ...config, openai_temperature: parseFloat(value) || 0.7 })
                    }
                    variant="bordered"
                    size="lg"
                    min={0}
                    max={2}
                    step={0.1}
                    description={t('openai.temperatureDesc')}
                  />

                  <div className="pt-4">
                    <Button
                      color="primary"
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      onPress={() => handleSave('openai')}
                      isLoading={isSaving}
                    >
                      {t('saveChanges')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Performance Settings Tab */}
          <Tab
            key="performance"
            title={
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>{t('performance.title')}</span>
              </div>
            }
          >
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
              <CardBody className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('performance.title')}</h2>
                <div className="space-y-6">
                  {/* Cache Enabled */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{t('performance.cacheEnabled')}</p>
                      <p className="text-sm text-gray-600 mt-1">{t('performance.cacheEnabledDesc')}</p>
                    </div>
                    <Switch
                      isSelected={config.cache_enabled}
                      onValueChange={(value) => setConfig({ ...config, cache_enabled: value })}
                    />
                  </div>

                  {/* Cache TTL */}
                  <Input
                    type="number"
                    label={t('performance.cacheTtl')}
                    value={String(config.cache_ttl)}
                    onValueChange={(value) =>
                      setConfig({ ...config, cache_ttl: parseInt(value) || 3600 })
                    }
                    variant="bordered"
                    size="lg"
                    min={1}
                    description={t('performance.cacheTtlDesc')}
                    endContent={<span className="text-gray-500 text-sm">seconds</span>}
                  />

                  {/* Rate Limit */}
                  <Input
                    type="number"
                    label={t('performance.rateLimit')}
                    value={String(config.rate_limit)}
                    onValueChange={(value) =>
                      setConfig({ ...config, rate_limit: parseInt(value) || 60 })
                    }
                    variant="bordered"
                    size="lg"
                    min={1}
                    description={t('performance.rateLimitDesc')}
                    endContent={<span className="text-gray-500 text-sm">requests/min</span>}
                  />

                  <div className="pt-4">
                    <Button
                      color="primary"
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      onPress={() => handleSave('performance')}
                      isLoading={isSaving}
                    >
                      {t('saveChanges')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Advanced Settings Tab */}
          <Tab
            key="advanced"
            title={
              <div className="flex items-center gap-2">
                <Cog6ToothIcon className="w-5 h-5" />
                <span>{t('advanced.title')}</span>
              </div>
            }
          >
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
              <CardBody className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('advanced.title')}</h2>
                <div className="space-y-6">
                  {/* Prediction Model Version */}
                  <Input
                    type="text"
                    label={t('advanced.modelVersion')}
                    value={config.prediction_model_version}
                    onValueChange={(value) =>
                      setConfig({ ...config, prediction_model_version: value })
                    }
                    variant="bordered"
                    size="lg"
                    description={t('advanced.modelVersionDesc')}
                  />

                  <div className="pt-4">
                    <Button
                      color="primary"
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      onPress={() => handleSave('advanced')}
                      isLoading={isSaving}
                    >
                      {t('saveChanges')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Feature Flags Tab */}
          <Tab
            key="features"
            title={
              <div className="flex items-center gap-2">
                <FlagIcon className="w-5 h-5" />
                <span>Feature Flags</span>
              </div>
            }
          >
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
              <CardBody className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">BoltX Feature Flags</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Enable or disable individual BoltX features. These settings override environment variables.
                </p>
                <div className="space-y-6">
                  {/* Interventions */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Interventions</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Enable automatic interventions to reduce checkout abandonment
                      </p>
                    </div>
                    <Switch
                      isSelected={config.interventions_enabled ?? true}
                      onValueChange={(value) =>
                        setConfig({ ...config, interventions_enabled: value })
                      }
                    />
                  </div>

                  {/* Personalization */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Personalization</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Enable personalized checkout experiences based on user behavior
                      </p>
                    </div>
                    <Switch
                      isSelected={config.personalization_enabled ?? true}
                      onValueChange={(value) =>
                        setConfig({ ...config, personalization_enabled: value })
                      }
                    />
                  </div>

                  {/* Optimizations */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Optimizations</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Enable AI-powered checkout optimizations and form improvements
                      </p>
                    </div>
                    <Switch
                      isSelected={config.optimizations_enabled ?? true}
                      onValueChange={(value) =>
                        setConfig({ ...config, optimizations_enabled: value })
                      }
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      color="primary"
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      onPress={() => handleSave('features')}
                      isLoading={isSaving}
                    >
                      {t('saveChanges')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </PageWrapper>
    </PlanGuard>
  );
}

