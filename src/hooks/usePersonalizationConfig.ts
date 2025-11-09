'use client';

import { useApi, useApiPatch } from './useApi';

export interface DeviceRule {
  layoutVariant?: 'mobile-first' | 'desktop-first';
  fieldOrder?: string[];
}

export interface PersonalizationConfig {
  enabled: boolean;
  confidenceThreshold?: number;
  deviceRules?: Record<string, DeviceRule>;
  stepMessages?: Record<string, string>;
  fieldOrderByStep?: Record<string, string[]>;
}

interface UsePersonalizationConfigResult {
  config: PersonalizationConfig | null;
  isLoading: boolean;
  error: any;
  refetch: () => Promise<void>;
  updateConfig: (config: PersonalizationConfig) => Promise<boolean>;
  isSaving: boolean;
}

/**
 * Hook for fetching and updating personalization configuration
 */
export function usePersonalizationConfig(): UsePersonalizationConfigResult {
  const { data, isLoading, error, refetch } = useApi<PersonalizationConfig>(
    '/api/boltx/personalization/config',
    {
      cacheKey: 'personalization_config',
      cacheTTL: 1,
      refetchOnMount: true,
    }
  );

  const { mutate: updateConfig, isLoading: isSaving } = useApiPatch<PersonalizationConfig>();

  const handleUpdate = async (config: PersonalizationConfig): Promise<boolean> => {
    try {
      const result = await updateConfig('/api/boltx/personalization/config', config);
      if (result) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating personalization config:', error);
      return false;
    }
  };

  return {
    config: data,
    isLoading,
    error,
    refetch,
    updateConfig: handleUpdate,
    isSaving,
  };
}

