/**
 * Mock Data Generators
 * 
 * Generates realistic mock data for 3 months of activity
 */

import type {
  MockDataParams,
  MockMetrics,
  MockFunnel,
  MockRevenueData,
  MockPaymentMethod,
  MockShippingMethod,
  MockDeviceData,
  MockBrowserData,
  MockGeographyData,
  MockCouponData,
  MockMicroConversion,
  MockLTVData,
  MockCohortData,
  MockRetentionData,
  MockFrictionScore,
  MockCACData,
  MockOptimizationROI,
  MockSegment,
  MockRevenueForecast,
  MockAbandonmentPrediction,
  MockBoltXPrediction,
  MockBoltXIntervention,
  MockPersonalizationProfile,
  MockPersonalizationMetrics,
  MockOptimization,
  MockInsight,
} from './types';

import {
  generateConsistentId,
  generateRandomInRange,
  generateIntInRange,
  generateTimeSeriesData,
  generateHourlyData,
  getMockDateRange,
  generateDistribution,
  daysBetween,
  calculateGrowthFactor,
} from './mock-data-helpers';

/**
 * Configuration constants for mock data generation
 */
const MOCK_DATA_CONFIG = {
  // Annual revenue: USD 387 million
  annualRevenue: 387000000,
  
  // Country distribution (percentages)
  countryDistribution: {
    BRA: 0.35,  // Brazil
    USA: 0.30,  // United States
    CAN: 0.08,  // Canada
    GBR: 0.06,  // United Kingdom
    ESP: 0.05,  // Spain
    ARG: 0.03,  // Argentina
    CHL: 0.025, // Chile
    PRT: 0.02,  // Portugal
    CHE: 0.02,  // Switzerland
    SGP: 0.015, // Singapore
    NOR: 0.01,  // Norway
  },
  
  // Monthly growth rates
  growthRates: {
    revenue: { min: 0.05, max: 0.10 },  // 5-10% monthly
    sessions: { min: 0.03, max: 0.07 }, // 3-7% monthly
    conversion: { min: 0.001, max: 0.003 }, // 0.1-0.3% monthly improvement
  },
};

/**
 * Generate mock metrics (overview)
 * Based on annual revenue of USD 387M with monthly growth of 5-10%
 */
export function generateMockMetrics(params: MockDataParams): MockMetrics {
  const { accountId, period, startDate, endDate } = params;
  const { start, end } = getMockDateRange(period, startDate, endDate);
  const days = daysBetween(start, end);

  // Base calculations from annual revenue
  // USD 387M/year = ~USD 32.25M/month = ~USD 1.06M/day
  const monthlyRevenue = MOCK_DATA_CONFIG.annualRevenue / 12;
  const dailyRevenue = monthlyRevenue / 30;
  
  // Calculate growth rates (consistent per accountId)
  const revenueGrowthRate = generateRandomInRange(
    `${accountId}-revenue-growth`,
    MOCK_DATA_CONFIG.growthRates.revenue.min,
    MOCK_DATA_CONFIG.growthRates.revenue.max,
    0
  );
  const sessionsGrowthRate = generateRandomInRange(
    `${accountId}-sessions-growth`,
    MOCK_DATA_CONFIG.growthRates.sessions.min,
    MOCK_DATA_CONFIG.growthRates.sessions.max,
    0
  );
  const conversionImprovementRate = generateRandomInRange(
    `${accountId}-conversion-growth`,
    MOCK_DATA_CONFIG.growthRates.conversion.min,
    MOCK_DATA_CONFIG.growthRates.conversion.max,
    0
  );

  // Apply growth factor from start date to end date
  const revenueGrowthFactor = calculateGrowthFactor(start, end, revenueGrowthRate);
  const sessionsGrowthFactor = calculateGrowthFactor(start, end, sessionsGrowthRate);
  
  // Base conversion rate (8% base, improves over time)
  const monthsSinceStart = (end.getFullYear() - start.getFullYear()) * 12 + 
                          (end.getMonth() - start.getMonth());
  const conversionRateBase = 0.08;
  const conversionRate = Math.min(0.15, 
    conversionRateBase + (monthsSinceStart * conversionImprovementRate)
  );

  // Calculate period revenue with growth
  const periodRevenue = dailyRevenue * days * revenueGrowthFactor;
  
  // Estimate sessions based on conversion rate and revenue
  // Average order value ~USD 120-150
  const avgOrderValueEstimate = generateRandomInRange(`${accountId}-aov`, 120, 150, 0);
  const estimatedOrders = periodRevenue / avgOrderValueEstimate;
  const totalSessions = Math.round(estimatedOrders / conversionRate * sessionsGrowthFactor);
  const totalConversions = Math.round(totalSessions * conversionRate);
  const totalRevenue = Math.round(periodRevenue);
  const totalOrders = totalConversions;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : avgOrderValueEstimate;
  const abandonmentRate = 100 - (conversionRate * 100);
  const avgCheckoutTime = generateRandomInRange(accountId, 120, 300, 0); // 2-5 minutes

  // Calculate growth vs previous period (same length, earlier)
  const previousPeriodStart = new Date(start);
  previousPeriodStart.setMonth(previousPeriodStart.getMonth() - (days / 30));
  const previousPeriodEnd = new Date(start);
  const previousPeriodDays = daysBetween(previousPeriodStart, previousPeriodEnd);
  const previousRevenueGrowthFactor = calculateGrowthFactor(previousPeriodStart, previousPeriodEnd, revenueGrowthRate);
  const previousPeriodRevenue = Math.round(dailyRevenue * previousPeriodDays * previousRevenueGrowthFactor);
  const revenueGrowth = previousPeriodRevenue > 0
    ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : 0;

  return {
    totalSessions,
    totalConversions,
    totalRevenue,
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    conversionRate: Math.round(conversionRate * 100 * 100) / 100,
    abandonmentRate: Math.round(abandonmentRate * 100) / 100,
    avgCheckoutTime,
    revenueGrowth: Math.round(revenueGrowth * 100) / 100,
  };
}

/**
 * Generate mock funnel data
 */
export function generateMockFunnel(params: MockDataParams): MockFunnel {
  const metrics = generateMockMetrics(params);

  // Funnel follows typical pattern: cart > profile > shipping > payment > confirmed
  const cart = metrics.totalSessions;
  const profile = Math.round(cart * 0.85);
  const shipping = Math.round(profile * 0.75);
  const payment = Math.round(shipping * 0.65);
  const confirmed = metrics.totalConversions;

  return {
    cart,
    profile,
    shipping,
    payment,
    confirmed,
  };
}

/**
 * Generate mock revenue data
 */
