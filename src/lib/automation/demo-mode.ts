/**
 * Demo Mode Service
 * 
 * Handles demo mode logic for accounts without active subscriptions.
 * Accounts in demo mode can access the dashboard but see only mock data.
 */

import { getSupabaseAdmin } from '@/lib/supabase';

export interface DemoModeStatus {
  isDemoMode: boolean;
  hasActiveSubscription: boolean;
  accountStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  canUpgrade: boolean;
}

/**
 * Check if an account is in demo mode
 * Demo mode = account without active subscription
 */
export async function isAccountInDemoMode(accountId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();

    // Check if account has active subscription
    const { data: subscriptions, error } = await supabase.rpc(
      'get_subscriptions_by_account',
      { p_account_id: accountId }
    );

    if (error) {
      console.error('❌ [DEBUG] Error checking demo mode:', error);
      // Default to demo mode if we can't check
      return true;
    }

    // Check if there's an active subscription
    const hasActiveSubscription = (subscriptions || []).some(
      (sub: any) => sub.status === 'active'
    );

    return !hasActiveSubscription;
  } catch (error) {
    console.error('❌ [DEBUG] Error in isAccountInDemoMode:', error);
    return true; // Default to demo mode on error
  }
}

/**
 * Get demo mode status for an account
 */
export async function getDemoModeStatus(accountId: string): Promise<DemoModeStatus> {
  try {
    const supabase = getSupabaseAdmin();

    // Get account info
    const { data: accounts, error: accountError } = await supabase.rpc(
      'get_account_by_id',
      { p_account_id: accountId }
    );

    if (accountError || !accounts || accounts.length === 0) {
      return {
        isDemoMode: true,
        hasActiveSubscription: false,
        accountStatus: 'trial',
        canUpgrade: true,
      };
    }

    const account = accounts[0];

    // Check subscriptions
    const { data: subscriptions, error: subError } = await supabase.rpc(
      'get_subscriptions_by_account',
      { p_account_id: accountId }
    );

    const hasActiveSubscription = !subError && (subscriptions || []).some(
      (sub: any) => sub.status === 'active'
    );

    const isDemoMode = !hasActiveSubscription;

    return {
      isDemoMode,
      hasActiveSubscription,
      accountStatus: (account.status || 'trial') as 'trial' | 'active' | 'suspended' | 'cancelled',
      canUpgrade: isDemoMode,
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error in getDemoModeStatus:', error);
    return {
      isDemoMode: true,
      hasActiveSubscription: false,
      accountStatus: 'trial',
      canUpgrade: true,
    };
  }
}

/**
 * Check if account should show demo data
 * This is the main function to use in API routes
 */
export async function shouldUseDemoData(accountId: string): Promise<boolean> {
  return await isAccountInDemoMode(accountId);
}

/**
 * Get mock data for demo mode
 * Returns sample data that matches the structure of real data
 * 
 * @deprecated Use getMockDataForEndpoint from mock-data-service instead
 */
export function getMockData<T>(dataType: string, accountId?: string, period?: string): T {
  if (accountId) {
    const { getMockDataForEndpoint } = require('@/lib/mock-data/mock-data-service');
    return getMockDataForEndpoint(dataType, accountId, period as any) as T;
  }
  
  console.warn(`⚠️ [DEBUG] Using mock data for: ${dataType} (no accountId provided)`);
  return {} as T;
}

