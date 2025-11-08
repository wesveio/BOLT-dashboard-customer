import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { generateForecast, type ForecastDataPoint, type ForecastResult } from '@/utils/dashboard/forecast-model';

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
 * GET /api/dashboard/analytics/revenue-forecast
 * Get revenue forecast analytics
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
    const forecastDays = parseInt(searchParams.get('days') || '30');

    // Calculate date range - extend back to get historical data
    const range = getDateRange(period);
    const historicalStart = new Date(range.start);
    historicalStart.setDate(historicalStart.getDate() - 90); // Look back 90 days

    // Query completed checkout events
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete', 'order_confirmed'],
        p_start_date: historicalStart.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('❌ [DEBUG] Get revenue forecast events error:', eventsError);
      return apiError('Failed to fetch revenue forecast data', 500);
    }

    // Add debug logging
    console.info('✅ [DEBUG] Revenue forecast - Events found:', events?.length || 0);
    console.info('✅ [DEBUG] Revenue forecast - Date range:', {
      start: historicalStart.toISOString(),
      end: range.end.toISOString(),
    });

    // Aggregate revenue by date
    const dailyRevenue: Record<string, number> = {};
    let totalRevenueExtracted = 0;
    let eventsWithRevenue = 0;

    events?.forEach((event: AnalyticsEvent) => {
      const revenue = extractRevenue(event);
      if (revenue <= 0) return;

      eventsWithRevenue++;
      totalRevenueExtracted += revenue;

      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
    });

    // Add debug logging
    console.info('✅ [DEBUG] Revenue forecast - Revenue extraction:', {
      totalEvents: events?.length || 0,
      eventsWithRevenue,
      totalRevenueExtracted,
      uniqueDays: Object.keys(dailyRevenue).length,
    });

    // Convert to array and sort by date
    const historicalData: ForecastDataPoint[] = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date,
        revenue,
      }));

    console.info('✅ [DEBUG] Revenue forecast - Historical data points:', historicalData.length);

    // Generate forecasts
    const forecast = generateForecast(historicalData, forecastDays);

    // Calculate summary statistics first (needed for fallback)
    const totalHistoricalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0);
    const avgDailyRevenue = historicalData.length > 0 ? totalHistoricalRevenue / historicalData.length : 0;

    // Calculate average daily growth based on consecutive day differences
    let calculatedAvgGrowth = forecast.avgGrowth;
    if (historicalData.length >= 2) {
      // Calculate growth based on consecutive days
      const dailyDifferences: number[] = [];
      for (let i = 1; i < historicalData.length; i++) {
        const prevDate = new Date(historicalData[i - 1].date);
        const currDate = new Date(historicalData[i].date);
        const daysDiff = Math.max(1, Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)));

        const revenueDiff = historicalData[i].revenue - historicalData[i - 1].revenue;
        const dailyGrowth = revenueDiff / daysDiff;
        dailyDifferences.push(dailyGrowth);
      }

      if (dailyDifferences.length > 0) {
        calculatedAvgGrowth = dailyDifferences.reduce((sum, diff) => sum + diff, 0) / dailyDifferences.length;
      }
    }

    // Add fallback when there's insufficient data but we have some revenue
    if (forecast.forecasts.length === 0 && historicalData.length > 0) {
      // Use average daily revenue as forecast when we have data but not enough for full model
      const lastDate = new Date(historicalData[historicalData.length - 1].date);

      const fallbackForecasts: ForecastResult[] = [];
      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + i);
        fallbackForecasts.push({
          date: forecastDate.toISOString().split('T')[0],
          forecast: avgDailyRevenue,
          lowerBound: Math.max(0, avgDailyRevenue * 0.5),
          upperBound: avgDailyRevenue * 1.5,
          confidence: 0.5,
        });
      }

      forecast.forecasts = fallbackForecasts;
      forecast.trend = 'stable';
      // Use calculated growth if available, otherwise 0
      forecast.avgGrowth = calculatedAvgGrowth;

      console.warn('‼️ [DEBUG] Revenue forecast - Using fallback forecast (insufficient data for full model)');
    } else {
      // Update avgGrowth with calculated value for better accuracy
      forecast.avgGrowth = calculatedAvgGrowth;
    }
    const totalForecastRevenue = forecast.forecasts.reduce((sum, f) => sum + f.forecast, 0);
    const avgForecastRevenue = forecast.forecasts.length > 0
      ? totalForecastRevenue / forecast.forecasts.length
      : 0;

    // Calculate forecast accuracy (if we have actual data for some forecast dates)
    const actuals: ForecastDataPoint[] = [];
    const today = new Date();
    forecast.forecasts.forEach((f) => {
      const forecastDate = new Date(f.date);
      if (forecastDate <= today) {
        const actual = historicalData.find(d => d.date === f.date);
        if (actual) {
          actuals.push(actual);
        }
      }
    });

    // Group forecasts by period (7 days, 30 days, 90 days)
    const forecast7Days = forecast.forecasts.slice(0, 7);
    const forecast30Days = forecast.forecasts.slice(0, 30);
    const forecast90Days = forecast.forecasts.slice(0, 90);

    const forecast7Revenue = forecast7Days.reduce((sum, f) => sum + f.forecast, 0);
    const forecast30Revenue = forecast30Days.reduce((sum, f) => sum + f.forecast, 0);
    const forecast90Revenue = forecast90Days.reduce((sum, f) => sum + f.forecast, 0);

    console.info('✅ [DEBUG] Revenue forecast - Summary:', {
      totalHistoricalRevenue,
      avgDailyRevenue,
      forecast7Revenue,
      forecast30Revenue,
      forecast90Revenue,
      forecastCount: forecast.forecasts.length,
      avgGrowth: forecast.avgGrowth,
      trend: forecast.trend,
    });

    return apiSuccess({
      summary: {
        totalHistoricalRevenue,
        avgDailyRevenue,
        totalForecastRevenue,
        avgForecastRevenue,
        forecast7Revenue,
        forecast30Revenue,
        forecast90Revenue,
        trend: forecast.trend,
        avgGrowth: forecast.avgGrowth,
      },
      historical: historicalData.slice(-30), // Last 30 days for chart
      forecast: forecast.forecasts,
      accuracy: actuals.length > 0
        ? {
          mae: 0, // Would calculate if we had forecast accuracy utility
          mape: 0,
          rmse: 0,
        }
        : null,
      period,
      forecastDays,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Revenue forecast error:', error);
    return apiInternalError(error);
  }
}

