'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Period } from '@/utils/default-data';
import { getMaxPeriodDays, validateCustomPeriodRange } from '@/utils/date-ranges';
import { usePlanAccess } from '@/hooks/usePlanAccess';

interface PeriodContextType {
  period: Period;
  setPeriod: (period: Period) => void;
  startDate: Date | null;
  endDate: Date | null;
  setCustomPeriod: (startDate: Date, endDate: Date) => void;
  maxPeriodDays: number;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

const STORAGE_KEY_PERIOD = 'dashboard-period';
const STORAGE_KEY_START = 'dashboard-period-start';
const STORAGE_KEY_END = 'dashboard-period-end';

export function PeriodProvider({ children }: { children: ReactNode }) {
  const { currentPlan } = usePlanAccess();
  const [period, setPeriodState] = useState<Period>('week');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const maxPeriodDays = getMaxPeriodDays(currentPlan);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedPeriod = localStorage.getItem(STORAGE_KEY_PERIOD);
      const savedStart = localStorage.getItem(STORAGE_KEY_START);
      const savedEnd = localStorage.getItem(STORAGE_KEY_END);

      if (savedPeriod) {
        const parsedPeriod = savedPeriod as Period;
        setPeriodState(parsedPeriod);

        // Load custom dates if period is custom
        if (parsedPeriod === 'custom' && savedStart && savedEnd) {
          const parsedStart = new Date(savedStart);
          const parsedEnd = new Date(savedEnd);
          
          // Validate dates are still valid
          if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
            // Re-validate against current plan limits
            if (validateCustomPeriodRange(parsedStart, parsedEnd, currentPlan)) {
              setStartDate(parsedStart);
              setEndDate(parsedEnd);
            } else {
              // If saved range exceeds current plan limit, reset to week
              setPeriodState('week');
              setStartDate(null);
              setEndDate(null);
            }
          }
        }
      }
    } catch (error) {
      console.warn('‼️ [DEBUG] Failed to load period state from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []); // Only run on mount

  // Save period to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY_PERIOD, period);
        if (period === 'custom' && startDate && endDate) {
          localStorage.setItem(STORAGE_KEY_START, startDate.toISOString());
          localStorage.setItem(STORAGE_KEY_END, endDate.toISOString());
        } else {
          // Clear custom dates when not using custom period
          localStorage.removeItem(STORAGE_KEY_START);
          localStorage.removeItem(STORAGE_KEY_END);
        }
      } catch (error) {
        console.warn('‼️ [DEBUG] Failed to save period state to localStorage:', error);
      }
    }
  }, [period, startDate, endDate, isInitialized]);

  // Validate and update period when plan changes
  useEffect(() => {
    if (isInitialized && period === 'custom' && startDate && endDate) {
      // Re-validate custom period against current plan
      if (!validateCustomPeriodRange(startDate, endDate, currentPlan)) {
        // If range exceeds new plan limit, reset to week
        setPeriodState('week');
        setStartDate(null);
        setEndDate(null);
      }
    }
  }, [currentPlan, isInitialized, period, startDate, endDate]);

  const setPeriod = useCallback((newPeriod: Period) => {
    setPeriodState(newPeriod);
    if (newPeriod !== 'custom') {
      setStartDate(null);
      setEndDate(null);
    }
  }, []);

  const setCustomPeriod = useCallback((newStartDate: Date, newEndDate: Date) => {
    // Validate range before setting
    if (!validateCustomPeriodRange(newStartDate, newEndDate, currentPlan)) {
      console.warn('‼️ [DEBUG] Custom period range exceeds plan limit');
      return;
    }

    setPeriodState('custom');
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [currentPlan]);

  const value: PeriodContextType = {
    period,
    setPeriod,
    startDate,
    endDate,
    setCustomPeriod,
    maxPeriodDays,
  };

  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}

/**
 * Hook to access period context
 * Must be used within PeriodProvider
 */
export function usePeriod() {
  const context = useContext(PeriodContext);
  if (context === undefined) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}

