'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect page visibility using the Page Visibility API
 * 
 * Returns whether the current page/tab is visible to the user.
 * Automatically pauses polling/refresh operations when the page is not visible
 * (e.g., user switched to another tab or minimized the window).
 * 
 * @returns {boolean} `true` if the page is visible, `false` otherwise
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isVisible } = usePageVisibility();
 *   
 *   useEffect(() => {
 *     if (!isVisible) return;
 *     
 *     const interval = setInterval(() => {
 *       // Only runs when page is visible
 *       fetchData();
 *     }, 5000);
 *     
 *     return () => clearInterval(interval);
 *   }, [isVisible]);
 * }
 * ```
 */
export function usePageVisibility(): { isVisible: boolean } {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // SSR-safe: assume visible if API not available
    if (typeof window === 'undefined') {
      return true;
    }
    
    // Check initial visibility state
    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    // SSR-safe: only run on client
    if (typeof window === 'undefined') {
      return;
    }

    // Check if Page Visibility API is supported
    if (typeof document.visibilityState === 'undefined') {
      // If not supported, assume always visible
      console.warn('⚠️ [DEBUG] Page Visibility API not supported, assuming page is always visible');
      return;
    }

    // Update state based on initial visibility
    setIsVisible(document.visibilityState === 'visible');

    /**
     * Handle visibility change events
     * Fires when user switches tabs, minimizes window, etc.
     */
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      
      if (visible) {
        console.info('✅ [DEBUG] Page became visible, polling will resume');
      } else {
        console.info('⏸️ [DEBUG] Page became hidden, polling will pause');
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isVisible };
}

