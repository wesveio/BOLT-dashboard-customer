'use client';

import { Card, CardBody, Input } from '@heroui/react';
import type { ExpandedThemeConfig } from '../types';

interface BrandingTabProps {
  config: ExpandedThemeConfig;
  onChange: (config: ExpandedThemeConfig) => void;
}

export function BrandingTab({ config, onChange }: BrandingTabProps) {
  const updateBranding = (path: string[], value: any) => {
    const newConfig = { ...config };
    let current: any = newConfig.branding;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Logo & Identity</h3>
          <div className="space-y-4">
            <Input
              label="Logo URL"
              value={config.branding.logo.url}
              onChange={(e) => updateBranding(['logo', 'url'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="/logo.svg"
            />
            <Input
              label="Logo Alt Text"
              value={config.branding.logo.altText}
              onChange={(e) => updateBranding(['logo', 'altText'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="Company Logo"
            />
            <Input
              label="Home Link"
              value={config.branding.logo.homeLink}
              onChange={(e) => updateBranding(['logo', 'homeLink'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="/"
            />
            <Input
              label="Favicon URL"
              value={config.branding.favicon || ''}
              onChange={(e) => updateBranding(['favicon'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="/favicon.ico"
            />
          </div>
        </CardBody>
      </Card>

      {/* Contact */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            <Input
              label="Phone"
              value={config.branding.contact.phone}
              onChange={(e) => updateBranding(['contact', 'phone'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="+1 (555) 123-4567"
            />
            <Input
              label="Email"
              type="email"
              value={config.branding.contact.email}
              onChange={(e) => updateBranding(['contact', 'email'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="support@example.com"
            />
            <Input
              label="Business Hours"
              value={config.branding.contact.businessHours || ''}
              onChange={(e) => updateBranding(['contact', 'businessHours'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="Mon-Fri 9am-5pm"
            />
          </div>
        </CardBody>
      </Card>

      {/* Legal Links */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Legal Links</h3>
          <div className="space-y-4">
            <Input
              label="Privacy Policy URL"
              value={config.branding.legal.privacyPolicyUrl}
              onChange={(e) => updateBranding(['legal', 'privacyPolicyUrl'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="/privacy"
            />
            <Input
              label="Terms of Service URL"
              value={config.branding.legal.termsUrl}
              onChange={(e) => updateBranding(['legal', 'termsUrl'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="/terms"
            />
            <Input
              label="Return Policy URL"
              value={config.branding.legal.returnPolicyUrl}
              onChange={(e) => updateBranding(['legal', 'returnPolicyUrl'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="/returns"
            />
            <Input
              label="Shipping Policy URL"
              value={config.branding.legal.shippingPolicyUrl || ''}
              onChange={(e) => updateBranding(['legal', 'shippingPolicyUrl'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="/shipping"
            />
            <Input
              label="Cookies Policy URL"
              value={config.branding.legal.cookiesPolicyUrl || ''}
              onChange={(e) => updateBranding(['legal', 'cookiesPolicyUrl'], e.target.value)}
              variant="bordered"
              size="lg"
              placeholder="/cookies"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

