'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch, apiDelete, ApiError, isSessionError, ApiClientOptions } from '@/utils/api-client';
import { getCachedData, setCachedData, clearCachedData } from '@/utils/cache';

export interface UseApiOptions {
  enabled?: boolean;
  cacheKey?: string;
  cacheTTL?: number; // in minutes
  refetchOnMount?: boolean;
  deduplicateRequests?: boolean;
}

export interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Generic hook for API calls with loading, error, and data states
 * Supports caching, request deduplication, and automatic refetching
 */
export function useApi<T>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    enabled = true,
    cacheKey,
    cacheTTL = 5, // 5 minutes default
    refetchOnMount = true,
    deduplicateRequests = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && refetchOnMount);
  const [error, setError] = useState<ApiError | null>(null);
  const router = useRouter();

  // Request deduplication refs
  const isFetchingRef = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  /**
   * Fetch data from API with caching and deduplication
   */
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first if cacheKey is provided
    if (cacheKey) {
      const cached = getCachedData<T>(cacheKey);
      if (cached !== null) {
        setData(cached);
        setIsLoading(false);
        // Still fetch in background to update cache
        // but don't block UI update
      }
    }

    // Deduplicate requests if enabled
    if (deduplicateRequests && isFetchingRef.current && fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    const fetchPromise = (async () => {
      try {
        const result = await apiGet<T>(endpoint);

        if (!mountedRef.current) return;

        setData(result);
        setError(null);

        // Cache the result if cacheKey is provided
        if (cacheKey) {
          setCachedData(cacheKey, result, cacheTTL);
        }
      } catch (err) {
        if (!mountedRef.current) return;

        const apiError = err as ApiError;
        setError(apiError);
        console.error(`[DEBUG] API Error (${endpoint}):`, apiError);

        // Redirect to login if session is invalid/expired
        if (isSessionError(apiError) && typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          
          // Don't redirect if already on login page or if endpoint is auth-related
          if (currentPath !== '/login' && !endpoint.includes('/api/dashboard/auth/')) {
            console.warn('⚠️ [DEBUG] Session expired, redirecting to login');
            router.push('/login');
          }
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          isFetchingRef.current = false;
          fetchPromiseRef.current = null;
        }
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [endpoint, enabled, cacheKey, cacheTTL, deduplicateRequests, router]);

  /**
   * Refetch data manually
   */
  const refetch = useCallback(async () => {
    if (cacheKey) {
      clearCachedData(cacheKey);
    }
    await fetchData();
  }, [fetchData, cacheKey]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    if (cacheKey) {
      clearCachedData(cacheKey);
    }
  }, [cacheKey]);

  // Initial fetch on mount and when endpoint changes
  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [endpoint, enabled, refetchOnMount, fetchData]); // Include endpoint and fetchData to react to period changes

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    clearCache,
  };
}

/**
 * Hook for POST requests
 */
export function useApiPost<TResponse, TBody = unknown>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const router = useRouter();

  const mutate = useCallback(
    async (
      endpoint: string,
      body?: TBody,
      options?: Omit<ApiClientOptions, 'method' | 'body'>
    ): Promise<TResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiPost<TResponse>(endpoint, body, options);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error(`[DEBUG] API POST Error (${endpoint}):`, apiError);

        // Redirect to login if session is invalid/expired
        if (isSessionError(apiError) && typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          
          // Don't redirect if already on login page or if endpoint is auth-related
          if (currentPath !== '/login' && !endpoint.includes('/api/dashboard/auth/')) {
            console.warn('⚠️ [DEBUG] Session expired, redirecting to login');
            router.push('/login');
          }
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return {
    mutate,
    isLoading,
    error,
  };
}

/**
 * Hook for PATCH requests
 */
export function useApiPatch<TResponse, TBody = unknown>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const router = useRouter();

  const mutate = useCallback(
    async (endpoint: string, body?: TBody): Promise<TResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiPatch<TResponse>(endpoint, body);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error(`[DEBUG] API PATCH Error (${endpoint}):`, apiError);

        // Redirect to login if session is invalid/expired
        if (isSessionError(apiError) && typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          
          // Don't redirect if already on login page or if endpoint is auth-related
          if (currentPath !== '/login' && !endpoint.includes('/api/dashboard/auth/')) {
            console.warn('⚠️ [DEBUG] Session expired, redirecting to login');
            router.push('/login');
          }
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return {
    mutate,
    isLoading,
    error,
  };
}

/**
 * Hook for DELETE requests
 */
export function useApiDelete<TResponse>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const router = useRouter();

  const mutate = useCallback(
    async (endpoint: string): Promise<TResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiDelete<TResponse>(endpoint);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        console.error(`[DEBUG] API DELETE Error (${endpoint}):`, apiError);

        // Redirect to login if session is invalid/expired
        if (isSessionError(apiError) && typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          
          // Don't redirect if already on login page or if endpoint is auth-related
          if (currentPath !== '/login' && !endpoint.includes('/api/dashboard/auth/')) {
            console.warn('⚠️ [DEBUG] Session expired, redirecting to login');
            router.push('/login');
          }
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return {
    mutate,
    isLoading,
    error,
  };
}

