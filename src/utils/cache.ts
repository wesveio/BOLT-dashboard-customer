/**
 * Cache utilities for client-side caching
 * Implements localStorage-based caching with TTL (Time To Live)
 */

const CACHE_PREFIX = 'bolt_';
const CACHE_VERSION = '1';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Get cached data if it exists and is still valid
 */
export function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}_v${CACHE_VERSION}`);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now > entry.expiresAt) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}_v${CACHE_VERSION}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export function setCachedData<T>(key: string, data: T, ttlMinutes: number = 60): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMinutes * 60 * 1000,
    };

    localStorage.setItem(`${CACHE_PREFIX}${key}_v${CACHE_VERSION}`, JSON.stringify(entry));
  } catch (error) {
    console.error('Error setting cache:', error);
    // Handle quota exceeded or other storage errors gracefully
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Clear old cache entries
      clearOldCacheEntries();
      // Retry once
      try {
        const retryEntry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttlMinutes * 60 * 1000,
        };
        localStorage.setItem(`${CACHE_PREFIX}${key}_v${CACHE_VERSION}`, JSON.stringify(retryEntry));
      } catch (retryError) {
        console.error('Failed to cache after cleanup:', retryError);
      }
    }
  }
}

/**
 * Clear expired cache entries
 */
function clearOldCacheEntries(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const entry: CacheEntry<any> = JSON.parse(localStorage.getItem(key) || '{}');
          if (entry.expiresAt && now > entry.expiresAt) {
            localStorage.removeItem(key);
          }
        } catch {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCachedData(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${CACHE_PREFIX}${key}_v${CACHE_VERSION}`);
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Check if cache exists and is valid
 */
export function isCachedDataValid(key: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}_v${CACHE_VERSION}`);
    if (!cached) return false;

    const entry: CacheEntry<any> = JSON.parse(cached);
    return Date.now() <= entry.expiresAt;
  } catch {
    return false;
  }
}

