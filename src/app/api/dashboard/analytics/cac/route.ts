import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

export const dynamic = 'force-dynamic';

/**
 * Extract revenue from event metadata with multiple fallbacks
 */
function extractRevenue(event: AnalyticsEvent): number {
  const metadata = event.metadata || {};
  const revenueValue =
    metadata.revenue ??
    metadata.value ??
    metadata.orderValue ??
    metadata.totalValue ??
    metadata.amount ??
    null;

  if (revenueValue === null || revenueValue === undefined) {
    return 0;
  }

  const numValue = typeof revenueValue === 'number'
    ? revenueValue
    : parseFloat(String(revenueValue));

  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }

  return numValue;
}

/**
 * GET /api/dashboard/analytics/cac
 * Get Customer Acquisition Cost (CAC) and LTV:CAC ratio analytics
 * 
 * Note: CAC calculation requires marketing spend data which may not be available.
 * This implementation provides:
 * 1. Estimated CAC based on available data (utm_source, referrer)
 * 2. LTV:CAC ratio using LTV data
 * 3. Placeholder for manual marketing spend input (future enhancement)
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Parse custom date range if period is custom
    let customStartDate: Date | null = null;
    let customEndDate: Date | null = null;

    if (period === 'custom') {
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      
      if (startDateParam && endDateParam) {
        customStartDate = new Date(startDateParam);
        customEndDate = new Date(endDateParam);
        
        // Validate dates
        if (isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
          return apiError('Invalid date format. Use ISO 8601 format.', 400);
        }
      }
    }

    // Calculate date range
    const range = getDateRange(period, customStartDate, customEndDate);

    // Query checkout_start events to identify new customer acquisitions
    const { data: checkoutStartEvents, error: checkoutStartError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_start'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (checkoutStartError) {
      console.error('Get CAC checkout start events error:', checkoutStartError);
      return apiError('Failed to fetch CAC data', 500);
    }

    // Query completed checkout events for LTV calculation
    const { data: checkoutCompleteEvents, error: checkoutCompleteError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete', 'order_confirmed'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (checkoutCompleteError) {
      console.error('Get CAC checkout complete events error:', checkoutCompleteError);
      return apiError('Failed to fetch checkout complete events', 500);
    }

    // Group new customers by acquisition channel
    const channelStats: Record<string, {
      sessions: Set<string>;
      conversions: number;
      revenue: number;
    }> = {};

    checkoutStartEvents?.forEach((event: AnalyticsEvent) => {
      const metadata = event.metadata || {};

      // Try to identify acquisition channel from metadata
      const channel =
        (metadata.utm_source as string) ||
        (metadata.referrer as string) ||
        (metadata.channel as string) ||
        'direct';

      const normalizedChannel = channel.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (!channelStats[normalizedChannel]) {
        channelStats[normalizedChannel] = {
          sessions: new Set(),
          conversions: 0,
          revenue: 0,
        };
      }

      channelStats[normalizedChannel].sessions.add(event.session_id);
    });

    // Match conversions to channels
    checkoutCompleteEvents?.forEach((event: AnalyticsEvent) => {
      const revenue = extractRevenue(event);
      if (revenue <= 0) return;

      // Find the channel for this session
      const sessionStartEvent = checkoutStartEvents?.find(
        (e: AnalyticsEvent) => e.session_id === event.session_id
      );

      if (sessionStartEvent) {
        const metadata = sessionStartEvent.metadata || {};
        const channel =
          (metadata.utm_source as string) ||
          (metadata.referrer as string) ||
          (metadata.channel as string) ||
          'direct';

        const normalizedChannel = channel.toLowerCase().replace(/[^a-z0-9]/g, '_');

        if (channelStats[normalizedChannel]) {
          channelStats[normalizedChannel].conversions++;
          channelStats[normalizedChannel].revenue += revenue;
        }
      }
    });

    // Calculate metrics per channel
    const channelData = Object.entries(channelStats).map(([channel, stats]) => {
      const sessions = stats.sessions.size;
      const conversionRate = sessions > 0 ? (stats.conversions / sessions) * 100 : 0;
      const avgOrderValue = stats.conversions > 0 ? stats.revenue / stats.conversions : 0;

      // Estimate CAC - this is a placeholder
      // In a real implementation, you would fetch actual marketing spend from your marketing platform
      // For now, we use a default estimated CAC or calculate based on channel
      const estimatedCAC = estimateCACForChannel(channel, stats.conversions);

      return {
        channel: channel.charAt(0).toUpperCase() + channel.slice(1).replace(/_/g, ' '),
        sessions,
        conversions: stats.conversions,
        revenue: stats.revenue,
        conversionRate,
        avgOrderValue,
        estimatedCAC,
        // Note: LTV:CAC ratio would require LTV data per channel
        // This is a simplified version
        ltvCacRatio: estimatedCAC > 0 ? (avgOrderValue * 2) / estimatedCAC : 0, // Simplified: using 2x AOV as proxy for LTV
      };
    });

    // Calculate aggregate CAC
    const totalNewCustomers = channelData.reduce((sum, c) => sum + c.conversions, 0);
    const totalEstimatedMarketingSpend = channelData.reduce(
      (sum, c) => sum + (c.estimatedCAC * c.conversions),
      0
    );
    const avgCAC = totalNewCustomers > 0
      ? totalEstimatedMarketingSpend / totalNewCustomers
      : 0;

    // Calculate average LTV (simplified - would ideally come from LTV endpoint)
    const totalRevenue = channelData.reduce((sum, c) => sum + c.revenue, 0);
    const avgLTV = totalNewCustomers > 0 ? (totalRevenue / totalNewCustomers) * 2 : 0; // Simplified: 2x first order value

    const ltvCacRatio = avgCAC > 0 ? avgLTV / avgCAC : 0;

    // Calculate acquisition efficiency
    const acquisitionEfficiency = {
      excellent: ltvCacRatio >= 3,
      good: ltvCacRatio >= 2 && ltvCacRatio < 3,
      needsImprovement: ltvCacRatio < 2,
      ratio: ltvCacRatio,
    };

    return apiSuccess({
      summary: {
        totalNewCustomers,
        avgCAC,
        avgLTV,
        ltvCacRatio,
        totalEstimatedMarketingSpend,
        acquisitionEfficiency,
      },
      channels: channelData.sort((a, b) => b.conversions - a.conversions),
      period,
      note: 'CAC values are estimated. For accurate CAC, integrate with your marketing platform to get actual spend data.',
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

/**
 * Estimate CAC for a given channel
 * This is a placeholder function - in production, this should fetch actual marketing spend
 */
function estimateCACForChannel(channel: string, _: number): number {
  // Default estimated CAC values by channel type (in USD)
  // These are industry averages and should be replaced with actual data
  const channelEstimates: Record<string, number> = {
    google: 45,
    facebook: 35,
    instagram: 30,
    twitter: 40,
    linkedin: 60,
    email: 5,
    organic: 0,
    direct: 0,
    referral: 10,
    social: 30,
  };

  // Check for partial matches
  for (const [key, value] of Object.entries(channelEstimates)) {
    if (channel.includes(key)) {
      return value;
    }
  }

  // Default estimate for unknown channels
  return 25;
}

