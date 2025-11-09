'use client';

import { useMemo } from 'react';
import { useApi } from './useApi';
import type { Period } from '@/utils/default-data';

export interface Intervention {
  id: string;
  session_id: string;
  order_form_id?: string;
  intervention_type: 'discount' | 'security' | 'simplify' | 'progress';
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  applied: boolean;
  applied_at?: string;
  result?: 'converted' | 'abandoned' | 'pending';
  metadata?: Record<string, any>;
  created_at: string;
}

// Helper type for transformed intervention (camelCase)
export interface InterventionTransformed {
  id: string;
  sessionId: string;
  orderFormId?: string;
  type: 'discount' | 'security' | 'simplify' | 'progress';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  applied: boolean;
  appliedAt?: string;
  result?: 'converted' | 'abandoned' | 'pending';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InterventionsResponse {
  interventions: Intervention[];
  effectivenessByType: Record<string, {
    total: number;
    applied: number;
    converted: number;
    abandoned: number;
    conversionRate: number;
  }>;
  period: Period;
  total: number;
}

// Transform intervention from snake_case to camelCase
function transformIntervention(intervention: Intervention): InterventionTransformed {
  return {
    id: intervention.id,
    sessionId: intervention.session_id,
    orderFormId: intervention.order_form_id,
    type: intervention.intervention_type,
    riskScore: intervention.risk_score,
    riskLevel: intervention.risk_level,
    applied: intervention.applied,
    appliedAt: intervention.applied_at,
    result: intervention.result,
    metadata: intervention.metadata,
    createdAt: intervention.created_at,
  };
}

interface UseInterventionsDataOptions {
  period?: Period;
  startDate?: Date | null;
  endDate?: Date | null;
  type?: 'discount' | 'security' | 'simplify' | 'progress';
  status?: 'applied' | 'not-applied';
  result?: 'converted' | 'abandoned' | 'pending';
  enabled?: boolean;
}

/**
 * Hook for fetching interventions data with filters
 */
export function useInterventionsData(options: UseInterventionsDataOptions = {}) {
  const {
    period = 'week',
    startDate,
    endDate,
    type,
    status,
    result,
    enabled = true,
  } = options;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'custom' && startDate && endDate) {
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (result) params.append('result', result);
    return `/api/boltx/interventions?${params.toString()}`;
  }, [period, startDate, endDate, type, status, result]);

  const { data, isLoading, error, refetch } = useApi<InterventionsResponse>(
    endpoint,
    {
      enabled,
      cacheKey: `interventions_${period}_${type || 'all'}_${status || 'all'}_${result || 'all'}`,
      cacheTTL: 5,
      deduplicateRequests: true,
      refetchOnMount: true,
    }
  );

  const transformedInterventions = useMemo(() => {
    return (data?.interventions || []).map(transformIntervention);
  }, [data?.interventions]);

  return {
    interventions: transformedInterventions,
    effectivenessByType: data?.effectivenessByType || {},
    isLoading,
    error,
    refetch,
    period: data?.period || period,
    total: data?.total || 0,
  };
}

