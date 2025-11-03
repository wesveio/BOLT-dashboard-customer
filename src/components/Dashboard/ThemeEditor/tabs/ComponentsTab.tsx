'use client';

import { ComponentConfigPanel } from '../ComponentConfigPanel';
import type { ExpandedThemeConfig } from '../types';

interface ComponentsTabProps {
  config: ExpandedThemeConfig;
  onChange: (config: ExpandedThemeConfig) => void;
}

export function ComponentsTab({ config, onChange }: ComponentsTabProps) {
  const updateComponent = (component: keyof ExpandedThemeConfig['components'], componentConfig: any) => {
    const newConfig = { ...config };
    newConfig.components[component] = componentConfig;
    onChange(newConfig);
  };

  return (
    <div className="space-y-6">
      <ComponentConfigPanel
        component="orderSummary"
        config={config.components.orderSummary}
        onChange={(comp, compConfig) => updateComponent(comp, compConfig)}
      />
      <ComponentConfigPanel
        component="payment"
        config={config.components.payment}
        onChange={(comp, compConfig) => updateComponent(comp, compConfig)}
      />
      <ComponentConfigPanel
        component="cart"
        config={config.components.cart}
        onChange={(comp, compConfig) => updateComponent(comp, compConfig)}
      />
      <ComponentConfigPanel
        component="shipping"
        config={config.components.shipping}
        onChange={(comp, compConfig) => updateComponent(comp, compConfig)}
      />
    </div>
  );
}