export function generateMockRevenueData(params: MockDataParams): MockRevenueData {
  const { accountId, period, startDate, endDate } = params;
  const { start, end } = getMockDateRange(period, startDate, endDate);

  const metrics = generateMockMetrics(params);
  const baseDailyRevenue = metrics.totalRevenue / Math.max(1, daysBetween(start, end));

  // Get growth rate for revenue (consistent with metrics)
  const revenueGrowthRate = generateRandomInRange(
    `${accountId}-revenue-growth`,
    MOCK_DATA_CONFIG.growthRates.revenue.min,
    MOCK_DATA_CONFIG.growthRates.revenue.max,
    0
  );
  // Convert monthly growth to daily growth for time series
  const dailyGrowthRate = revenueGrowthRate / 30;

  // Generate daily trend with monthly growth applied
  const dailyTrend = generateTimeSeriesData(
    accountId,
    start,
    end,
    baseDailyRevenue,
    0.3, // 30% variance
    dailyGrowthRate // Daily growth based on monthly rate
  );

  // Generate hourly data for today
  const today = new Date();
  const hourlyData = generateHourlyData(accountId, today, baseDailyRevenue / 24, 0.4);

  // Calculate revenue per hour (average)
  const revenuePerHour = metrics.totalRevenue / Math.max(1, daysBetween(start, end) * 24);

  // Format chartData (trend) - main revenue trend chart
  const chartData = dailyTrend.map(d => ({
    date: d.date,
    revenue: d.value
  }));

  // Format revenueByHour - hourly breakdown
  const revenueByHour = hourlyData.map(h => ({
    hour: h.hour.toString().padStart(2, '0') + ':00',
    revenue: h.value
  }));

  // Format revenueByDay - daily breakdown based on period
  const revenueByDay = dailyTrend.map(d => {
    const date = new Date(d.date);
    let dayKey: string;

    // Determine day format based on period
    if (params.period === 'week' || params.period === 'today') {
      dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (params.period === 'month') {
      dayKey = date.getDate().toString();
    } else if (params.period === 'year') {
      dayKey = date.toLocaleDateString('en-US', { month: 'short' });
    } else {
      dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    return {
      day: dayKey,
      revenue: d.value,
    };
  });

  return {
    metrics: {
      totalRevenue: metrics.totalRevenue,
      avgOrderValue: metrics.avgOrderValue,
      totalOrders: metrics.totalOrders,
      revenuePerHour: Math.round(revenuePerHour * 100) / 100,
      revenueGrowth: metrics.revenueGrowth,
    },
    chartData,
    revenueByHour,
    revenueByDay,
    period: params.period,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
  };
}

/**
 * Generate mock payment methods data
 * With regional distribution: Brazil, North America, Europe, Asia
 */
export function generateMockPaymentMethods(params: MockDataParams): MockPaymentMethod[] {
  const { accountId } = params;
  const metrics = generateMockMetrics(params);

  // Get country distribution to calculate regional weights
  const countryDist = MOCK_DATA_CONFIG.countryDistribution;
  
  // Calculate regional weights
  const brazilWeight = countryDist.BRA; // 35%
  const northAmericaWeight = countryDist.USA + countryDist.CAN; // 30% + 8% = 38%
  const europeWeight = countryDist.GBR + countryDist.ESP + countryDist.PRT + countryDist.CHE + countryDist.NOR; // 6% + 5% + 2% + 2% + 1% = 16%
  const latinAmericaWeight = countryDist.ARG + countryDist.CHL; // 3% + 2.5% = 5.5%
  const asiaWeight = countryDist.SGP; // 1.5%

  // Payment methods with regional distribution
  // Brazil: PIX (40%), Credit Card (35%), Debit Card (15%), PayPal (10%)
  // North America: Credit Card (60% - Visa 35%, MasterCard 20%, AMEX 5%), PayPal (25%), Debit (10%), Wire Transfer (5%)
  // Europe: Credit Card (50% - Visa 30%, MasterCard 20%), PayPal (30%), Debit (15%), Wire Transfer (5%)
  // Latin America: Credit Card (50%), PayPal (30%), Wire Transfer (20%)
  // Asia: Credit Card (45%), PayPal (35%), Wire Transfer (20%)

  const paymentMethods: Array<{ name: string; percentage: number }> = [];

  // Brazil payments
  paymentMethods.push(
    { name: 'PIX', percentage: brazilWeight * 0.40 },
    { name: 'Visa', percentage: brazilWeight * 0.25 },
    { name: 'MasterCard', percentage: brazilWeight * 0.10 },
    { name: 'Debit Card', percentage: brazilWeight * 0.15 },
    { name: 'PayPal', percentage: brazilWeight * 0.10 }
  );

  // North America payments
  paymentMethods.push(
    { name: 'Visa', percentage: northAmericaWeight * 0.35 },
    { name: 'MasterCard', percentage: northAmericaWeight * 0.20 },
    { name: 'AMEX', percentage: northAmericaWeight * 0.05 },
    { name: 'Debit Card', percentage: northAmericaWeight * 0.10 },
    { name: 'PayPal', percentage: northAmericaWeight * 0.25 },
    { name: 'Wire Transfer', percentage: northAmericaWeight * 0.05 }
  );

  // Europe payments
  paymentMethods.push(
    { name: 'Visa', percentage: europeWeight * 0.30 },
    { name: 'MasterCard', percentage: europeWeight * 0.20 },
    { name: 'Debit Card', percentage: europeWeight * 0.15 },
    { name: 'PayPal', percentage: europeWeight * 0.30 },
    { name: 'Wire Transfer', percentage: europeWeight * 0.05 }
  );

  // Latin America payments
  paymentMethods.push(
    { name: 'Visa', percentage: latinAmericaWeight * 0.30 },
    { name: 'MasterCard', percentage: latinAmericaWeight * 0.20 },
    { name: 'PayPal', percentage: latinAmericaWeight * 0.30 },
    { name: 'Wire Transfer', percentage: latinAmericaWeight * 0.20 }
  );

  // Asia payments
  paymentMethods.push(
    { name: 'Visa', percentage: asiaWeight * 0.25 },
    { name: 'MasterCard', percentage: asiaWeight * 0.20 },
    { name: 'PayPal', percentage: asiaWeight * 0.35 },
    { name: 'Wire Transfer', percentage: asiaWeight * 0.20 }
  );

  // Aggregate by method name
  const aggregated: Record<string, number> = {};
  paymentMethods.forEach(pm => {
    aggregated[pm.name] = (aggregated[pm.name] || 0) + pm.percentage;
  });

  // Convert to array and normalize to 100%
  const total = Object.values(aggregated).reduce((sum, val) => sum + val, 0);
  const methods = Object.entries(aggregated).map(([name, percentage], index) => {
    const normalizedPercentage = (percentage / total) * 100;
    const count = Math.round(metrics.totalOrders * (normalizedPercentage / 100));
    const revenue = Math.round(metrics.totalRevenue * (normalizedPercentage / 100));
    const conversionRate = generateRandomInRange(`${accountId}-payment-${name}-${index}`, 0.05, 0.15, 0);

    return {
      method: name,
      count,
      revenue,
      percentage: Math.round(normalizedPercentage * 100) / 100,
      conversionRate: Math.round(conversionRate * 100 * 100) / 100,
    };
  });

  return methods;
}

/**
 * Generate mock shipping methods data
 * With regional distribution and realistic delivery times
 */
export function generateMockShippingMethods(params: MockDataParams): MockShippingMethod[] {
  const { accountId } = params;
  const metrics = generateMockMetrics(params);

  // Get country distribution to calculate regional weights
  const countryDist = MOCK_DATA_CONFIG.countryDistribution;
  
  // Calculate regional weights
  const brazilWeight = countryDist.BRA; // 35%
  const northAmericaWeight = countryDist.USA + countryDist.CAN; // 38%
  const ukWeight = countryDist.GBR; // 6%
  const europeWeight = countryDist.ESP + countryDist.PRT + countryDist.CHE + countryDist.NOR; // 10%
  const asiaWeight = countryDist.SGP; // 1.5%

  // Shipping methods with regional distribution and delivery times
  // Brazil: Correios (50%), Loggi (30%), DHL (15%), UPS (5%)
  // North America: UPS (40%), FedEx (30%), DHL (25%), TNT (5%)
  // UK: Royal Mail (45%), DHL (30%), UPS (15%), TNT (10%)
  // Europe: DHL (40%), PostNL (25%), UPS (20%), TNT (15%)
  // Asia: SingPost (50%), DHL (30%), FedEx (20%)

  const shippingMethods: Array<{ name: string; percentage: number; avgDays: number }> = [];

  // Brazil shipping
  shippingMethods.push(
    { name: 'Correios', percentage: brazilWeight * 0.50, avgDays: 7 },
    { name: 'Loggi', percentage: brazilWeight * 0.30, avgDays: 3 },
    { name: 'DHL', percentage: brazilWeight * 0.15, avgDays: 5 },
    { name: 'UPS', percentage: brazilWeight * 0.05, avgDays: 6 }
  );

  // North America shipping
  shippingMethods.push(
    { name: 'UPS', percentage: northAmericaWeight * 0.40, avgDays: 3 },
    { name: 'FedEx', percentage: northAmericaWeight * 0.30, avgDays: 2 },
    { name: 'DHL', percentage: northAmericaWeight * 0.25, avgDays: 4 },
    { name: 'TNT', percentage: northAmericaWeight * 0.05, avgDays: 5 }
  );

  // UK shipping
  shippingMethods.push(
    { name: 'Royal Mail', percentage: ukWeight * 0.45, avgDays: 4 },
    { name: 'DHL', percentage: ukWeight * 0.30, avgDays: 3 },
    { name: 'UPS', percentage: ukWeight * 0.15, avgDays: 4 },
    { name: 'TNT', percentage: ukWeight * 0.10, avgDays: 5 }
  );

  // Europe shipping
  shippingMethods.push(
    { name: 'DHL', percentage: europeWeight * 0.40, avgDays: 4 },
    { name: 'PostNL', percentage: europeWeight * 0.25, avgDays: 5 },
    { name: 'UPS', percentage: europeWeight * 0.20, avgDays: 4 },
    { name: 'TNT', percentage: europeWeight * 0.15, avgDays: 6 }
  );

  // Asia shipping
  shippingMethods.push(
    { name: 'SingPost', percentage: asiaWeight * 0.50, avgDays: 3 },
    { name: 'DHL', percentage: asiaWeight * 0.30, avgDays: 2 },
    { name: 'FedEx', percentage: asiaWeight * 0.20, avgDays: 3 }
  );

  // Aggregate by method name
  const aggregated: Record<string, { percentage: number; avgDays: number }> = {};
  shippingMethods.forEach(sm => {
    if (!aggregated[sm.name]) {
      aggregated[sm.name] = { percentage: 0, avgDays: sm.avgDays };
    }
    aggregated[sm.name].percentage += sm.percentage;
    // Weighted average for delivery time
    const currentWeight = aggregated[sm.name].percentage - sm.percentage;
    const newWeight = aggregated[sm.name].percentage;
    aggregated[sm.name].avgDays = Math.round(
      ((currentWeight * aggregated[sm.name].avgDays) + (sm.percentage * sm.avgDays)) / newWeight
    );
  });

  // Convert to array and normalize to 100%
  const total = Object.values(aggregated).reduce((sum, val) => sum + val.percentage, 0);
  const methods = Object.entries(aggregated).map(([name, data], index) => {
    const normalizedPercentage = (data.percentage / total) * 100;
    const count = Math.round(metrics.totalOrders * (normalizedPercentage / 100));
    // Add some variance to delivery time
    const avgDeliveryTime = generateIntInRange(
      `${accountId}-shipping-${name}-${index}`,
      Math.max(1, data.avgDays - 1),
      data.avgDays + 1,
      0
    );

    return {
      method: name,
      count,
      percentage: Math.round(normalizedPercentage * 100) / 100,
      avgDeliveryTime,
    };
  });

  return methods;
}

/**
 * Generate mock device data
 */
export function generateMockDevices(params: MockDataParams): MockDeviceData[] {
  const metrics = generateMockMetrics(params);

  const devices = [
    { name: 'Mobile', baseRate: 0.60 },
    { name: 'Desktop', baseRate: 0.35 },
    { name: 'Tablet', baseRate: 0.05 },
  ];

  return devices.map((device) => {
    const sessions = Math.round(metrics.totalSessions * device.baseRate);
    const conversionRate = device.name === 'Desktop' ? 0.12 : device.name === 'Mobile' ? 0.08 : 0.06;
    const conversions = Math.round(sessions * conversionRate);
    const revenue = Math.round(metrics.totalRevenue * device.baseRate);

    return {
      device: device.name,
      sessions,
      conversions,
      revenue,
      conversionRate: Math.round(conversionRate * 100 * 100) / 100,
      percentage: Math.round(device.baseRate * 100 * 100) / 100,
    };
  });
}

/**
 * Generate mock browser data
 */
export function generateMockBrowsers(params: MockDataParams): MockBrowserData[] {
  const { accountId } = params;
  const metrics = generateMockMetrics(params);

  const browsers = [
    { name: 'Chrome', baseRate: 0.50 },
    { name: 'Safari', baseRate: 0.30 },
    { name: 'Firefox', baseRate: 0.10 },
    { name: 'Edge', baseRate: 0.08 },
    { name: 'Other', baseRate: 0.02 },
  ];

  return browsers.map((browser, index) => {
    const sessions = Math.round(metrics.totalSessions * browser.baseRate);
    const conversionRate = generateRandomInRange(`${accountId}-browser-${index}`, 0.07, 0.13, 0);
    const conversions = Math.round(sessions * conversionRate);

    return {
      browser: browser.name,
      sessions,
      conversions,
      conversionRate: Math.round(conversionRate * 100 * 100) / 100,
      percentage: Math.round(browser.baseRate * 100 * 100) / 100,
    };
  });
}

/**
 * Generate mock geography data
 * Based on 11 countries with realistic distribution
 */
export function generateMockGeography(params: MockDataParams): MockGeographyData[] {
  const { accountId } = params;
  const metrics = generateMockMetrics(params);

  // Country distribution based on market size
  // Total: 35% + 30% + 8% + 6% + 5% + 3% + 2.5% + 2% + 2% + 1.5% + 1% = 100%
  const locations = [
    // Brazil (35% total)
    { country: 'BRA', state: 'SP', baseRate: 0.15 },
    { country: 'BRA', state: 'RJ', baseRate: 0.08 },
    { country: 'BRA', state: 'MG', baseRate: 0.05 },
    { country: 'BRA', state: 'RS', baseRate: 0.03 },
    { country: 'BRA', state: 'PR', baseRate: 0.02 },
    { country: 'BRA', state: 'SC', baseRate: 0.01 },
    { country: 'BRA', state: undefined, baseRate: 0.01 },
    // USA (30% total)
    { country: 'USA', state: 'CA', baseRate: 0.10 },
    { country: 'USA', state: 'NY', baseRate: 0.07 },
    { country: 'USA', state: 'TX', baseRate: 0.05 },
    { country: 'USA', state: 'FL', baseRate: 0.04 },
    { country: 'USA', state: 'IL', baseRate: 0.02 },
    { country: 'USA', state: undefined, baseRate: 0.02 },
    // Canada (8% total)
    { country: 'CAN', state: 'ON', baseRate: 0.04 },
    { country: 'CAN', state: 'QC', baseRate: 0.025 },
    { country: 'CAN', state: 'BC', baseRate: 0.01 },
    { country: 'CAN', state: undefined, baseRate: 0.005 },
    // United Kingdom (6% total)
    { country: 'GBR', state: undefined, baseRate: 0.06 },
    // Spain (5% total)
    { country: 'ESP', state: undefined, baseRate: 0.05 },
    // Argentina (3% total)
    { country: 'ARG', state: undefined, baseRate: 0.03 },
    // Chile (2.5% total)
    { country: 'CHL', state: undefined, baseRate: 0.025 },
    // Portugal (2% total)
    { country: 'PRT', state: undefined, baseRate: 0.02 },
    // Switzerland (2% total)
    { country: 'CHE', state: undefined, baseRate: 0.02 },
    // Singapore (1.5% total)
    { country: 'SGP', state: undefined, baseRate: 0.015 },
    // Norway (1% total)
    { country: 'NOR', state: undefined, baseRate: 0.01 },
  ];

  return locations.map((location, index) => {
    const sessions = Math.round(metrics.totalSessions * location.baseRate);
    const conversionRate = generateRandomInRange(`${accountId}-geo-${index}`, 0.06, 0.12, 0);
    const conversions = Math.round(sessions * conversionRate);
    const revenue = Math.round(metrics.totalRevenue * location.baseRate);

    return {
      country: location.country,
      state: location.state,
      sessions,
      conversions,
      revenue,
      conversionRate: Math.round(conversionRate * 100 * 100) / 100,
    };
  });
}

/**
 * Generate mock coupon data
 */
export function generateMockCoupons(params: MockDataParams): MockCouponData[] {
  const metrics = generateMockMetrics(params);

  const coupons = [
    { code: 'WELCOME10', usageRate: 0.15, discount: 10 },
    { code: 'FREESHIP', usageRate: 0.25, discount: 0 },
    { code: 'SAVE20', usageRate: 0.10, discount: 20 },
    { code: 'BLACKFRIDAY', usageRate: 0.05, discount: 30 },
  ];

  return coupons.map((coupon) => {
    const usage = Math.round(metrics.totalOrders * coupon.usageRate);
    const discount = coupon.discount;
    const revenue = Math.round(metrics.totalRevenue * coupon.usageRate);
    const orders = usage;

    return {
      code: coupon.code,
      usage,
      discount,
      revenue,
      orders,
    };
  });
}

/**
 * Generate mock micro-conversions data
 */
export function generateMockMicroConversions(params: MockDataParams): MockMicroConversion[] {
  const funnel = generateMockFunnel(params);

  const steps = [
    { name: 'Cart View', count: funnel.cart, dropoff: 0 },
    { name: 'Profile Step', count: funnel.profile, dropoff: funnel.cart - funnel.profile },
    { name: 'Shipping Step', count: funnel.shipping, dropoff: funnel.profile - funnel.shipping },
    { name: 'Payment Step', count: funnel.payment, dropoff: funnel.shipping - funnel.payment },
    { name: 'Confirmed', count: funnel.confirmed, dropoff: funnel.payment - funnel.confirmed },
  ];

  return steps.map((step) => {
    const percentage = funnel.cart > 0 ? (step.count / funnel.cart) * 100 : 0;

    return {
      step: step.name,
      count: step.count,
      percentage: Math.round(percentage * 100) / 100,
      dropoff: step.dropoff,
    };
  });
}

/**
 * Generate mock LTV data
 */
export function generateMockLTV(params: MockDataParams): MockLTVData {
  const { accountId } = params;
  const metrics = generateMockMetrics(params);

  const totalCustomers = generateIntInRange(accountId, 200, 500, 0);
  const avgOrdersPerCustomer = generateRandomInRange(accountId, 2.0, 3.5, 0);
  const averageLTV = metrics.avgOrderValue * avgOrdersPerCustomer;
  const recurringCustomers = Math.round(totalCustomers * 0.30);
  const recurringRate = (recurringCustomers / totalCustomers) * 100;

  const segments = [
    { name: 'High LTV', rate: 0.20, multiplier: 2.5 },
    { name: 'Medium LTV', rate: 0.50, multiplier: 1.0 },
    { name: 'Low LTV', rate: 0.30, multiplier: 0.5 },
  ];

  const distribution = segments.map(segment => ({
    segment: segment.name,
    count: Math.round(totalCustomers * segment.rate),
    avgLTV: Math.round(averageLTV * segment.multiplier * 100) / 100,
  }));

  // Generate top customers with LTVs that align with High LTV segment
  const highLTVAvg = averageLTV * 2.5;
  const topCustomers = Array.from({ length: 10 }, (_, index) => {
    // Top customers should have LTVs between 1.5x and 3x the average (High LTV range)
    const ltvMultiplier = generateRandomInRange(`${accountId}-top-cust-${index}`, 1.5, 3.0, 0);
    const customerLTV = Math.round(highLTVAvg * ltvMultiplier * 100) / 100;

    // Calculate orders based on realistic avgOrderValue (should align with metrics)
    const avgOrderValue = generateRandomInRange(`${accountId}-top-cust-aov-${index}`, metrics.avgOrderValue * 0.9, metrics.avgOrderValue * 1.3, 0);
    const orders = Math.max(2, Math.round(customerLTV / avgOrderValue));

    // Recalculate LTV based on actual orders and avgOrderValue for consistency
    const actualLTV = Math.round(orders * avgOrderValue * 100) / 100;

    // Calculate frequency (orders per month) - assume data spans 3 months
    const months = 3;
    const frequency = Math.round((orders / months) * 100) / 100;

    return {
      customerId: `cust-${accountId}-${index}`,
      orders,
      ltv: actualLTV,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      frequency,
    };
  }).sort((a, b) => b.ltv - a.ltv); // Sort by LTV descending

  return {
    averageLTV: Math.round(averageLTV * 100) / 100,
    totalCustomers,
    avgOrdersPerCustomer: Math.round(avgOrdersPerCustomer * 100) / 100,
    recurringRate: Math.round(recurringRate * 100) / 100,
    distribution,
    topCustomers,
  };
}

/**
 * Generate mock cohorts data
 */
export function generateMockCohorts(params: MockDataParams): MockCohortData[] {
  const { accountId } = params;
  const { start } = getMockDateRange(params.period, params.startDate, params.endDate);

  const months = ['Month 1', 'Month 2', 'Month 3'];

  return months.map((cohort, index) => {
    const monthStart = new Date(start);
    monthStart.setMonth(monthStart.getMonth() + index);

    const customers = generateIntInRange(`${accountId}-cohort-${index}`, 50, 200, 0);
    const orders = Math.round(customers * generateRandomInRange(`${accountId}-cohort-${index}`, 1.5, 3.0, 1));
    const revenue = Math.round(orders * generateRandomInRange(`${accountId}-cohort-${index}`, 80, 150, 2));
    const avgLTV = revenue / customers;

    return {
      cohort,
      customers,
      orders,
      revenue,
      avgLTV: Math.round(avgLTV * 100) / 100,
    };
  });
}

/**
 * Generate mock retention data
 */
export function generateMockRetention(params: MockDataParams): MockRetentionData[] {
  const { accountId } = params;

  const periods = [
    { period: 'Week 1', baseRate: 0.40 },
    { period: 'Week 2', baseRate: 0.30 },
    { period: 'Week 4', baseRate: 0.25 },
    { period: 'Month 2', baseRate: 0.20 },
    { period: 'Month 3', baseRate: 0.15 },
  ];

  return periods.map((item, index) => {
    const retentionRate = generateRandomInRange(`${accountId}-retention-${index}`, item.baseRate - 0.05, item.baseRate + 0.05, 0);
    const customers = generateIntInRange(`${accountId}-retention-${index}`, 100, 500, 0);

    return {
      period: item.period,
      retentionRate: Math.round(retentionRate * 100 * 100) / 100,
      customers: Math.round(customers * retentionRate),
    };
  });
}

/**
 * Generate mock friction score
 */
export function generateMockFrictionScore(params: MockDataParams): MockFrictionScore {
  const { accountId } = params;

  const score = generateRandomInRange(accountId, 60, 85, 0); // 60-85 (lower is better)

  const factors = [
    { factor: 'Form Complexity', impact: generateRandomInRange(`${accountId}-friction-0`, 0.1, 0.3, 0) },
    { factor: 'Payment Steps', impact: generateRandomInRange(`${accountId}-friction-1`, 0.05, 0.2, 0) },
    { factor: 'Shipping Options', impact: generateRandomInRange(`${accountId}-friction-2`, 0.05, 0.15, 0) },
    { factor: 'Mobile Experience', impact: generateRandomInRange(`${accountId}-friction-3`, 0.1, 0.25, 0) },
  ];

  const recommendations = [
    'Simplify checkout form fields',
    'Reduce payment steps',
    'Improve mobile checkout experience',
    'Add guest checkout option',
  ];

  return {
    score: Math.round(score * 100) / 100,
    factors: factors.map(f => ({
      factor: f.factor,
      impact: Math.round(f.impact * 100 * 100) / 100,
    })),
    recommendations,
  };
}

/**
 * Generate mock CAC data
 */
export function generateMockCAC(params: MockDataParams): MockCACData {
  const { accountId, period, startDate, endDate } = params;
  const { start, end } = getMockDateRange(period, startDate, endDate);

  const baseCAC = generateRandomInRange(accountId, 20, 50, 0);
  const trend = generateTimeSeriesData(accountId, start, end, baseCAC, 0.2, -0.005); // Decreasing trend

  const channels = [
    { name: 'Organic Search', cac: baseCAC * 0.5, rate: 0.40 },
    { name: 'Social Media', cac: baseCAC * 1.2, rate: 0.30 },
    { name: 'Paid Ads', cac: baseCAC * 2.0, rate: 0.20 },
    { name: 'Direct', cac: baseCAC * 0.3, rate: 0.10 },
  ];

  const totalCustomers = generateIntInRange(accountId, 200, 500, 0);

  return {
    cac: Math.round(baseCAC * 100) / 100,
    channels: channels.map(channel => ({
      channel: channel.name,
      cac: Math.round(channel.cac * 100) / 100,
      customers: Math.round(totalCustomers * channel.rate),
    })),
    trend: trend.map(t => ({
      date: t.date,
      cac: t.value,
    })),
  };
}

/**
 * Generate mock optimization ROI
 */
export function generateMockOptimizationROI(params: MockDataParams): MockOptimizationROI[] {
  const metrics = generateMockMetrics(params);

  const optimizations = [
    { name: 'One-Click Checkout', investment: 5000, impact: 0.15 },
    { name: 'Mobile Optimization', investment: 3000, impact: 0.10 },
    { name: 'Payment Method Expansion', investment: 2000, impact: 0.08 },
    { name: 'Shipping Options', investment: 1500, impact: 0.05 },
  ];

  return optimizations.map((opt) => {
    const revenue = Math.round(metrics.totalRevenue * opt.impact);
    const roi = ((revenue - opt.investment) / opt.investment) * 100;

    return {
      optimization: opt.name,
      investment: opt.investment,
      revenue,
      roi: Math.round(roi * 100) / 100,
      impact: Math.round(opt.impact * 100 * 100) / 100,
    };
  });
}

/**
 * Generate mock segments
 */
export function generateMockSegments(params: MockDataParams): MockSegment[] {
  const { accountId } = params;
  const metrics = generateMockMetrics(params);

  const segments = [
    { name: 'New Customers', rate: 0.40, conversionRate: 0.06 },
    { name: 'Returning Customers', rate: 0.35, conversionRate: 0.12 },
    { name: 'VIP Customers', rate: 0.15, conversionRate: 0.18 },
    { name: 'At-Risk Customers', rate: 0.10, conversionRate: 0.04 },
  ];

  return segments.map((segment, index) => {
    const customers = generateIntInRange(`${accountId}-segment-${index}`, 50, 200, 0);
    const revenue = Math.round(metrics.totalRevenue * segment.rate);
    const avgOrderValue = generateRandomInRange(`${accountId}-segment-${index}`, 80, 180, 0);

    return {
      segment: segment.name,
      customers,
      revenue,
      conversionRate: Math.round(segment.conversionRate * 100 * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    };
  });
}

/**
 * Generate mock revenue forecast
 */
export function generateMockRevenueForecast(params: MockDataParams): MockRevenueForecast {
  const { period, startDate, endDate } = params;
  const { end } = getMockDateRange(period, startDate, endDate);
  const metrics = generateMockMetrics(params);

  // Forecast next 30 days
  const forecast: Array<{ date: string; predicted: number; confidence: number }> = [];
  const baseDaily = metrics.totalRevenue / 90; // Average daily revenue
  const growthRate = 0.02; // 2% daily growth

  for (let i = 1; i <= 30; i++) {
    const date = new Date(end);
    date.setDate(date.getDate() + i);
    const predicted = baseDaily * (1 + growthRate * i);
    const confidence = Math.max(0.7, 1 - (i * 0.01)); // Decreasing confidence

    forecast.push({
      date: date.toISOString().split('T')[0],
      predicted: Math.round(predicted * 100) / 100,
      confidence: Math.round(confidence * 100 * 100) / 100,
    });
  }

  const nextMonth = forecast.reduce((sum, f) => sum + f.predicted, 0);

  return {
    forecast,
    growthRate: Math.round(growthRate * 100 * 100) / 100,
    nextMonth: Math.round(nextMonth * 100) / 100,
  };
}

/**
 * Generate mock abandonment predictions
 */
export function generateMockAbandonmentPredictions(params: MockDataParams): MockAbandonmentPrediction[] {
  const { accountId } = params;
  const metrics = generateMockMetrics(params);
  const abandonedSessions = metrics.totalSessions - metrics.totalConversions;

  // Generate predictions for a sample of abandoned sessions
  const sampleSize = Math.min(50, abandonedSessions);

  return Array.from({ length: sampleSize }, (_, index) => {
    const probability = generateRandomInRange(`${accountId}-abandon-${index}`, 0.6, 0.95, 0);
    const factors = [
      'High cart value',
      'Multiple shipping options',
      'Payment method not available',
      'Mobile device',
    ].slice(0, generateIntInRange(`${accountId}-abandon-${index}`, 1, 3, 0));

    const interventions = [
      'Discount offer',
      'Free shipping',
      'Payment reminder',
      'Cart recovery email',
    ];
    const recommendedIntervention = interventions[generateIntInRange(`${accountId}-abandon-${index}`, 0, interventions.length - 1, 0)];

    return {
      sessionId: generateConsistentId(accountId, index, 'sess-'),
      probability: Math.round(probability * 100 * 100) / 100,
      factors,
      recommendedIntervention,
    };
  });
}

/**
 * Generate mock BoltX predictions
 */
export function generateMockBoltXPredictions(params: MockDataParams): MockBoltXPrediction[] {
  const { accountId, period, startDate, endDate } = params;
  const { start } = getMockDateRange(period, startDate, endDate);
  const metrics = generateMockMetrics(params);

  const count = Math.min(100, metrics.totalSessions);
  const currentDate = new Date(start);

  return Array.from({ length: count }, (_, index) => {
    const daysOffset = index % 90;
    const timestamp = new Date(currentDate);
    timestamp.setDate(timestamp.getDate() + daysOffset);

    const abandonmentProbability = generateRandomInRange(`${accountId}-boltx-pred-${index}`, 0.3, 0.9, 0);
    const predictedValue = generateRandomInRange(`${accountId}-boltx-pred-${index}`, 50, 300, 1);

    const factors = [
      { factor: 'Cart Value', impact: generateRandomInRange(`${accountId}-boltx-pred-${index}`, 0.1, 0.4, 2) },
      { factor: 'Device Type', impact: generateRandomInRange(`${accountId}-boltx-pred-${index}`, 0.05, 0.3, 3) },
      { factor: 'Time on Site', impact: generateRandomInRange(`${accountId}-boltx-pred-${index}`, 0.1, 0.35, 4) },
    ];

    return {
      sessionId: generateConsistentId(accountId, index, 'sess-'),
      customerId: generateConsistentId(accountId, index, 'cust-'),
      abandonmentProbability: Math.round(abandonmentProbability * 100 * 100) / 100,
      predictedValue: Math.round(predictedValue * 100) / 100,
      factors: factors.map(f => ({
        factor: f.factor,
        impact: Math.round(f.impact * 100 * 100) / 100,
      })),
      timestamp: timestamp.toISOString(),
    };
  });
}

/**
 * Generate mock BoltX interventions
 */
export function generateMockBoltXInterventions(params: MockDataParams): MockBoltXIntervention[] {
  const { accountId, period, startDate, endDate } = params;
  const { start } = getMockDateRange(period, startDate, endDate);
  const metrics = generateMockMetrics(params);

  const count = Math.min(50, Math.round(metrics.totalSessions * 0.1)); // 10% of sessions
  const currentDate = new Date(start);

  return Array.from({ length: count }, (_, index) => {
    const daysOffset = index % 90;
    const timestamp = new Date(currentDate);
    timestamp.setDate(timestamp.getDate() + daysOffset);

    const types = ['Discount', 'Free Shipping', 'Payment Reminder', 'Cart Recovery'];
    const type = types[generateIntInRange(`${accountId}-boltx-int-${index}`, 0, types.length - 1, 0)];
    const applied = generateRandomInRange(`${accountId}-boltx-int-${index}`, 0, 1, 1) > 0.3;
    const success = applied && generateRandomInRange(`${accountId}-boltx-int-${index}`, 0, 1, 2) > 0.5;
    const impact = success ? generateRandomInRange(`${accountId}-boltx-int-${index}`, 0.1, 0.3, 3) : 0;

    return {
      id: generateConsistentId(accountId, index, 'int-'),
      sessionId: generateConsistentId(accountId, index, 'sess-'),
      type,
      applied,
      success,
      impact: Math.round(impact * 100 * 100) / 100,
      timestamp: timestamp.toISOString(),
    };
  });
}

/**
 * Generate mock personalization profiles
 */
export function generateMockPersonalizationProfiles(params: MockDataParams): MockPersonalizationProfile[] {
  const { accountId } = params;

  const profiles = [
    { name: 'First-Time Visitors', rules: 3 },
    { name: 'Returning Customers', rules: 5 },
    { name: 'High-Value Shoppers', rules: 4 },
    { name: 'Mobile Users', rules: 2 },
  ];

  return profiles.map((profile, index) => {
    const conversionRate = generateRandomInRange(`${accountId}-profile-${index}`, 0.08, 0.15, 0);
    const revenue = generateRandomInRange(`${accountId}-profile-${index}`, 5000, 20000, 0);

    return {
      profileId: generateConsistentId(accountId, index, 'prof-'),
      name: profile.name,
      rules: profile.rules,
      active: true,
      conversionRate: Math.round(conversionRate * 100 * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
    };
  });
}

/**
 * Generate mock personalization metrics
 */
export function generateMockPersonalizationMetrics(params: MockDataParams): MockPersonalizationMetrics {
  const { accountId } = params;
  const metrics = generateMockMetrics(params);

  return {
    profiles: 4,
    activeRules: 14,
    personalizedSessions: Math.round(metrics.totalSessions * 0.4),
    conversionLift: Math.round(generateRandomInRange(accountId, 0.15, 0.25, 0) * 100 * 100) / 100,
    revenueLift: Math.round(generateRandomInRange(accountId, 0.20, 0.30, 0) * 100 * 100) / 100,
  };
}

/**
 * Generate mock optimizations
 */
export function generateMockOptimizations(params: MockDataParams): MockOptimization[] {
  const { accountId, period, startDate, endDate } = params;
  const { start } = getMockDateRange(period, startDate, endDate);

  const optimizations = [
    { name: 'Simplified Checkout Form', status: 'implemented', impact: 0.12 },
    { name: 'One-Click Payment', status: 'testing', impact: 0.08 },
    { name: 'Mobile Optimization', status: 'planned', impact: 0.15 },
    { name: 'Shipping Calculator', status: 'implemented', impact: 0.05 },
  ];

  const currentDate = new Date(start);

  return optimizations.map((opt, index) => {
    const daysOffset = index * 20;
    const timestamp = new Date(currentDate);
    timestamp.setDate(timestamp.getDate() + daysOffset);

    return {
      id: generateConsistentId(accountId, index, 'opt-'),
      name: opt.name,
      status: opt.status,
      impact: Math.round(opt.impact * 100 * 100) / 100,
      implemented: opt.status === 'implemented',
      timestamp: timestamp.toISOString(),
    };
  });
}

/**
 * Generate mock insights
 */
export function generateMockInsights(params: MockDataParams): MockInsight[] {
  const { accountId } = params;

  const insights = [
    {
      type: 'conversion',
      title: 'Mobile checkout conversion is 40% lower than desktop',
      description: 'Consider optimizing mobile checkout experience to improve conversion rates',
      priority: 'high' as const,
      action: 'Optimize mobile checkout',
      impact: 0.15,
    },
    {
      type: 'revenue',
      title: 'Payment method PIX shows highest conversion rate',
      description: 'PIX has 18% conversion rate vs 10% for credit cards',
      priority: 'high' as const,
      action: 'Promote PIX payment option',
      impact: 0.12,
    },
    {
      type: 'abandonment',
      title: 'Shipping step has highest dropoff rate',
      description: '35% of users abandon at shipping step',
      priority: 'medium' as const,
      action: 'Review shipping options and costs',
      impact: 0.10,
    },
    {
      type: 'optimization',
      title: 'One-click checkout could increase conversions by 25%',
      description: 'Based on similar stores, implementing one-click checkout could significantly improve conversion',
      priority: 'medium' as const,
      action: 'Implement one-click checkout',
      impact: 0.20,
    },
    {
      type: 'customer',
      title: 'Returning customers convert 2x more than new customers',
      description: 'Focus on customer retention strategies',
      priority: 'low' as const,
      action: 'Create customer retention program',
      impact: 0.08,
    },
  ];

  return insights.map((insight, index) => ({
    id: generateConsistentId(accountId, index, 'insight-'),
    type: insight.type,
    title: insight.title,
    description: insight.description,
    priority: insight.priority,
    action: insight.action,
    impact: Math.round(insight.impact * 100 * 100) / 100,
  }));
}

/**
 * Generate mock analytics events data
 * Creates realistic checkout flow events with proper distribution
 * 
 * @param params - Mock data parameters
 * @param paginationParams - Optional pagination parameters to limit generation
 */
export function generateMockAnalyticsEvents(
  params: MockDataParams,
  paginationParams?: {
    page?: number;
    limit?: number;
    eventType?: string | null;
    category?: string | null;
    step?: string | null;
  }
): {
  summary: {
    totalEvents: number;
    uniqueSessions: number;
    eventsByCategory: {
      user_action: number;
      api_call: number;
      metric: number;
      error: number;
    };
    topEventTypes: Array<{ type: string; count: number }>;
    errorCount: number;
  };
  events: Array<{
    id: string;
    session_id: string;
    order_form_id: string | null;
    event_type: string;
    category: 'user_action' | 'api_call' | 'metric' | 'error';
    step: string | null;
    metadata: Record<string, unknown> | null;
    timestamp: string;
  }>;
} {
  const { accountId, period, startDate, endDate } = params;
  const { start, end } = getMockDateRange(period, startDate, endDate);
  const metrics = generateMockMetrics(params);

  // Calculate total sessions (for summary)
  const totalSessions = metrics.totalSessions;
  
  // Limit sessions processed based on pagination to avoid memory issues
  // Estimate: ~10-15 events per session on average
  // For pagination, we need to generate enough sessions to cover the requested page
  const page = paginationParams?.page || 1;
  const limit = paginationParams?.limit || 50;
  const eventsPerSession = 12; // Average events per session
  
  // Calculate how many events we need to generate
  // Account for filters that might reduce the number of events
  const eventsNeeded = page * limit;
  const filterReductionFactor = paginationParams?.eventType || paginationParams?.category || paginationParams?.step ? 0.3 : 1; // Filters reduce events by ~70%
  const eventsToGenerate = Math.ceil(eventsNeeded / filterReductionFactor) + (limit * 2); // Generate extra buffer
  const sessionsNeeded = Math.ceil(eventsToGenerate / eventsPerSession);
  const maxSessionsToProcess = Math.min(500, Math.max(sessionsNeeded, 50)); // Cap at 500 sessions, min 50
  
  // Use a smaller sample for summary calculation (representative sample)
  const summarySampleSize = Math.min(200, totalSessions);
  
  // Generate events only for the sessions we need
  const numSessions = paginationParams ? maxSessionsToProcess : Math.min(500, totalSessions);

  // Generate events
  const events: Array<{
    id: string;
    session_id: string;
    order_form_id: string | null;
    event_type: string;
    category: 'user_action' | 'api_call' | 'metric' | 'error';
    step: string | null;
    metadata: Record<string, unknown> | null;
    timestamp: string;
  }> = [];

  const eventsByCategory = {
    user_action: 0,
    api_call: 0,
    metric: 0,
    error: 0,
  };

  const eventsByType: Record<string, number> = {};

  // Generate events for each session
  for (let sessionIndex = 0; sessionIndex < numSessions; sessionIndex++) {
    const sessionId = generateConsistentId(`${accountId}-sessions`, sessionIndex, 'sess-');
    const orderFormId = generateRandomInRange(`${accountId}-order-${sessionIndex}`, 0, 1, 0) > 0.3
      ? generateConsistentId(`${accountId}-orders`, sessionIndex, 'order-')
      : null;
    
    // Create a realistic checkout flow
    const timeOffset = generateRandomInRange(`${accountId}-session-time-${sessionIndex}`, 0, 1, 0);
    const sessionStartTime = new Date(start.getTime() + 
      timeOffset * (end.getTime() - start.getTime()));
    
    let currentTime = new Date(sessionStartTime);

    // Start event
    events.push({
      id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
      session_id: sessionId,
      order_form_id: orderFormId,
      event_type: 'checkout_started',
      category: 'user_action',
      step: null,
      metadata: { source: 'cart' },
      timestamp: currentTime.toISOString(),
    });
    eventsByCategory.user_action++;
    eventsByType['checkout_started'] = (eventsByType['checkout_started'] || 0) + 1;
    currentTime.setSeconds(currentTime.getSeconds() + generateIntInRange(`${accountId}-time-${events.length}`, 5, 30, 0));

    // Step events
    const steps = ['cart', 'profile', 'shipping', 'payment'];
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const step = steps[stepIndex];
      const viewChance = generateRandomInRange(`${accountId}-view-${sessionIndex}-${stepIndex}`, 0, 1, 0);
      if (viewChance > 0.2) { // 80% chance to view step
        events.push({
          id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
          session_id: sessionId,
          order_form_id: orderFormId,
          event_type: 'step_viewed',
          category: 'user_action',
          step,
          metadata: { step },
          timestamp: currentTime.toISOString(),
        });
        eventsByCategory.user_action++;
        eventsByType['step_viewed'] = (eventsByType['step_viewed'] || 0) + 1;
        currentTime.setSeconds(currentTime.getSeconds() + generateIntInRange(`${accountId}-time-${events.length}`, 10, 60, 0));

        const completeChance = generateRandomInRange(`${accountId}-complete-${sessionIndex}-${stepIndex}`, 0, 1, 0);
        if (completeChance > 0.3) { // 70% chance to complete step
          events.push({
            id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
            session_id: sessionId,
            order_form_id: orderFormId,
            event_type: 'step_completed',
            category: 'user_action',
            step,
            metadata: { step, duration: generateIntInRange(`${accountId}-duration-${events.length}`, 15, 120, 0) },
            timestamp: currentTime.toISOString(),
          });
          eventsByCategory.user_action++;
          eventsByType['step_completed'] = (eventsByType['step_completed'] || 0) + 1;
          currentTime.setSeconds(currentTime.getSeconds() + generateIntInRange(`${accountId}-time-${events.length}`, 5, 20, 0));
        }
      }
    }

    // Payment events
    const paymentChance = generateRandomInRange(`${accountId}-payment-${sessionIndex}`, 0, 1, 0);
    if (orderFormId && paymentChance > 0.4) { // 60% reach payment
      events.push({
        id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
        session_id: sessionId,
        order_form_id: orderFormId,
        event_type: 'payment_method_selected',
        category: 'user_action',
        step: 'payment',
        metadata: { method: ['Visa', 'MasterCard', 'PIX', 'PayPal'][generateIntInRange(`${accountId}-method-${events.length}`, 0, 3, 0)] },
        timestamp: currentTime.toISOString(),
      });
      eventsByCategory.user_action++;
      eventsByType['payment_method_selected'] = (eventsByType['payment_method_selected'] || 0) + 1;
      currentTime.setSeconds(currentTime.getSeconds() + generateIntInRange(`${accountId}-time-${events.length}`, 5, 15, 0));

      const submitChance = generateRandomInRange(`${accountId}-submit-${sessionIndex}`, 0, 1, 0);
      if (submitChance > 0.3) { // 70% submit payment
        events.push({
          id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
          session_id: sessionId,
          order_form_id: orderFormId,
          event_type: 'payment_submitted',
          category: 'user_action',
          step: 'payment',
          metadata: {},
          timestamp: currentTime.toISOString(),
        });
        eventsByCategory.user_action++;
        eventsByType['payment_submitted'] = (eventsByType['payment_submitted'] || 0) + 1;
        currentTime.setSeconds(currentTime.getSeconds() + generateIntInRange(`${accountId}-time-${events.length}`, 2, 10, 0));

        const successChance = generateRandomInRange(`${accountId}-success-${sessionIndex}`, 0, 1, 0);
        if (successChance > 0.2) { // 80% payment succeeds
          events.push({
            id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
            session_id: sessionId,
            order_form_id: orderFormId,
            event_type: 'payment_completed',
            category: 'user_action',
            step: 'payment',
            metadata: { amount: generateRandomInRange(`${accountId}-amount-${events.length}`, 50, 500, 0) },
            timestamp: currentTime.toISOString(),
          });
          eventsByCategory.user_action++;
          eventsByType['payment_completed'] = (eventsByType['payment_completed'] || 0) + 1;
          currentTime.setSeconds(currentTime.getSeconds() + 1);

          events.push({
            id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
            session_id: sessionId,
            order_form_id: orderFormId,
            event_type: 'order_confirmed',
            category: 'user_action',
            step: null,
            metadata: {},
            timestamp: currentTime.toISOString(),
          });
          eventsByCategory.user_action++;
          eventsByType['order_confirmed'] = (eventsByType['order_confirmed'] || 0) + 1;
        } else {
          // Payment failed
          events.push({
            id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
            session_id: sessionId,
            order_form_id: orderFormId,
            event_type: 'error_occurred',
            category: 'error',
            step: 'payment',
            metadata: { error: 'payment_failed', message: 'Payment processing failed' },
            timestamp: currentTime.toISOString(),
          });
          eventsByCategory.error++;
          eventsByType['error_occurred'] = (eventsByType['error_occurred'] || 0) + 1;
        }
      }
    }

    // Add some API calls and metrics
    const apiChance = generateRandomInRange(`${accountId}-api-${sessionIndex}`, 0, 1, 0);
    if (apiChance > 0.5) {
      events.push({
        id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
        session_id: sessionId,
        order_form_id: orderFormId,
        event_type: 'api_call_started',
        category: 'api_call',
        step: null,
        metadata: { endpoint: '/api/checkout' },
        timestamp: currentTime.toISOString(),
      });
      eventsByCategory.api_call++;
      eventsByType['api_call_started'] = (eventsByType['api_call_started'] || 0) + 1;
      currentTime.setSeconds(currentTime.getSeconds() + generateIntInRange(`${accountId}-time-${events.length}`, 1, 5, 0));

      events.push({
        id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
        session_id: sessionId,
        order_form_id: orderFormId,
        event_type: 'api_call_completed',
        category: 'api_call',
        step: null,
        metadata: { duration: generateIntInRange(`${accountId}-duration-${events.length}`, 100, 500, 0) },
        timestamp: currentTime.toISOString(),
      });
      eventsByCategory.api_call++;
      eventsByType['api_call_completed'] = (eventsByType['api_call_completed'] || 0) + 1;
    }

    // Add metrics
    const metricChance = generateRandomInRange(`${accountId}-metric-${sessionIndex}`, 0, 1, 0);
    if (metricChance > 0.6) {
      events.push({
        id: generateConsistentId(`${accountId}-events`, events.length, 'evt-'),
        session_id: sessionId,
        order_form_id: orderFormId,
        event_type: 'step_time_tracked',
        category: 'metric',
        step: 'profile',
        metadata: { duration: generateIntInRange(`${accountId}-duration-${events.length}`, 30, 180, 0) },
        timestamp: currentTime.toISOString(),
      });
      eventsByCategory.metric++;
      eventsByType['step_time_tracked'] = (eventsByType['step_time_tracked'] || 0) + 1;
    }
  }

  // Apply filters if provided (before sorting for better performance)
  let filteredEvents = events;
  if (paginationParams) {
    if (paginationParams.eventType) {
      filteredEvents = filteredEvents.filter(e => e.event_type === paginationParams.eventType);
    }
    if (paginationParams.category) {
      filteredEvents = filteredEvents.filter(e => e.category === paginationParams.category);
    }
    if (paginationParams.step) {
      filteredEvents = filteredEvents.filter(e => e.step === paginationParams.step);
    }
  }

  // Sort events by timestamp (descending)
  filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Calculate summary based on estimated totals (not just generated events)
  // Estimate total events: totalSessions * average events per session
  const estimatedTotalEvents = Math.round(totalSessions * eventsPerSession);
  
  // Estimate summary metrics based on generated sample
  const sampleRatio = numSessions > 0 ? Math.min(1, summarySampleSize / numSessions) : 1;
  const estimatedEventsByCategory = {
    user_action: Math.round(eventsByCategory.user_action / sampleRatio),
    api_call: Math.round(eventsByCategory.api_call / sampleRatio),
    metric: Math.round(eventsByCategory.metric / sampleRatio),
    error: Math.round(eventsByCategory.error / sampleRatio),
  };
  
  // Estimate event types distribution
  const estimatedEventsByType: Record<string, number> = {};
  Object.entries(eventsByType).forEach(([type, count]) => {
    estimatedEventsByType[type] = Math.round(count / sampleRatio);
  });

  // Get top event types
  const topEventTypes = Object.entries(estimatedEventsByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));

  const uniqueSessions = new Set(filteredEvents.map(e => e.session_id)).size;
  const estimatedUniqueSessions = Math.round(totalSessions * 0.95); // Most sessions have events

  return {
    summary: {
      totalEvents: estimatedTotalEvents,
      uniqueSessions: estimatedUniqueSessions,
      eventsByCategory: estimatedEventsByCategory,
      topEventTypes,
      errorCount: estimatedEventsByCategory.error,
    },
    events: filteredEvents,
  };
}

