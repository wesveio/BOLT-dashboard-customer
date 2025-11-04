'use client';

import { FeatureToggleGroup, type FeatureToggle } from '../FeatureToggleGroup';
import type { ExpandedThemeConfig } from '../types';

interface FeaturesTabProps {
  config: ExpandedThemeConfig;
  onChange: (config: ExpandedThemeConfig) => void;
}

export function FeaturesTab({ config, onChange }: FeaturesTabProps) {
  const updateFeature = (category: keyof ExpandedThemeConfig['features'], feature: string, value: boolean) => {
    const newConfig = { ...config };
    (newConfig.features[category] as any)[feature] = value;
    onChange(newConfig);
  };

  // Build feature toggles from config
  const allFeatures: FeatureToggle[] = [
    // Checkout features
    ...Object.entries(config.features.checkout).map(([key]) => ({
      id: `checkout.${key}`,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: `Enable ${key} feature in checkout`,
      category: 'Checkout',
    })),
    // Cart features
    ...Object.entries(config.features.cart).map(([key]) => ({
      id: `cart.${key}`,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: `Enable ${key} feature in cart`,
      category: 'Cart',
    })),
    // Profile features
    ...Object.entries(config.features.profile).map(([key]) => ({
      id: `profile.${key}`,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: `Enable ${key} feature in profile`,
      category: 'Profile',
    })),
    // Shipping features
    ...Object.entries(config.features.shipping).map(([key]) => ({
      id: `shipping.${key}`,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: `Enable ${key} feature in shipping`,
      category: 'Shipping',
    })),
    // Payment features
    ...Object.entries(config.features.payment).map(([key]) => ({
      id: `payment.${key}`,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: `Enable ${key} feature in payment`,
      category: 'Payment',
    })),
    // UX features
    ...Object.entries(config.features.ux).map(([key]) => ({
      id: `ux.${key}`,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: `Enable ${key} feature`,
      category: 'User Experience',
    })),
    // Analytics features
    ...Object.entries(config.features.analytics).map(([key]) => ({
      id: `analytics.${key}`,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: `Enable ${key} feature`,
      category: 'Analytics',
    })),
    // Security features
    ...Object.entries(config.features.security).map(([key]) => ({
      id: `security.${key}`,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: `Enable ${key} feature`,
      category: 'Security',
    })),
  ];

  const featureValues = allFeatures.reduce((acc, feature) => {
    const [category, key] = feature.id.split('.');
    const categoryKey = category as keyof ExpandedThemeConfig['features'];
    acc[feature.id] = (config.features[categoryKey] as any)[key];
    return acc;
  }, {} as Record<string, boolean>);

  const handleToggle = (id: string, value: boolean) => {
    const [category, key] = id.split('.');
    updateFeature(category as keyof ExpandedThemeConfig['features'], key, value);
  };

  return (
    <div className="space-y-6">
      <FeatureToggleGroup
        title="Feature Toggles"
        features={allFeatures}
        values={featureValues}
        onChange={handleToggle}
      />
    </div>
  );
}

