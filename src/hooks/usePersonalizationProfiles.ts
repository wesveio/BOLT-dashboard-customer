'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useApi } from './useApi';
import { usePageVisibility } from './usePageVisibility';
import type { Period } from '@/utils/default-data';

export interface UserProfile {
  id: string;
  session_id: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  behavior?: {
    timeOnSite?: number;
    pagesVisited?: number;
    checkoutAttempts?: number;
    previousPurchases?: number;
    avgOrderValue?: number;
  };
  preferences?: {
    preferredPaymentMethod?: string;
    preferredShippingMethod?: string;
    preferredLanguage?: string;
  };
  inferred_intent?: {
    urgency?: 'low' | 'medium' | 'high';
    priceSensitivity?: 'low' | 'medium' | 'high';
    devicePreference?: 'mobile' | 'desktop';
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Helper type for transformed profile (camelCase)
export interface UserProfileTransformed {
  id: string;
  sessionId: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  behavior?: {
    timeOnSite?: number;
    pagesVisited?: number;
    checkoutAttempts?: number;
    previousPurchases?: number;
    avgOrderValue?: number;
  };
  preferences?: {
    preferredPaymentMethod?: string;
    preferredShippingMethod?: string;
    preferredLanguage?: string;
  };
  inferredIntent?: {
    urgency?: 'low' | 'medium' | 'high';
    priceSensitivity?: 'low' | 'medium' | 'high';
    devicePreference?: 'mobile' | 'desktop';
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean; // Updated in last 24h
}

export interface ProfilesResponse {
  profiles: UserProfile[];
  deviceDistribution: Record<string, number>;
  activeProfiles: number;
  totalProfiles: number;
  period: Period;
}

// Transform profile from snake_case to camelCase
function transformProfile(profile: UserProfile): UserProfileTransformed {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const isActive = new Date(profile.updated_at) >= yesterday;

  return {
    id: profile.id,
    sessionId: profile.session_id,
    deviceType: profile.device_type,
    browser: profile.browser,
    location: profile.location,
    behavior: profile.behavior,
    preferences: profile.preferences,
    inferredIntent: profile.inferred_intent,
    metadata: profile.metadata,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    isActive,
  };
}

interface UsePersonalizationProfilesOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'all';
  status?: 'active' | 'inactive' | 'all';
  pollingInterval?: number; // milliseconds
  enabled?: boolean;
}

/**
 * Hook for fetching user profiles with filters and real-time polling
 * 
 * **Polling Behavior:**
 * - Polling automatically pauses when the page/tab is not visible (user switched tabs or minimized window)
 * - Polling resumes automatically when the page becomes visible again
 * - When resuming, an immediate refetch is performed to ensure data is up-to-date
 * - Manual refetch operations (e.g., button clicks) are not affected by page visibility
 * 
 * @param options - Configuration options for the hook
 * @param options.period - Time period for profiles
 * @param options.deviceType - Filter by device type ('mobile' | 'desktop' | 'tablet' | 'all')
 * @param options.status - Filter by status ('active' | 'inactive' | 'all')
 * @param options.pollingInterval - Interval between polling requests in milliseconds (default: 10000)
 * @param options.enabled - Whether polling is enabled (default: true)
 * 
 * @example
 * ```tsx
 * const { profiles, lastUpdated } = usePersonalizationProfiles({
 *   period: 'week',
 *   deviceType: 'mobile',
 *   pollingInterval: 10000, // 10 seconds
 *   enabled: true
 * });
 * ```
 */
export function usePersonalizationProfiles(options: UsePersonalizationProfilesOptions = {}) {
  const {
    period = 'week',
    startDate,
    endDate,
    deviceType,
    status,
    pollingInterval = 10000, // 10 seconds default
    enabled = true,
  } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    if (deviceType && deviceType !== 'all') params.append('deviceType', deviceType);
    if (status && status !== 'all') params.append('status', status);
    return `/api/boltx/personalization/profiles?${params.toString()}`;
  }, [period, startDate, endDate, deviceType, status]);

  const { data, isLoading, error, refetch } = useApi<ProfilesResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `profiles_${period}_${deviceType || 'all'}_${status || 'all'}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  const { isVisible } = usePageVisibility();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousVisibleRef = useRef<boolean>(true);

  // Transform profiles
  const transformedProfiles = useMemo(() => {
    return (data?.profiles || []).map(transformProfile);
  }, [data?.profiles]);

  // Separate active from inactive profiles
  const { activeProfiles, inactiveProfiles } = useMemo(() => {
    const active: UserProfileTransformed[] = [];
    const inactive: UserProfileTransformed[] = [];

    transformedProfiles.forEach((profile) => {
      if (profile.isActive) {
        active.push(profile);
      } else {
        inactive.push(profile);
      }
    });

    return {
      activeProfiles: active,
      inactiveProfiles: inactive,
    };
  }, [transformedProfiles]);

  // Polling effect - only runs when page is visible
  useEffect(() => {
    if (!enabled || !isVisible) {
      // Clear interval if disabled or page not visible
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial update
    setLastUpdated(new Date());

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      // Double-check visibility before each fetch
      if (document.visibilityState === 'visible') {
        refetch().then(() => {
          setLastUpdated(new Date());
        }).catch((err) => {
          console.error('❌ [DEBUG] Error polling profiles:', err);
        });
      }
    }, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isVisible, pollingInterval, refetch]);

  // Immediate refetch when page becomes visible again
  useEffect(() => {
    // Only refetch if page just became visible (was hidden, now visible)
    if (enabled && isVisible && !previousVisibleRef.current) {
      console.info('✅ [DEBUG] Page became visible, refreshing profiles data');
      refetch().then(() => {
        setLastUpdated(new Date());
      }).catch((err) => {
        console.error('❌ [DEBUG] Error refreshing profiles on visibility change:', err);
      });
    }
    
    // Update previous visible state
    previousVisibleRef.current = isVisible;
  }, [enabled, isVisible, refetch]);

  return {
    profiles: transformedProfiles,
    activeProfiles,
    inactiveProfiles,
    deviceDistribution: data?.deviceDistribution || {},
    activeProfilesCount: data?.activeProfiles || 0,
    totalProfiles: data?.totalProfiles || 0,
    isLoading,
    error,
    refetch,
    lastUpdated,
    period: data?.period || period,
  };
}

