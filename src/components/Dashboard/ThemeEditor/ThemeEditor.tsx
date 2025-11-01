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
  Select,
  SelectItem,
} from '@heroui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ColorPicker } from './ColorPicker';
import { FontSelector } from './FontSelector';
import { PreviewPane } from './PreviewPane';
import { useRolePermissions } from '@/hooks/useRolePermissions';

interface ThemeConfig {
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
  const [config, setConfig] = useState<ThemeConfig>({
    name: '',
    layout: 'default',
    colors: {
      primary: '#2563eb',
      secondary: '#9333ea',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#111827',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  // TODO: Load theme config from Supabase if themeId !== 'new'

  const handleSave = async () => {
    if (!canWrite('themes')) {
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Save to Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSave();
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme Name */}
          <Card className="border border-gray-100">
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

          {/* Layout Selection */}
          <Card className="border border-gray-100">
            <CardBody className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('layout')}</h3>
              <Select
                selectedKeys={[config.layout]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as ThemeConfig['layout'];
                  setConfig({ ...config, layout: selected });
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="default" textValue="default">
                  Default
                </SelectItem>
                <SelectItem key="single-page" textValue="single-page">
                  Single Page
                </SelectItem>
                <SelectItem key="liquid-glass" textValue="liquid-glass">
                  Liquid Glass
                </SelectItem>
              </Select>
            </CardBody>
          </Card>

          {/* Colors */}
          <Card className="border border-gray-100">
            <CardBody className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('colors')}</h3>
              <div className="space-y-4">
                <ColorPicker
                  label={t('primaryColor')}
                  value={config.colors.primary}
                  onChange={(color) =>
                    setConfig({
                      ...config,
                      colors: { ...config.colors, primary: color },
                    })
                  }
                />
                <ColorPicker
                  label={t('secondaryColor')}
                  value={config.colors.secondary}
                  onChange={(color) =>
                    setConfig({
                      ...config,
                      colors: { ...config.colors, secondary: color },
                    })
                  }
                />
                <ColorPicker
                  label={t('accentColor')}
                  value={config.colors.accent}
                  onChange={(color) =>
                    setConfig({
                      ...config,
                      colors: { ...config.colors, accent: color },
                    })
                  }
                />
                <ColorPicker
                  label={t('backgroundColor')}
                  value={config.colors.background}
                  onChange={(color) =>
                    setConfig({
                      ...config,
                      colors: { ...config.colors, background: color },
                    })
                  }
                />
                <ColorPicker
                  label={t('textColor')}
                  value={config.colors.text}
                  onChange={(color) =>
                    setConfig({
                      ...config,
                      colors: { ...config.colors, text: color },
                    })
                  }
                />
              </div>
            </CardBody>
          </Card>

          {/* Fonts */}
          <Card className="border border-gray-100">
            <CardBody className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('fonts')}</h3>
              <div className="space-y-4">
                <FontSelector
                  label={t('headingFont')}
                  value={config.fonts.heading}
                  onChange={(font) =>
                    setConfig({
                      ...config,
                      fonts: { ...config.fonts, heading: font },
                    })
                  }
                />
                <FontSelector
                  label={t('bodyFont')}
                  value={config.fonts.body}
                  onChange={(font) =>
                    setConfig({
                      ...config,
                      fonts: { ...config.fonts, body: font },
                    })
                  }
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-100 sticky top-6">
            <CardBody className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('preview')}</h3>
              <PreviewPane config={config} />
            </CardBody>
          </Card>
        </div>
      </div>
    </m.div>
  );
}

