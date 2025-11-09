# Hooks Documentation

This directory contains reusable React hooks for the dashboard application.

## Page Visibility and Polling

### Overview

All hooks that implement real-time polling or auto-refresh functionality must respect the page visibility state. This ensures that API calls are only made when the user is actively viewing the page, reducing unnecessary network traffic and server load.

### `usePageVisibility`

A hook that detects whether the current page/tab is visible to the user using the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

**Location**: `src/hooks/usePageVisibility.ts`

**Usage**:

```tsx
import { usePageVisibility } from '@/hooks/usePageVisibility';

function MyComponent() {
  const { isVisible } = usePageVisibility();
  
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      // Only runs when page is visible
      fetchData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isVisible]);
}
```

**Returns**:
- `isVisible: boolean` - `true` if the page is visible, `false` otherwise

**Behavior**:
- Automatically detects when user switches tabs or minimizes the window
- SSR-safe (assumes visible if API not available)
- Falls back gracefully if Page Visibility API is not supported

### Implementing Polling with Page Visibility

When creating or updating hooks that perform polling/auto-refresh, follow this pattern:

#### 1. Import the hook

```tsx
import { usePageVisibility } from './usePageVisibility';
```

#### 2. Use the hook in your component

```tsx
const { isVisible } = usePageVisibility();
const intervalRef = useRef<NodeJS.Timeout | null>(null);
const previousVisibleRef = useRef<boolean>(true);
```

#### 3. Condition polling on visibility

```tsx
useEffect(() => {
  if (!enabled || !isVisible) {
    // Clear interval if disabled or page not visible
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return;
  }

  // Set up polling interval
  intervalRef.current = setInterval(() => {
    // Double-check visibility before each fetch
    if (document.visibilityState === 'visible') {
      refetch();
    }
  }, pollingInterval);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [enabled, isVisible, pollingInterval, refetch]);
```

#### 4. Immediate refetch when page becomes visible

```tsx
useEffect(() => {
  // Only refetch if page just became visible (was hidden, now visible)
  if (enabled && isVisible && !previousVisibleRef.current) {
    console.info('✅ [DEBUG] Page became visible, refreshing data');
    refetch();
  }
  
  // Update previous visible state
  previousVisibleRef.current = isVisible;
}, [enabled, isVisible, refetch]);
```

### Complete Example

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePageVisibility } from './usePageVisibility';
import { useApi } from './useApi';

interface UseRealtimeDataOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

export function useRealtimeData(options: UseRealtimeDataOptions = {}) {
  const {
    pollingInterval = 10000, // 10 seconds
    enabled = true,
  } = options;

  const { data, isLoading, error, refetch } = useApi<DataResponse>(
    '/api/data',
    { enabled, refetchOnMount: true }
  );

  const { isVisible } = usePageVisibility();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousVisibleRef = useRef<boolean>(true);

  // Polling effect - only runs when page is visible
  useEffect(() => {
    if (!enabled || !isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setLastUpdated(new Date());

    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetch().then(() => {
          setLastUpdated(new Date());
        }).catch((err) => {
          console.error('❌ [DEBUG] Error polling data:', err);
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
    if (enabled && isVisible && !previousVisibleRef.current) {
      console.info('✅ [DEBUG] Page became visible, refreshing data');
      refetch().then(() => {
        setLastUpdated(new Date());
      }).catch((err) => {
        console.error('❌ [DEBUG] Error refreshing on visibility change:', err);
      });
    }
    
    previousVisibleRef.current = isVisible;
  }, [enabled, isVisible, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    lastUpdated,
  };
}
```

### Best Practices

1. **Always use `usePageVisibility`** for any hook that implements polling or auto-refresh
2. **Double-check visibility** before each fetch inside the interval callback
3. **Immediate refetch** when page becomes visible again to ensure data is up-to-date
4. **Track previous visibility state** using a ref to detect transitions
5. **Clean up intervals** properly to avoid memory leaks
6. **Document the behavior** in JSDoc comments

### Hooks That Implement This Pattern

- `useAbandonmentPredictionsRealtime` - Real-time abandonment predictions
- `usePersonalizationProfiles` - User profiles with real-time updates
- `useBoltXRealtime` - BoltX real-time predictions (in bckstg-checkout workspace)

### Notes

- Manual refresh operations (e.g., button clicks) are **not** affected by page visibility
- The hook is SSR-safe and works in all modern browsers
- If the Page Visibility API is not supported, the hook assumes the page is always visible (graceful degradation)

