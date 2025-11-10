/**
 * Mock Data Helper Functions
 * 
 * Utility functions for generating consistent mock data
 */

import type { Period } from './types';

/**
 * Simple seeded random number generator
 * Ensures same account_id always generates same data
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Convert string to number seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    this.seed = Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

/**
 * Generate consistent ID based on seed and index
 */
export function generateConsistentId(seed: string, index: number, prefix: string = ''): string {
  const rng = new SeededRandom(`${seed}-${index}`);
  const id = rng.nextInt(100000, 999999);
  return `${prefix}${id}`;
}

/**
 * Generate random number in range (consistent based on seed)
 */
export function generateRandomInRange(
  seed: string,
  min: number,
  max: number,
  index: number = 0
): number {
  const rng = new SeededRandom(`${seed}-${index}`);
  return rng.nextFloat(min, max);
}

/**
 * Generate integer in range
 */
export function generateIntInRange(
  seed: string,
  min: number,
  max: number,
  index: number = 0
): number {
  const rng = new SeededRandom(`${seed}-${index}`);
  return rng.nextInt(min, max);
}

/**
 * Apply trend to value (growth over time)
 */
export function applyTrend(
  baseValue: number,
  daysSinceStart: number,
  growthRate: number = 0.02 // 2% daily growth
): number {
  return baseValue * (1 + growthRate * daysSinceStart);
}

/**
 * Generate time series data for 3 months (90 days)
 */
export function generateTimeSeriesData(
  seed: string,
  startDate: Date,
  endDate: Date,
  baseValue: number,
  variance: number = 0.2,
  trend: number = 0.01
): Array<{ date: string; value: number }> {
  const data: Array<{ date: string; value: number }> = [];
  const currentDate = new Date(startDate);
  let dayIndex = 0;

  while (currentDate <= endDate) {
    const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trendValue = applyTrend(baseValue, daysSinceStart, trend);
    const randomFactor = generateRandomInRange(seed, 1 - variance, 1 + variance, dayIndex);
    
    // Apply weekly pattern (weekends lower)
    const dayOfWeek = currentDate.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
    
    const value = Math.max(0, trendValue * randomFactor * weekendFactor);
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });

    currentDate.setDate(currentDate.getDate() + 1);
    dayIndex++;
  }

  return data;
}

/**
 * Generate hourly data for a day
 */
export function generateHourlyData(
  seed: string,
  date: Date,
  baseValue: number,
  variance: number = 0.3
): Array<{ hour: number; value: number }> {
  const data: Array<{ hour: number; value: number }> = [];
  const daySeed = `${seed}-${date.toISOString().split('T')[0]}`;

  for (let hour = 0; hour < 24; hour++) {
    // Business hours (9-17) have higher values
    const businessHourFactor = (hour >= 9 && hour <= 17) ? 1.5 : 0.5;
    const randomFactor = generateRandomInRange(daySeed, 1 - variance, 1 + variance, hour);
    const value = baseValue * businessHourFactor * randomFactor;

    data.push({
      hour,
      value: Math.max(0, Math.round(value * 100) / 100),
    });
  }

  return data;
}

/**
 * Get date range for period (last 3 months)
 */
export function getMockDateRange(period: Period, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const end = customEnd || new Date();
  let start: Date;

  if (period === 'custom' && customStart) {
    start = customStart;
  } else {
    // Always use 3 months as base
    start = new Date(end);
    start.setMonth(start.getMonth() - 3);
  }

  // Ensure we have at least 3 months of data
  const threeMonthsAgo = new Date(end);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  if (start < threeMonthsAgo) {
    start = threeMonthsAgo;
  }

  return { start, end };
}

/**
 * Filter time series data by period
 */
export function filterByPeriod<T extends { date: string }>(
  data: T[],
  period: Period,
  customStart?: Date,
  customEnd?: Date
): T[] {
  const { start, end } = getMockDateRange(period, customStart, customEnd);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  return data.filter(item => {
    const itemDate = item.date.split('T')[0];
    return itemDate >= startStr && itemDate <= endStr;
  });
}

/**
 * Generate customer data with consistent IDs
 */
export function generateCustomerData(seed: string, count: number): Array<{
  customerId: string;
  email: string;
  name: string;
  orders: number;
  totalSpent: number;
}> {
  const customers: Array<{
    customerId: string;
    email: string;
    name: string;
    orders: number;
    totalSpent: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const customerId = generateConsistentId(seed, i, 'cust-');
    const orders = generateIntInRange(seed, 1, 10, i);
    const avgOrderValue = generateRandomInRange(seed, 50, 200, i);
    const totalSpent = orders * avgOrderValue;

    customers.push({
      customerId,
      email: `customer${i}@example.com`,
      name: `Customer ${i + 1}`,
      orders,
      totalSpent: Math.round(totalSpent * 100) / 100,
    });
  }

  return customers;
}

/**
 * Generate distribution (returns array of values that sum to 100)
 */
export function generateDistribution(
  seed: string,
  items: string[],
  total: number = 100
): Array<{ name: string; value: number; percentage: number }> {
  const rng = new SeededRandom(seed);
  const values: number[] = [];
  let sum = 0;

  // Generate random values
  for (let i = 0; i < items.length; i++) {
    const value = rng.nextFloat(10, 40);
    values.push(value);
    sum += value;
  }

  // Normalize to total
  const result = items.map((name, i) => {
    const value = (values[i] / sum) * total;
    return {
      name,
      value: Math.round(value * 100) / 100,
      percentage: Math.round((value / total) * 100 * 100) / 100,
    };
  });

  return result;
}

/**
 * Calculate days between dates
 */
export function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format date for API response
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString();
}

/**
 * Calculate growth factor based on monthly growth rate
 * Uses compound growth: (1 + monthlyRate) ^ months
 */
export function calculateGrowthFactor(
  startDate: Date,
  endDate: Date,
  monthlyGrowthRate: number
): number {
  // Calculate number of months between dates
  const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth()) +
                     (endDate.getDate() - startDate.getDate()) / 30;
  
  // Apply compound growth
  return Math.pow(1 + monthlyGrowthRate, Math.max(0, monthsDiff));
}

