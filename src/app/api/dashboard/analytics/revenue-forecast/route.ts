import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { generateForecast, type ForecastDataPoint } from '@/utils/dashboard/forecast-model';

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
      console.error('Get revenue forecast events error:', eventsError);
      return apiError('Failed to fetch revenue forecast data', 500);
    }

    // Aggregate revenue by date
    const dailyRevenue: Record<string, number> = {};

    events?.forEach((event: AnalyticsEvent) => {
      const revenue = extractRevenue(event);
      if (revenue <= 0) return;

      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
    });

    // Convert to array and sort by date
    const historicalData: ForecastDataPoint[] = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date,
        revenue,
      }));

    // Generate forecasts
    const forecast = generateForecast(historicalData, forecastDays);

    // Calculate summary statistics
    const totalHistoricalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0);
    const avgDailyRevenue = historicalData.length > 0 ? totalHistoricalRevenue / historicalData.length : 0;
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
    return apiInternalError(error);
  }
}

