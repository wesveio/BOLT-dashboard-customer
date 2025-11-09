'use client';

import { useApi } from './useApi';
import { useApiPatch } from './useApi';

export interface AppFeatureFlags {
  event_tracking_enabled: boolean;
  bolt_plugin_enabled: boolean;
  console_plugin_enabled: boolean;
  logging_enabled: boolean;
}

export interface FeatureFlagsResponse {
  flags: AppFeatureFlags;
}

/**
 * Hook to manage app feature flags
 */
export function useFeatureFlags() {
  const { data, isLoading, error, refetch } = useApi<FeatureFlagsResponse>(
    '/api/feature-flags',
    {
      cacheKey: 'app-feature-flags',
      cacheTTL: 5, // 5 minutes
    }
  );

  const { mutate: updateFlags, isLoading: isSaving, error: saveError } = useApiPatch<
    FeatureFlagsResponse,
    Partial<AppFeatureFlags>
  >();

  const updateFeatureFlags = async (flags: Partial<AppFeatureFlags>): Promise<boolean> => {
    const result = await updateFlags('/api/feature-flags', flags);
    if (result) {
      // Refetch to get updated data
      await refetch();
      return true;
    }
    return false;
  };

  return {
    flags: data?.flags || null,
    isLoading,
    error,
    isSaving,
    saveError,
    updateFeatureFlags,
    refetch,
  };
}

