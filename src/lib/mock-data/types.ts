/**
 * Types for Mock Data
 * 
 * TypeScript types for all mock data structures
 */

export type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface MockDataParams {
  accountId: string;
  period: Period;
  startDate?: Date;
  endDate?: Date;
}

export interface MockMetrics {
  totalSessions: number;
  totalConversions: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  conversionRate: number;
  abandonmentRate: number;
  avgCheckoutTime: number;
  revenueGrowth: number;
}

export interface MockFunnel {
  cart: number;
  profile: number;
  shipping: number;
  payment: number;
  confirmed: number;
}

export interface MockRevenueData {
  metrics: {
    totalRevenue: number;
    avgOrderValue: number;
    totalOrders: number;
    revenuePerHour: number;
    revenueGrowth: number;
  };
  chartData: Array<{ date: string; revenue: number }>;
  revenueByHour: Array<{ hour: string; revenue: number }>;
  revenueByDay: Array<{ day: string; revenue: number }>;
  period: Period;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface MockPaymentMethod {
  method: string;
  count: number;
  revenue: number;
  percentage: number;
  conversionRate: number;
}

export interface MockShippingMethod {
  method: string;
  count: number;
  percentage: number;
  avgDeliveryTime: number;
}

export interface MockDeviceData {
  device: string;
  sessions: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  percentage: number;
}

export interface MockBrowserData {
  browser: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  percentage: number;
}

export interface MockGeographyData {
  country: string;
  state?: string;
  sessions: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export interface MockCouponData {
  code: string;
  usage: number;
  discount: number;
  revenue: number;
  orders: number;
}

export interface MockMicroConversion {
  step: string;
  count: number;
  percentage: number;
  dropoff: number;
}

export interface MockLTVData {
  averageLTV: number;
  totalCustomers: number;
  avgOrdersPerCustomer: number;
  recurringRate: number;
  distribution: Array<{ segment: string; count: number; avgLTV: number }>;
  topCustomers: Array<{
    customerId: string;
    orders: number;
    ltv: number;
    avgOrderValue: number;
    frequency: number;
  }>;
}

export interface MockCohortData {
  cohort: string;
  customers: number;
  orders: number;
  revenue: number;
  avgLTV: number;
}

export interface MockRetentionData {
  period: string;
  retentionRate: number;
  customers: number;
}

export interface MockFrictionScore {
  score: number;
  factors: Array<{ factor: string; impact: number }>;
  recommendations: string[];
}

export interface MockCACData {
  cac: number;
  channels: Array<{ channel: string; cac: number; customers: number }>;
  trend: Array<{ date: string; cac: number }>;
}

export interface MockOptimizationROI {
  optimization: string;
  investment: number;
  revenue: number;
  roi: number;
  impact: number;
}

export interface MockSegment {
  segment: string;
  customers: number;
  revenue: number;
  conversionRate: number;
  avgOrderValue: number;
}

export interface MockRevenueForecast {
  forecast: Array<{ date: string; predicted: number; confidence: number }>;
  growthRate: number;
  nextMonth: number;
}

export interface MockAbandonmentPrediction {
  sessionId: string;
  probability: number;
  factors: string[];
  recommendedIntervention: string;
}

export interface MockBoltXPrediction {
  sessionId: string;
  customerId: string;
  abandonmentProbability: number;
  predictedValue: number;
  factors: Array<{ factor: string; impact: number }>;
  timestamp: string;
}

export interface MockBoltXIntervention {
  id: string;
  sessionId: string;
  type: string;
  applied: boolean;
  success: boolean;
  impact: number;
  timestamp: string;
}

export interface MockPersonalizationProfile {
  profileId: string;
  name: string;
  rules: number;
  active: boolean;
  conversionRate: number;
  revenue: number;
}

export interface MockPersonalizationMetrics {
  profiles: number;
  activeRules: number;
  personalizedSessions: number;
  conversionLift: number;
  revenueLift: number;
}

export interface MockOptimization {
  id: string;
  name: string;
  status: string;
  impact: number;
  implemented: boolean;
  timestamp: string;
}

export interface MockInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: number;
}

export interface MockTimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

