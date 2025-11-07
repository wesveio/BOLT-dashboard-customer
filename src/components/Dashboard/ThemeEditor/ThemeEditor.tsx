'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import {
  Card,
  CardBody,
  Button,
  Input,
  Tabs,
  Tab,
} from '@heroui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PreviewPane } from './PreviewPane';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import type { ExpandedThemeConfig } from './types';
import { getDefaultThemeConfig } from './defaults';
import { VisualTab } from './tabs/VisualTab';
import { LayoutTab } from './tabs/LayoutTab';
import { BrandingTab } from './tabs/BrandingTab';
import { FeaturesTab } from './tabs/FeaturesTab';
import { TextsTab } from './tabs/TextsTab';
import { ComponentsTab } from './tabs/ComponentsTab';

/**
 * Deep merge function to merge theme config with defaults
 * Ensures all fields from defaults are present in the loaded theme
 */
function deepMergeDefaults(loadedConfig: any, defaults: ExpandedThemeConfig): ExpandedThemeConfig {
  const merged = { ...defaults };
  
  // Merge features deeply to ensure all feature toggles are present
  if (loadedConfig.features) {
    merged.features = {
      ...defaults.features,
      ...loadedConfig.features,
      checkout: {
        ...defaults.features.checkout,
        ...loadedConfig.features.checkout,
      },
      cart: {
        ...defaults.features.cart,
        ...loadedConfig.features.cart,
      },
      profile: {
        ...defaults.features.profile,
        ...loadedConfig.features.profile,
      },
      shipping: {
        ...defaults.features.shipping,
        ...loadedConfig.features.shipping,
      },
      payment: {
        ...defaults.features.payment,
        ...loadedConfig.features.payment,
      },
      ux: {
        ...defaults.features.ux,
        ...loadedConfig.features.ux,
      },
      analytics: {
        ...defaults.features.analytics,
        ...loadedConfig.features.analytics,
      },
      security: {
        ...defaults.features.security,
        ...loadedConfig.features.security,
      },
    };
  }
  
  // Merge other top-level configs
  if (loadedConfig.name) merged.name = loadedConfig.name;
  if (loadedConfig.baseTheme) merged.baseTheme = loadedConfig.baseTheme;
  if (loadedConfig.visual) merged.visual = { ...defaults.visual, ...loadedConfig.visual };
  if (loadedConfig.layout) merged.layout = { ...defaults.layout, ...loadedConfig.layout };
  if (loadedConfig.branding) merged.branding = { ...defaults.branding, ...loadedConfig.branding };
  if (loadedConfig.texts) merged.texts = { ...defaults.texts, ...loadedConfig.texts };
  if (loadedConfig.components) merged.components = { ...defaults.components, ...loadedConfig.components };
  
  return merged;
}

// Keep old interface for backwards compatibility
export interface ThemeConfig {
  name: string;
  layout: 'default' | 'single-page' | 'liquid-glass';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: string;
}

interface ThemeEditorProps {
  themeId: string | 'new';
  onBack: () => void;
  onSave: () => void;
}

