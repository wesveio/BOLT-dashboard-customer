'use client';

import { Switch, Card, CardBody } from '@heroui/react';

export interface FeatureToggle {
  id: string;
  label: string;
  description?: string;
  category: string;
}

interface FeatureToggleGroupProps {
  title: string;
  features: FeatureToggle[];
  values: Record<string, boolean>;
  onChange: (id: string, value: boolean) => void;
}

export function FeatureToggleGroup({ title, features, values, onChange }: FeatureToggleGroupProps) {
  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureToggle[]>);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      
      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <Card key={category} className="border border-default">
          <CardBody className="p-6">
            <h4 className="text-md font-semibold text-foreground/80 mb-4 capitalize">{category}</h4>
            <div className="space-y-4">
              {categoryFeatures.map((feature) => (
                <div key={feature.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-foreground cursor-pointer">
                      {feature.label}
                    </label>
                    {feature.description && (
                      <p className="text-xs text-foreground/60 mt-1">{feature.description}</p>
                    )}
                  </div>
                  <Switch
                    isSelected={values[feature.id] ?? false}
                    onValueChange={(value) => onChange(feature.id, value)}
                    size="sm"
                    color="primary"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

