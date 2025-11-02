'use client';

import { CheckIcon } from '@heroicons/react/24/solid';
import { getPlanFeatures, BOLT_FEATURES } from '@/utils/plans';

interface FeatureListProps {
  featureCodes: string[];
  showDescriptions?: boolean;
}

export function FeatureList({ featureCodes, showDescriptions = true }: FeatureListProps) {
  const features = getPlanFeatures(featureCodes);

  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature.code} className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mt-0.5">
            <CheckIcon className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{feature.name}</p>
            {showDescriptions && (
              <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

