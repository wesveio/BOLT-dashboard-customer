/**
 * Demo Mode Check Helper
 * 
 * Helper function to check demo mode and return mock data if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { shouldUseDemoData } from '@/lib/automation/demo-mode';
import { getMockDataFromRequest } from '@/lib/mock-data/mock-data-service';
import { apiSuccess } from './responses';

/**
 * Check if account is in demo mode and return mock data if so
 * Returns null if not in demo mode (continue with real data)
 */
export async function checkDemoModeAndReturnMock(
  accountId: string,
  endpoint: string,
  request: NextRequest
): Promise<NextResponse | null> {
  const isDemo = await shouldUseDemoData(accountId);
  
  if (isDemo) {
    console.info(`✅ [DEBUG] Account in demo mode, returning mock data for: ${endpoint}`);
    const mockData = await getMockDataFromRequest(endpoint, accountId, request);
    return NextResponse.json(mockData);
  }
  
  return null;
}

/**
 * Check demo mode and return mock data using apiSuccess
 */
export async function checkDemoModeAndReturnMockSuccess(
  endpoint: string,
  accountId: string,
  request: NextRequest
): Promise<NextResponse | null> {
  const isDemo = await shouldUseDemoData(accountId);
  
  if (isDemo) {
    console.info(`✅ [DEBUG] Account in demo mode, returning mock data for: ${endpoint}`);
    const mockData = await getMockDataFromRequest(endpoint, accountId, request);
    return apiSuccess(mockData);
  }
  
  return null;
}

