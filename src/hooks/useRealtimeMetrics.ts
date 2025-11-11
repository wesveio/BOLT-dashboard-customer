/**
 * Hook for real-time analytics metrics
 * 
 * Uses Server-Sent Events (SSE) to receive real-time updates
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export interface RealtimeMetric {
  metric: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  timestamp: string;
}

export interface UseRealtimeMetricsOptions {
  accountId: string;
  metrics?: string[];
  enabled?: boolean;
  apiUrl?: string;
}

export interface UseRealtimeMetricsResult {
  metrics: RealtimeMetric[];
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_METRICS_API_URL || 'http://localhost:3000';

/**
 * Hook for consuming real-time metrics via SSE
 */
export function useRealtimeMetrics(
  options: UseRealtimeMetricsOptions,
): UseRealtimeMetricsResult {
  const { accountId, metrics, enabled = true, apiUrl = DEFAULT_API_URL } = options;

  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetric[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !accountId) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build URL with query params
    const params = new URLSearchParams({ accountId });
    if (metrics && metrics.length > 0) {
      params.append('metrics', metrics.join(','));
    }

    const url = `${apiUrl}/api/boltmetrics/realtime?${params.toString()}`;

    try {
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'initial_metrics' || data.type === 'metrics_update') {
            setRealtimeMetrics(data.metrics || []);
          } else if (data.type === 'connected') {
            setIsConnected(true);
          }
        } catch (err) {
          console.error('❌ [DEBUG] Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('❌ [DEBUG] SSE connection error:', err);
        setIsConnected(false);
        setError(new Error('Connection error'));

        // Attempt to reconnect
        eventSource.close();

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff, max 30s

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError(new Error('Max reconnection attempts reached'));
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create connection'));
      setIsConnected(false);
    }
  }, [accountId, metrics, enabled, apiUrl]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (enabled && accountId) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled, accountId, connect]);

  return {
    metrics: realtimeMetrics,
    isConnected,
    error,
    reconnect,
  };
}

