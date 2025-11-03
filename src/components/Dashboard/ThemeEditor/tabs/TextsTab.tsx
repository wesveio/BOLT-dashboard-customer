'use client';

import { Card, CardBody, Input } from '@heroui/react';
import { TipTapTextEditor } from '../TipTapTextEditor';
import type { ExpandedThemeConfig } from '../types';

interface TextsTabProps {
  config: ExpandedThemeConfig;
  onChange: (config: ExpandedThemeConfig) => void;
}

export function TextsTab({ config, onChange }: TextsTabProps) {
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Step Titles & Descriptions</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cart Title"
                value={config.texts.interface.stepTitles.cart}
                onChange={(e) => updateTexts(['interface', 'stepTitles', 'cart'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label="Cart Description"
                value={config.texts.interface.stepDescriptions.cart}
                onChange={(e) => updateTexts(['interface', 'stepDescriptions', 'cart'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label="Profile Title"
                value={config.texts.interface.stepTitles.profile}
                onChange={(e) => updateTexts(['interface', 'stepTitles', 'profile'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label="Profile Description"
                value={config.texts.interface.stepDescriptions.profile}
                onChange={(e) => updateTexts(['interface', 'stepDescriptions', 'profile'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label="Shipping Title"
                value={config.texts.interface.stepTitles.shipping}
                onChange={(e) => updateTexts(['interface', 'stepTitles', 'shipping'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label="Shipping Description"
                value={config.texts.interface.stepDescriptions.shipping}
                onChange={(e) => updateTexts(['interface', 'stepDescriptions', 'shipping'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label="Payment Title"
                value={config.texts.interface.stepTitles.payment}
                onChange={(e) => updateTexts(['interface', 'stepTitles', 'payment'], e.target.value)}
                variant="bordered"
                size="lg"
              />
              <Input
                label="Payment Description"
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Page Content (Rich Text)</h3>
          <div className="space-y-6">
            <TipTapTextEditor
              label="Empty Cart Message"
              value={config.texts.pages.emptyCartMessage}
              onChange={(html) => updateTexts(['pages', 'emptyCartMessage'], html)}
              minHeight="150px"
            />
            <TipTapTextEditor
              label="Confirmation Page Content"
              value={config.texts.pages.confirmationPage}
              onChange={(html) => updateTexts(['pages', 'confirmationPage'], html)}
              minHeight="200px"
            />
            <TipTapTextEditor
              label="Thank You Message"
              value={config.texts.pages.thankYouMessage}
              onChange={(html) => updateTexts(['pages', 'thankYouMessage'], html)}
              minHeight="150px"
            />
            <TipTapTextEditor
              label="Terms and Conditions"
              value={config.texts.pages.termsAndConditions}
              onChange={(html) => updateTexts(['pages', 'termsAndConditions'], html)}
              minHeight="300px"
              placeholder="Enter terms and conditions here..."
            />
            <TipTapTextEditor
              label="Privacy Policy Preview"
              value={config.texts.pages.privacyPolicyPreview}
              onChange={(html) => updateTexts(['pages', 'privacyPolicyPreview'], html)}
              minHeight="300px"
              placeholder="Enter privacy policy preview here..."
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