export function ThemeEditor({ themeId, onBack, onSave }: ThemeEditorProps) {
  const t = useTranslations('dashboard.themes');
  const { canWrite } = useRolePermissions();
  const [config, setConfig] = useState<ExpandedThemeConfig>(getDefaultThemeConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(themeId !== 'new');

  // Load theme config from Supabase if themeId !== 'new'
  useEffect(() => {
    if (themeId === 'new') {
      setIsLoading(false);
      return;
    }

    const loadTheme = async () => {
      try {
        const response = await fetch(`/api/dashboard/themes/${themeId}`);
        if (!response.ok) {
          throw new Error('Failed to load theme');
        }

        const data = await response.json();
        const themeConfig = data.theme.config;

        if (themeConfig) {
          // Check if it's expanded config or old format
          if (themeConfig.visual && themeConfig.layout && themeConfig.features) {
            // Expanded format - merge with defaults to ensure all fields are present
            const baseTheme = themeConfig.baseTheme || data.theme?.baseTheme || 'default';
            const defaults = getDefaultThemeConfig(baseTheme);
            const mergedConfig = deepMergeDefaults(themeConfig, defaults);
            setConfig(mergedConfig);
          } else {
            // Old format - migrate to expanded
            const baseTheme = themeConfig.layout === 'single-page' ? 'single-page' : 
                            themeConfig.layout === 'liquid-glass' ? 'liquid-glass' : 'default';
            const expandedConfig = getDefaultThemeConfig(baseTheme);
            expandedConfig.name = themeConfig.name || data.theme.name || '';
            if (themeConfig.colors) {
              expandedConfig.visual.colors.primary.from = themeConfig.colors.primary || expandedConfig.visual.colors.primary.from;
              expandedConfig.visual.colors.secondary.from = themeConfig.colors.secondary || expandedConfig.visual.colors.secondary.from;
              expandedConfig.visual.colors.accent = themeConfig.colors.accent || expandedConfig.visual.colors.accent;
              expandedConfig.visual.colors.background.primary = themeConfig.colors.background || expandedConfig.visual.colors.background.primary;
              expandedConfig.visual.colors.text.primary = themeConfig.colors.text || expandedConfig.visual.colors.text.primary;
            }
            if (themeConfig.fonts) {
              expandedConfig.visual.typography.heading.family = themeConfig.fonts.heading || expandedConfig.visual.typography.heading.family;
              expandedConfig.visual.typography.primary.family = themeConfig.fonts.body || expandedConfig.visual.typography.primary.family;
            }
            if (themeConfig.logo) {
              expandedConfig.branding.logo.url = themeConfig.logo;
            }
            setConfig(expandedConfig);
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [themeId]);

  const handleSave = async () => {
    if (!canWrite('themes')) {
      return;
    }

    setIsSaving(true);
    try {
      const url = themeId === 'new' 
        ? '/api/dashboard/themes'
        : `/api/dashboard/themes/${themeId}`;
      
      const method = themeId === 'new' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save theme');
      }

      onSave();
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading theme...</p>
        </div>
      </div>
    );
  }

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-6">
        <Button
          variant="light"
          startContent={<ArrowLeftIcon className="w-5 h-5" />}
          onPress={onBack}
          className="mb-4"
        >
          {t('backToList')}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {themeId === 'new' ? t('createNew') : t('editTheme')}
            </h1>
            <p className="text-gray-600">{t('editorSubtitle')}</p>
          </div>
          <Button
            color="primary"
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            onPress={handleSave}
            isLoading={isSaving}
            isDisabled={!canWrite('themes')}
          >
            {t('save')}
          </Button>
        </div>
      </div>

      {/* Theme Name - Always visible */}
      <Card className="border border-gray-100 mb-6">
        <CardBody className="p-6">
          <Input
            label={t('themeName')}
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            variant="bordered"
            size="lg"
            isRequired
            classNames={{
              input: 'text-base',
              label: 'text-sm font-semibold',
            }}
          />
        </CardBody>
      </Card>

      <Tabs aria-label="Theme Editor Tabs" className="w-full">
        <Tab key="visual" title="Visual">
          <div className="mt-6">
            <VisualTab config={config} onChange={setConfig} />
          </div>
        </Tab>
        <Tab key="layout" title="Layout">
          <div className="mt-6">
            <LayoutTab config={config} onChange={setConfig} />
          </div>
        </Tab>
        <Tab key="branding" title="Branding">
          <div className="mt-6">
            <BrandingTab config={config} onChange={setConfig} />
          </div>
        </Tab>
        <Tab key="features" title="Features">
          <div className="mt-6">
            <FeaturesTab config={config} onChange={setConfig} />
          </div>
        </Tab>
        <Tab key="texts" title="Texts">
          <div className="mt-6">
            <TextsTab config={config} onChange={setConfig} />
          </div>
        </Tab>
        <Tab key="components" title="Components">
          <div className="mt-6">
            <ComponentsTab config={config} onChange={setConfig} />
          </div>
        </Tab>
        <Tab key="preview" title="Preview">
          <div className="mt-6">
            <Card className="border border-gray-100">
              <CardBody className="p-6">
                <PreviewPane config={config} />
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </m.div>
  );
}

