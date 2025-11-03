'use client';

import { useTranslations } from 'next-intl';
import { Card, CardBody, Input } from '@heroui/react';
import { TipTapTextEditor } from '../TipTapTextEditor';
import type { ExpandedThemeConfig } from '../types';

interface TextsTabProps {
  config: ExpandedThemeConfig;
  onChange: (config: ExpandedThemeConfig) => void;
}

export function TextsTab({ config, onChange }: TextsTabProps) {
  const t = useTranslations('dashboard.themeEditor.textsTab');
  const updateTexts = (path: string[], value: any) => {
    const newConfig = { ...config };
    let current: any = newConfig.texts;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Interface Texts */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('stepTitlesDescriptions')}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('cartTitle')}
                value={config.texts.interface.stepTitles.cart}
                onChange={(e) => updateTexts(['interface', 'stepTitles', 'cart'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label={t('cartDescription')}
                value={config.texts.interface.stepDescriptions.cart}
                onChange={(e) => updateTexts(['interface', 'stepDescriptions', 'cart'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label={t('profileTitle')}
                value={config.texts.interface.stepTitles.profile}
                onChange={(e) => updateTexts(['interface', 'stepTitles', 'profile'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label={t('profileDescription')}
                value={config.texts.interface.stepDescriptions.profile}
                onChange={(e) => updateTexts(['interface', 'stepDescriptions', 'profile'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label={t('shippingTitle')}
                value={config.texts.interface.stepTitles.shipping}
                onChange={(e) => updateTexts(['interface', 'stepTitles', 'shipping'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label={t('shippingDescription')}
                value={config.texts.interface.stepDescriptions.shipping}
                onChange={(e) => updateTexts(['interface', 'stepDescriptions', 'shipping'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label={t('paymentTitle')}
                value={config.texts.interface.stepTitles.payment}
                onChange={(e) => updateTexts(['interface', 'stepTitles', 'payment'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label={t('paymentDescription')}
                value={config.texts.interface.stepDescriptions.payment}
                onChange={(e) => updateTexts(['interface', 'stepDescriptions', 'payment'], e.target.value)}
                variant="bordered"
                size="lg"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Page Content - Rich Text Editors */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pageContent')}</h3>
          <div className="space-y-6">
            <TipTapTextEditor
              label={t('emptyCartMessage')}
              value={config.texts.pages.emptyCartMessage}
              onChange={(html) => updateTexts(['pages', 'emptyCartMessage'], html)}
              minHeight="150px"
            />
            <TipTapTextEditor
              label={t('confirmationPageContent')}
              value={config.texts.pages.confirmationPage}
              onChange={(html) => updateTexts(['pages', 'confirmationPage'], html)}
              minHeight="200px"
            />
            <TipTapTextEditor
              label={t('thankYouMessage')}
              value={config.texts.pages.thankYouMessage}
              onChange={(html) => updateTexts(['pages', 'thankYouMessage'], html)}
              minHeight="150px"
            />
            <TipTapTextEditor
              label={t('termsAndConditions')}
              value={config.texts.pages.termsAndConditions}
              onChange={(html) => updateTexts(['pages', 'termsAndConditions'], html)}
              minHeight="300px"
              placeholder={t('termsPlaceholder')}
            />
            <TipTapTextEditor
              label={t('privacyPolicyPreview')}
              value={config.texts.pages.privacyPolicyPreview}
              onChange={(html) => updateTexts(['pages', 'privacyPolicyPreview'], html)}
              minHeight="300px"
              placeholder={t('privacyPlaceholder')}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

