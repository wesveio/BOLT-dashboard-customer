/**
 * Insights Generator
 * Analyzes checkout data and generates actionable insights
 */

import type { Insight } from '@/app/dashboard/insights/page';

interface CheckoutMetrics {
  conversionRate: number;
  previousConversionRate: number;
  abandonmentRate: number;
  mobileConversionRate: number;
  desktopConversionRate: number;
  avgOrderValue: number;
  previousAOV: number;
  paymentAbandonmentRate: number;
  avgCheckoutTime: number;
  peakHours: string[];
}

/**
 * Generate insights based on checkout metrics
 */
export function generateInsightsFromMetrics(metrics: CheckoutMetrics): Insight[] {
  const insights: Insight[] = [];

  // Conversion Rate Insight
  if (metrics.conversionRate > metrics.previousConversionRate) {
    const improvement = ((metrics.conversionRate - metrics.previousConversionRate) / metrics.previousConversionRate) * 100;
    insights.push({
      id: `conversion-${Date.now()}`,
      type: 'success',
      title: 'Conversion Rate Improved',
      description: `Your checkout conversion rate increased by ${improvement.toFixed(1)}% compared to the previous period.`,
      impact: improvement > 10 ? 'high' : improvement > 5 ? 'medium' : 'low',
      timestamp: 'Just now',
    });
  }

  // Payment Abandonment Warning
  if (metrics.paymentAbandonmentRate > 40) {
    insights.push({
      id: `payment-abandonment-${Date.now()}`,
      type: 'warning',
      title: 'High Abandonment on Payment Step',
      description: `${metrics.paymentAbandonmentRate.toFixed(0)}% of users abandon checkout at the payment step. Consider optimizing payment options or reducing friction.`,
      action: {
        label: 'View Payment Analytics',
        href: '/dashboard/analytics/payment',
      },
      impact: 'high',
      timestamp: 'Just now',
    });
  }

  // Mobile Optimization Recommendation
  if (metrics.mobileConversionRate < metrics.desktopConversionRate * 0.8) {
    const gap = ((metrics.desktopConversionRate - metrics.mobileConversionRate) / metrics.desktopConversionRate) * 100;
    insights.push({
      id: `mobile-optimization-${Date.now()}`,
      type: 'recommendation',
      title: 'Mobile Optimization Opportunity',
      description: `Mobile conversion rate is ${gap.toFixed(0)}% lower than desktop. Consider improving mobile checkout experience.`,
      action: {
        label: 'View Device Analytics',
        href: '/dashboard/analytics/devices',
      },
      impact: gap > 25 ? 'high' : gap > 15 ? 'medium' : 'low',
      timestamp: 'Just now',
    });
  }

  // AOV Improvement
  if (metrics.avgOrderValue > metrics.previousAOV) {
    const improvement = ((metrics.avgOrderValue - metrics.previousAOV) / metrics.previousAOV) * 100;
    insights.push({
      id: `aov-improvement-${Date.now()}`,
      type: 'success',
      title: 'Average Order Value Increased',
      description: `AOV increased by ${improvement.toFixed(1)}% this period. Great job on upselling and cross-selling!`,
      impact: improvement > 10 ? 'high' : improvement > 5 ? 'medium' : 'low',
      timestamp: 'Just now',
    });
  }

  // Peak Hours Info
  if (metrics.peakHours.length > 0) {
    insights.push({
      id: `peak-hours-${Date.now()}`,
      type: 'info',
      title: 'Peak Hours Identified',
      description: `Most checkouts occur between ${metrics.peakHours.join(' and ')}. Consider scheduling promotions or email campaigns during these hours.`,
      impact: 'low',
      timestamp: 'Just now',
    });
  }

  // Checkout Time Optimization
  if (metrics.avgCheckoutTime > 900) {
    insights.push({
      id: `checkout-time-${Date.now()}`,
      type: 'recommendation',
      title: 'Checkout Time Optimization',
      description: `Average checkout time is ${(metrics.avgCheckoutTime / 60).toFixed(1)} minutes. Consider streamlining the checkout process to reduce friction.`,
      action: {
        label: 'View Performance',
        href: '/dashboard/performance',
      },
      impact: metrics.avgCheckoutTime > 1200 ? 'high' : 'medium',
      timestamp: 'Just now',
    });
  }

  // Sort by impact (high first)
  return insights.sort((a, b) => {
    const impactOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
    return impactOrder[b.impact as 'high' | 'medium' | 'low'] - impactOrder[a.impact as 'high' | 'medium' | 'low'];
  });
}

/**
 * Generate benchmark insights (comparing to industry standards)
 */
export function generateBenchmarkInsights(metrics: CheckoutMetrics): Insight[] {
  const insights: Insight[] = [];
  const industryAvgConversion = 65; // Industry average conversion rate

  if (metrics.conversionRate < industryAvgConversion) {
    const gap = industryAvgConversion - metrics.conversionRate;
    insights.push({
      id: `benchmark-conversion-${Date.now()}`,
      type: 'warning',
      title: 'Below Industry Average',
      description: `Your conversion rate (${metrics.conversionRate.toFixed(1)}%) is ${gap.toFixed(1)}% below the industry average (${industryAvgConversion}%).`,
      action: {
        label: 'View Performance',
        href: '/dashboard/performance',
      },
      impact: gap > 10 ? 'high' : gap > 5 ? 'medium' : 'low',
      timestamp: 'Just now',
    });
  }

  return insights;
}

