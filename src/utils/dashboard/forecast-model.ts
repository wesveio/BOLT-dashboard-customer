/**
 * Revenue Forecast Model
 * 
 * Simple forecasting models for revenue prediction:
 * - Exponential Moving Average (EMA)
 * - Linear Regression with Trend
 * - Seasonal Adjustment (weekly/monthly patterns)
 */

export interface ForecastDataPoint {
  date: string;
  revenue: number;
}

export interface ForecastResult {
  date: string;
  forecast: number;
  lowerBound: number;
  upperBound: number;
  confidence: number; // 0-1
}

export interface ForecastModel {
  forecasts: ForecastResult[];
  trend: 'increasing' | 'decreasing' | 'stable';
  avgGrowth: number;
  seasonality: {
    weekly: Record<string, number>; // Day of week multipliers
    monthly: Record<string, number>; // Month multipliers
  };
}

/**
 * Calculate exponential moving average
 */
function calculateEMA(data: number[], alpha: number = 0.3): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];

  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = alpha * data[i] + (1 - alpha) * ema;
  }
  return ema;
}

/**
 * Calculate linear regression trend
 */
function calculateTrend(data: ForecastDataPoint[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  if (data.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const n = data.length;
  const dates = data.map((d, i) => i);
  const revenues = data.map(d => d.revenue);

  const sumX = dates.reduce((a, b) => a + b, 0);
  const sumY = revenues.reduce((a, b) => a + b, 0);
  const sumXY = dates.reduce((sum, x, i) => sum + x * revenues[i], 0);
  const sumX2 = dates.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = revenues.reduce((sum, y) => sum + y * y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = revenues.reduce((sum, y, i) => {
    const predicted = slope * dates[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const ssTot = revenues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}

/**
 * Calculate seasonal adjustments
 */
function calculateSeasonality(data: ForecastDataPoint[]): {
  weekly: Record<string, number>;
  monthly: Record<string, number>;
} {
  const weekly: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  const weeklyCounts: Record<string, number> = {};
  const monthlyCounts: Record<string, number> = {};

  const avgRevenue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;

  data.forEach((point) => {
    const date = new Date(point.date);
    const dayOfWeek = date.getDay().toString();
    const month = date.getMonth().toString();

    weekly[dayOfWeek] = (weekly[dayOfWeek] || 0) + point.revenue;
    monthly[month] = (monthly[month] || 0) + point.revenue;
    weeklyCounts[dayOfWeek] = (weeklyCounts[dayOfWeek] || 0) + 1;
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  // Normalize to multipliers (1.0 = average)
  Object.keys(weekly).forEach((day) => {
    const count = weeklyCounts[day] || 1;
    weekly[day] = (weekly[day] / count) / avgRevenue;
  });

  Object.keys(monthly).forEach((month) => {
    const count = monthlyCounts[month] || 1;
    monthly[month] = (monthly[month] / count) / avgRevenue;
  });

  return { weekly, monthly };
}

/**
 * Generate revenue forecast
 * 
 * @param historicalData - Historical revenue data points
 * @param days - Number of days to forecast
 * @returns Forecast results with confidence intervals
 */
export function generateForecast(
  historicalData: ForecastDataPoint[],
  days: number = 30
): ForecastModel {
  if (historicalData.length < 7) {
    // Not enough data for meaningful forecast
    return {
      forecasts: [],
      trend: 'stable',
      avgGrowth: 0,
      seasonality: { weekly: {}, monthly: {} },
    };
  }

  // Calculate trend
  const trend = calculateTrend(historicalData);
  const revenues = historicalData.map(d => d.revenue);
  const lastRevenue = revenues[revenues.length - 1];
  const avgGrowth = trend.slope;

  // Calculate seasonality
  const seasonality = calculateSeasonality(historicalData);

  // Determine trend direction
  let trendDirection: 'increasing' | 'decreasing' | 'stable';
  if (trend.slope > lastRevenue * 0.01) {
    trendDirection = 'increasing';
  } else if (trend.slope < -lastRevenue * 0.01) {
    trendDirection = 'decreasing';
  } else {
    trendDirection = 'stable';
  }

  // Calculate EMA for baseline
  const ema = calculateEMA(revenues, 0.3);

  // Generate forecasts
  const forecasts: ForecastResult[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const stdDev = calculateStandardDeviation(revenues);

  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    // Base forecast: EMA + trend
    const baseForecast = ema + trend.slope * i;

    // Apply seasonal adjustment
    const dayOfWeek = forecastDate.getDay().toString();
    const month = forecastDate.getMonth().toString();
    const weeklyMultiplier = seasonality.weekly[dayOfWeek] || 1.0;
    const monthlyMultiplier = seasonality.monthly[month] || 1.0;
    const seasonalMultiplier = (weeklyMultiplier + monthlyMultiplier) / 2;

    const forecast = baseForecast * seasonalMultiplier;

    // Calculate confidence intervals (95% confidence)
    const confidenceInterval = 1.96 * stdDev * Math.sqrt(1 + i / historicalData.length);
    const lowerBound = Math.max(0, forecast - confidenceInterval);
    const upperBound = forecast + confidenceInterval;

    // Confidence decreases with time (0.9 for day 1, 0.5 for day 30)
    const confidence = Math.max(0.3, 0.9 - (i / days) * 0.4);

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      forecast,
      lowerBound,
      upperBound,
      confidence,
    });
  }

  return {
    forecasts,
    trend: trendDirection,
    avgGrowth,
    seasonality,
  };
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate forecast accuracy (compare forecast to actual)
 */
export function calculateForecastAccuracy(
  forecasts: ForecastResult[],
  actuals: ForecastDataPoint[]
): {
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Squared Error
} {
  if (forecasts.length === 0 || actuals.length === 0) {
    return { mae: 0, mape: 0, rmse: 0 };
  }

  const errors: number[] = [];
  const percentages: number[] = [];
  const squaredErrors: number[] = [];

  forecasts.forEach((forecast) => {
    const actual = actuals.find(a => a.date === forecast.date);
    if (actual) {
      const error = Math.abs(forecast.forecast - actual.revenue);
      errors.push(error);
      if (actual.revenue > 0) {
        percentages.push((error / actual.revenue) * 100);
      }
      squaredErrors.push(Math.pow(error, 2));
    }
  });

  const mae = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
  const mape = percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;
  const rmse = squaredErrors.length > 0
    ? Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length)
    : 0;

  return { mae, mape, rmse };
}

