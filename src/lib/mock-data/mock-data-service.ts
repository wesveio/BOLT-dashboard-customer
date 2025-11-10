/**
 * Mock Data Service
 * 
 * Centralized service for generating mock data for demo mode
 */

import type { MockDataParams, Period } from './types';
import { parsePeriod } from '@/utils/date-ranges';
import {
  generateMockMetrics,
  generateMockFunnel,
  generateMockRevenueData,
  generateMockPaymentMethods,
  generateMockShippingMethods,
  generateMockDevices,
  generateMockBrowsers,
  generateMockGeography,
  generateMockCoupons,
  generateMockMicroConversions,
  generateMockLTV,
  generateMockCohorts,
  generateMockRetention,
  generateMockFrictionScore,
  generateMockCAC,
  generateMockOptimizationROI,
  generateMockSegments,
  generateMockRevenueForecast,
  generateMockAbandonmentPredictions,
  generateMockBoltXPredictions,
  generateMockBoltXInterventions,
  generateMockPersonalizationProfiles,
  generateMockPersonalizationMetrics,
  generateMockOptimizations,
  generateMockInsights,
  generateMockAnalyticsEvents,
} from './mock-data-generators';
import { generateRandomInRange, generateIntInRange, getMockDateRange } from './mock-data-helpers';

/**
 * Get mock data for a specific endpoint
 */
export function getMockDataForEndpoint(
  endpoint: string,
  accountId: string,
  period?: Period,
  startDate?: Date,
  endDate?: Date,
  queryParams?: Record<string, string | null>
): any {
  const params: MockDataParams = {
    accountId,
    period: period || 'month',
    startDate,
    endDate,
  };

  // Route to appropriate generator based on endpoint
  switch (endpoint) {
    case 'metrics':
      return {
        metrics: generateMockMetrics(params),
        funnel: generateMockFunnel(params),
        period: params.period,
        dateRange: {
          start: startDate?.toISOString() || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate?.toISOString() || new Date().toISOString(),
        },
      };

    case 'revenue':
      return generateMockRevenueData(params);

    case 'performance':
      {
        const metrics = generateMockMetrics(params);
        const funnel = generateMockFunnel(params);
        const funnelData = [
          { step: 'cart', label: 'Cart', count: funnel.cart, percentage: 100 },
          { step: 'profile', label: 'Profile', count: funnel.profile, percentage: funnel.cart > 0 ? (funnel.profile / funnel.cart) * 100 : 0 },
          { step: 'shipping', label: 'Shipping', count: funnel.shipping, percentage: funnel.cart > 0 ? (funnel.shipping / funnel.cart) * 100 : 0 },
          { step: 'payment', label: 'Payment', count: funnel.payment, percentage: funnel.cart > 0 ? (funnel.payment / funnel.cart) * 100 : 0 },
          { step: 'confirmed', label: 'Confirmed', count: funnel.confirmed, percentage: metrics.conversionRate },
        ];
        const stepMetrics = [
          { step: 'cart', label: 'Cart', avgTime: 0, abandonment: 0 },
          { step: 'profile', label: 'Profile', avgTime: 45, abandonment: Math.round(((funnel.cart - funnel.profile) / funnel.cart) * 100 * 10) / 10 },
          { step: 'shipping', label: 'Shipping', avgTime: 60, abandonment: Math.round(((funnel.profile - funnel.shipping) / funnel.profile) * 100 * 10) / 10 },
          { step: 'payment', label: 'Payment', avgTime: 90, abandonment: Math.round(((funnel.shipping - funnel.payment) / funnel.shipping) * 100 * 10) / 10 },
        ];
        return {
          metrics: {
            conversionRate: metrics.conversionRate.toFixed(1),
            abandonmentRate: metrics.abandonmentRate.toFixed(1),
            avgCheckoutTime: metrics.avgCheckoutTime,
            totalSessions: metrics.totalSessions,
          },
          funnel: funnelData,
          stepMetrics,
          period: params.period,
          dateRange: {
            start: params.startDate?.toISOString() || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            end: params.endDate?.toISOString() || new Date().toISOString(),
          },
        };
      }

    case 'insights':
      return {
        insights: generateMockInsights(params),
      };

    case 'analytics-payment':
      {
        const methods = generateMockPaymentMethods(params);
        const totalPayments = methods.reduce((sum, m) => sum + m.count, 0);
        const avgSuccessRate = methods.length > 0
          ? methods.reduce((sum, m) => sum + m.conversionRate, 0) / methods.length
          : 0;
        return {
          paymentMethods: methods.map(m => ({
            name: m.method,
            value: m.count,
            revenue: m.revenue,
            successRate: m.conversionRate,
          })),
          totalPayments,
          avgSuccessRate: avgSuccessRate.toFixed(1),
          period: params.period,
        };
      }

    case 'analytics-shipping':
      {
        const methods = generateMockShippingMethods(params);
        const totalShipments = methods.reduce((sum, m) => sum + m.count, 0);
        const avgShippingCost = totalShipments > 0
          ? methods.reduce((sum, m) => sum + (m.avgDeliveryTime * 10 * m.count), 0) / totalShipments
          : 0;
        return {
          shippingMethods: methods.map(m => ({
            method: m.method,
            count: m.count,
            avgDays: m.avgDeliveryTime,
            avgCost: Math.round(m.avgDeliveryTime * 10 * 100) / 100,
          })),
          totalShipments,
          avgShippingCost: avgShippingCost.toFixed(2),
          period: params.period,
        };
      }

    case 'analytics-devices':
      {
        const devices = generateMockDevices(params);
        const totalSessions = devices.reduce((sum, d) => sum + d.sessions, 0);
        const avgConversion = devices.length > 0
          ? devices.reduce((sum, d) => sum + d.conversionRate, 0) / devices.length
          : 0;
        return {
          devices: devices.map(d => ({
            device: d.device,
            sessions: d.sessions,
            conversion: d.conversionRate,
            revenue: d.revenue,
          })),
          totalSessions,
          avgConversion: avgConversion.toFixed(1),
          period: params.period,
        };
      }

    case 'analytics-browsers':
      {
        const browsers = generateMockBrowsers(params);
        const totalSessions = browsers.reduce((sum, b) => sum + b.sessions, 0);
        const avgConversion = browsers.length > 0
          ? browsers.reduce((sum, b) => sum + b.conversionRate, 0) / browsers.length
          : 0;
        // Generate platforms data
        const platforms = [
          { name: 'Windows', baseRate: 0.50 },
          { name: 'macOS', baseRate: 0.30 },
          { name: 'Linux', baseRate: 0.10 },
          { name: 'Mobile', baseRate: 0.10 },
        ];
        const platformData = platforms.map((p, index) => {
          const sessions = Math.round(totalSessions * p.baseRate);
          const conversionRate = generateRandomInRange(`${params.accountId}-platform-${index}`, 0.07, 0.13, 0);
          const conversions = Math.round(sessions * conversionRate);
          const revenue = Math.round(totalSessions * p.baseRate * 100);
          return {
            platform: p.name,
            sessions,
            conversion: Math.round(conversionRate * 100 * 100) / 100,
            revenue,
          };
        });
        return {
          browsers: browsers.map(b => ({
            browser: b.browser,
            sessions: b.sessions,
            conversion: b.conversionRate,
            revenue: b.sessions * 100, // Approximate revenue
            marketShare: totalSessions > 0 ? Math.round((b.sessions / totalSessions) * 100 * 100) / 100 : 0,
          })),
          platforms: platformData,
          totalSessions,
          avgConversion: avgConversion.toFixed(1),
          period: params.period,
        };
      }

    case 'analytics-geography':
      {
        const locations = generateMockGeography(params);
        const totalSessions = locations.reduce((sum, l) => sum + l.sessions, 0);
        const totalOrders = locations.reduce((sum, l) => sum + l.conversions, 0);
        const totalRevenue = locations.reduce((sum, l) => sum + l.revenue, 0);
        const overallConversionRate = totalSessions > 0
          ? (totalOrders / totalSessions) * 100
          : 0;
        return {
          countries: locations.filter(l => !l.state).map(l => ({
            country: l.country,
            sessions: l.sessions,
            orders: l.conversions,
            revenue: l.revenue,
            conversions: l.conversions,
            conversionRate: l.conversionRate,
            avgOrderValue: l.conversions > 0 ? l.revenue / l.conversions : 0,
          })),
          states: locations.filter(l => l.state).map(l => ({
            country: l.country,
            state: l.state,
            sessions: l.sessions,
            orders: l.conversions,
            revenue: l.revenue,
            conversions: l.conversions,
            conversionRate: l.conversionRate,
            avgOrderValue: l.conversions > 0 ? l.revenue / l.conversions : 0,
          })),
          summary: {
            totalSessions,
            totalOrders,
            totalRevenue,
            overallConversionRate: Math.round(overallConversionRate * 100) / 100,
          },
          period: params.period,
        };
      }

    case 'analytics-coupons':
      {
        const coupons = generateMockCoupons(params);
        const totalDiscounts = coupons.reduce((sum, c) => sum + c.usage, 0);
        const totalDiscountAmount = coupons.reduce((sum, c) => sum + (c.discount * c.usage), 0);
        const avgDiscountAmount = totalDiscounts > 0 ? totalDiscountAmount / totalDiscounts : 0;
        const totalOrders = coupons.reduce((sum, c) => sum + c.orders, 0);
        const ordersWithDiscount = totalDiscounts;
        const ordersWithoutDiscount = Math.max(0, totalOrders - ordersWithDiscount);
        const revenueWithDiscount = coupons.reduce((sum, c) => sum + c.revenue, 0);
        const revenueWithoutDiscount = revenueWithDiscount * 0.7; // Approximate
        const couponUsageRate = totalOrders > 0 ? (ordersWithDiscount / totalOrders) * 100 : 0;
        return {
          coupons: coupons.map(c => ({
            code: c.code,
            count: c.usage,
            totalDiscount: c.discount * c.usage,
            avgDiscount: c.discount,
            revenue: c.revenue,
            orders: c.orders,
          })),
          summary: {
            totalDiscounts,
            totalDiscountAmount,
            avgDiscountAmount: Math.round(avgDiscountAmount * 100) / 100,
            revenueWithDiscount,
            revenueWithoutDiscount,
            ordersWithDiscount,
            ordersWithoutDiscount,
            couponUsageRate: Math.round(couponUsageRate * 100) / 100,
          },
          period: params.period,
        };
      }

    case 'analytics-micro-conversions':
      {
        const conversions = generateMockMicroConversions(params);
        const totalSessions = conversions[0]?.count || 0;
        const overallConversionRate = conversions[conversions.length - 1]?.percentage || 0;
        const dropOffs = conversions.map((conv, index) => {
          if (index === 0) {
            return { step: conv.step, dropOff: 0, dropOffRate: 0 };
          }
          const previous = conversions[index - 1];
          const dropOff = previous.count - conv.count;
          return {
            step: conv.step,
            dropOff: Math.max(0, dropOff),
            dropOffRate: previous.count > 0 ? (dropOff / previous.count) * 100 : 0,
          };
        });
        return {
          microConversions: conversions.map(c => ({
            step: c.step.toLowerCase().replace(' ', '_'),
            label: c.step,
            reached: c.count,
            completed: c.count,
            conversionRate: c.percentage,
            description: `Users who reached ${c.step}`,
          })),
          dropOffs,
          summary: {
            totalSessions,
            overallConversionRate: Math.round(overallConversionRate * 100) / 100,
          },
          period: params.period,
        };
      }

    case 'analytics-ltv':
      {
        const ltvData = generateMockLTV(params);
        return {
          summary: {
            totalCustomers: ltvData.totalCustomers,
            totalRevenue: ltvData.totalCustomers * ltvData.averageLTV,
            avgLTV: ltvData.averageLTV,
            avgOrdersPerCustomer: ltvData.avgOrdersPerCustomer,
            recurringRate: ltvData.recurringRate,
            ltvSegments: {
              high: ltvData.distribution.find(d => d.segment === 'High LTV')?.count || 0,
              medium: ltvData.distribution.find(d => d.segment === 'Medium LTV')?.count || 0,
              low: ltvData.distribution.find(d => d.segment === 'Low LTV')?.count || 0,
            },
          },
          customers: ltvData.topCustomers,
          ltvBySegment: ltvData.distribution.reduce((acc, d) => {
            acc[d.segment.toLowerCase().replace(' ', '_')] = {
              customers: d.count,
              totalRevenue: d.count * d.avgLTV,
              avgLTV: d.avgLTV,
            };
            return acc;
          }, {} as Record<string, { customers: number; totalRevenue: number; avgLTV: number }>),
          period: params.period,
        };
      }

    case 'analytics-cohorts':
      {
        const cohorts = generateMockCohorts(params);
        const totalCohorts = cohorts.length;
        const totalCustomers = cohorts.reduce((sum, c) => sum + c.customers, 0);
        const avgCohortSize = totalCohorts > 0 ? totalCustomers / totalCohorts : 0;
        const avgLTV = cohorts.length > 0
          ? cohorts.reduce((sum, c) => sum + c.avgLTV, 0) / cohorts.length
          : 0;
        const avgRetentionByPeriod: Record<number, number> = {};
        // Generate retention matrix for each cohort
        const cohortData = cohorts.map((cohort, index) => {
          const retentionMatrix = Array.from({ length: 12 }, (_, period) => {
            const retentionRate = Math.max(0, 100 - (period * 8) - generateRandomInRange(`${params.accountId}-cohort-${index}-${period}`, 0, 10, 0));
            return {
              period,
              retentionRate: Math.round(retentionRate * 100) / 100,
              customers: Math.round(cohort.customers * (retentionRate / 100)),
              revenue: Math.round(cohort.revenue * (retentionRate / 100)),
              orders: Math.round(cohort.orders * (retentionRate / 100)),
            };
          });
          // Update avgRetentionByPeriod
          retentionMatrix.forEach((period) => {
            if (!avgRetentionByPeriod[period.period]) {
              avgRetentionByPeriod[period.period] = 0;
            }
            avgRetentionByPeriod[period.period] += period.retentionRate;
          });
          return {
            cohort: cohort.cohort,
            cohortSize: cohort.customers,
            totalRevenue: cohort.revenue,
            avgLTV: cohort.avgLTV,
            retentionMatrix,
          };
        });
        // Calculate average retention rates
        Object.keys(avgRetentionByPeriod).forEach((periodStr) => {
          const period = parseInt(periodStr);
          avgRetentionByPeriod[period] = totalCohorts > 0
            ? avgRetentionByPeriod[period] / totalCohorts
            : 0;
        });
        return {
          summary: {
            totalCohorts,
            totalCustomers,
            avgCohortSize: Math.round(avgCohortSize * 100) / 100,
            avgLTV: Math.round(avgLTV * 100) / 100,
            avgRetentionByPeriod,
          },
          cohorts: cohortData,
          period: params.period,
        };
      }

    case 'analytics-retention':
      {
        const retention = generateMockRetention(params);
        const totalCustomers = retention.reduce((sum, r) => sum + r.customers, 0);
        const newCustomers = Math.round(totalCustomers * 0.4);
        const returningCustomers = Math.round(totalCustomers * 0.35);
        const churnedCustomers = Math.round(totalCustomers * 0.25);
        const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
        const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;
        const avgPurchaseFrequency = generateRandomInRange(params.accountId, 1.5, 2.5, 0);
        const avgDaysBetweenPurchases = generateRandomInRange(params.accountId, 25, 45, 0);
        const retentionRates = {
          d1: generateRandomInRange(`${params.accountId}-retention-d1`, 20, 30, 0),
          d7: generateRandomInRange(`${params.accountId}-retention-d7`, 15, 25, 0),
          d30: generateRandomInRange(`${params.accountId}-retention-d30`, 10, 20, 0),
          d90: generateRandomInRange(`${params.accountId}-retention-d90`, 5, 15, 0),
        };
        const cohortData = retention.map((r, index) => {
          const cohortMonth = new Date();
          cohortMonth.setMonth(cohortMonth.getMonth() - (retention.length - index));
          return {
            cohort: `${cohortMonth.getFullYear()}-${String(cohortMonth.getMonth() + 1).padStart(2, '0')}`,
            customers: r.customers,
            retentionByPeriod: {
              d30: r.retentionRate * 0.8,
              d60: r.retentionRate * 0.6,
              d90: r.retentionRate * 0.4,
            },
          };
        });
        return {
          summary: {
            totalCustomers,
            newCustomers,
            returningCustomers,
            churnedCustomers,
            retentionRate: Math.round(retentionRate * 100) / 100,
            churnRate: Math.round(churnRate * 100) / 100,
            avgPurchaseFrequency: Math.round(avgPurchaseFrequency * 100) / 100,
            avgDaysBetweenPurchases: Math.round(avgDaysBetweenPurchases),
            retentionRates,
          },
          cohorts: cohortData.slice(-12),
          period: params.period,
        };
      }

    case 'analytics-friction-score':
      {
        const friction = generateMockFrictionScore(params);
        const totalSessions = generateIntInRange(params.accountId, 500, 2000, 0);
        const highFrictionSessions = Math.round(totalSessions * 0.3);
        const lowFrictionSessions = Math.round(totalSessions * 0.7);
        const highFrictionConversionRate = generateRandomInRange(`${params.accountId}-friction-high`, 5, 10, 0);
        const lowFrictionConversionRate = generateRandomInRange(`${params.accountId}-friction-low`, 15, 25, 0);
        const frictionScores = Array.from({ length: Math.min(100, totalSessions) }, (_, index) => {
          const sessionScore = generateRandomInRange(`${params.accountId}-friction-session-${index}`, 20, 80, 0);
          return {
            sessionId: `sess-${index}`,
            score: {
              score: Math.round(sessionScore * 100) / 100,
              breakdown: {
                timeFactor: Math.round(generateRandomInRange(`${params.accountId}-friction-time-${index}`, 0.1, 0.3, 0) * 100) / 100,
                errorFactor: Math.round(generateRandomInRange(`${params.accountId}-friction-error-${index}`, 0.05, 0.2, 0) * 100) / 100,
                navigationFactor: Math.round(generateRandomInRange(`${params.accountId}-friction-nav-${index}`, 0.05, 0.15, 0) * 100) / 100,
                formFactor: Math.round(generateRandomInRange(`${params.accountId}-friction-form-${index}`, 0.1, 0.25, 0) * 100) / 100,
              },
            },
            conversion: sessionScore < 50,
          };
        });
        const frictionTrend = Array.from({ length: 30 }, (_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (30 - index));
          return {
            date: date.toISOString().split('T')[0],
            avgFriction: Math.round((friction.score + generateRandomInRange(`${params.accountId}-friction-trend-${index}`, -5, 5, 0)) * 100) / 100,
            conversionRate: Math.round(generateRandomInRange(`${params.accountId}-friction-conv-${index}`, 8, 15, 0) * 100) / 100,
          };
        });
        return {
          summary: {
            totalSessions,
            avgFrictionScore: Math.round(friction.score * 100) / 100,
            frictionDistribution: {
              low: lowFrictionSessions,
              medium: Math.round(totalSessions * 0.2),
              high: highFrictionSessions,
            },
            frictionBreakdown: {
              timeFactor: friction.factors[0]?.impact || 0.2,
              errorFactor: friction.factors[1]?.impact || 0.15,
              navigationFactor: friction.factors[2]?.impact || 0.1,
              formFactor: friction.factors[3]?.impact || 0.15,
            },
            highFrictionConversionRate: Math.round(highFrictionConversionRate * 100) / 100,
            lowFrictionConversionRate: Math.round(lowFrictionConversionRate * 100) / 100,
            correlation: Math.round((lowFrictionConversionRate - highFrictionConversionRate) * 100) / 100,
          },
          frictionScores: frictionScores.sort((a, b) => b.score.score - a.score.score).slice(0, 100),
          frictionTrend,
          period: params.period,
        };
      }

    case 'analytics-cac':
      {
        const cacData = generateMockCAC(params);
        const totalNewCustomers = cacData.channels.reduce((sum, c) => sum + c.customers, 0);
        const totalEstimatedMarketingSpend = cacData.channels.reduce((sum, c) => sum + (c.cac * c.customers), 0);
        const avgCAC = totalNewCustomers > 0 ? totalEstimatedMarketingSpend / totalNewCustomers : cacData.cac;
        const totalRevenue = cacData.channels.reduce((sum, c) => sum + (c.cac * c.customers * 2), 0);
        const avgLTV = totalNewCustomers > 0 ? (totalRevenue / totalNewCustomers) * 2 : cacData.cac * 3;
        const ltvCacRatio = avgCAC > 0 ? avgLTV / avgCAC : 0;
        const acquisitionEfficiency = {
          excellent: ltvCacRatio >= 3,
          good: ltvCacRatio >= 2 && ltvCacRatio < 3,
          needsImprovement: ltvCacRatio < 2,
          ratio: Math.round(ltvCacRatio * 100) / 100,
        };
        return {
          summary: {
            totalNewCustomers,
            avgCAC: Math.round(avgCAC * 100) / 100,
            avgLTV: Math.round(avgLTV * 100) / 100,
            ltvCacRatio: Math.round(ltvCacRatio * 100) / 100,
            totalEstimatedMarketingSpend: Math.round(totalEstimatedMarketingSpend * 100) / 100,
            acquisitionEfficiency,
          },
          channels: cacData.channels.map(c => ({
            channel: c.channel,
            sessions: c.customers * 3, // Approximate
            conversions: c.customers,
            revenue: c.cac * c.customers * 2, // Approximate
            conversionRate: Math.round((c.customers / (c.customers * 3)) * 100 * 100) / 100,
            avgOrderValue: c.cac * 2, // Approximate
            estimatedCAC: c.cac,
            ltvCacRatio: c.cac > 0 ? (c.cac * 3) / c.cac : 0,
          })),
          period: params.period,
          note: 'CAC values are estimated. For accurate CAC, integrate with your marketing platform to get actual spend data.',
        };
      }

    case 'analytics-optimization-roi':
      {
        const optimizations = generateMockOptimizationROI(params);
        const { start, end } = getMockDateRange(params.period, params.startDate, params.endDate);
        const midDate = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
        const beforeRange = { start, end: midDate };
        const afterRange = { start: midDate, end };
        const beforeRevenue = optimizations.reduce((sum, o) => sum + (o.revenue / (1 + o.impact)), 0);
        const afterRevenue = optimizations.reduce((sum, o) => sum + o.revenue, 0);
        const revenueChange = afterRevenue - beforeRevenue;
        const revenueChangePercent = beforeRevenue > 0 ? (revenueChange / beforeRevenue) * 100 : null;
        const beforeSessions = Math.round(beforeRevenue / 100);
        const afterSessions = Math.round(afterRevenue / 100);
        const beforeConversions = Math.round(beforeSessions * 0.08);
        const afterConversions = Math.round(afterSessions * 0.12);
        const beforeConversionRate = beforeSessions > 0 ? (beforeConversions / beforeSessions) * 100 : 0;
        const afterConversionRate = afterSessions > 0 ? (afterConversions / afterSessions) * 100 : 0;
        const conversionRateChange = afterConversionRate - beforeConversionRate;
        const conversionRateChangePercent = beforeConversionRate > 0 ? (conversionRateChange / beforeConversionRate) * 100 : null;
        const beforeAOV = beforeConversions > 0 ? beforeRevenue / beforeConversions : 0;
        const afterAOV = afterConversions > 0 ? afterRevenue / afterConversions : 0;
        const aovChange = afterAOV - beforeAOV;
        const aovChangePercent = beforeAOV > 0 ? (aovChange / beforeAOV) * 100 : null;
        const optimizationCost = optimizations.reduce((sum, o) => sum + o.investment, 0);
        const roi = optimizationCost > 0 ? ((revenueChange - optimizationCost) / optimizationCost) * 100 : (revenueChange > 0 ? Infinity : 0);
        return {
          summary: {
            beforePeriod: {
              start: beforeRange.start.toISOString(),
              end: beforeRange.end.toISOString(),
              sessions: beforeSessions,
              conversions: beforeConversions,
              conversionRate: Math.round(beforeConversionRate * 100) / 100,
              revenue: Math.round(beforeRevenue * 100) / 100,
              orders: beforeConversions,
              aov: Math.round(beforeAOV * 100) / 100,
            },
            afterPeriod: {
              start: afterRange.start.toISOString(),
              end: afterRange.end.toISOString(),
              sessions: afterSessions,
              conversions: afterConversions,
              conversionRate: Math.round(afterConversionRate * 100) / 100,
              revenue: Math.round(afterRevenue * 100) / 100,
              orders: afterConversions,
              aov: Math.round(afterAOV * 100) / 100,
            },
            changes: {
              revenueChange: Math.round(revenueChange * 100) / 100,
              revenueChangePercent: revenueChangePercent !== null ? Math.round(revenueChangePercent * 100) / 100 : null,
              conversionRateChange: Math.round(conversionRateChange * 100) / 100,
              conversionRateChangePercent: conversionRateChangePercent !== null ? Math.round(conversionRateChangePercent * 100) / 100 : null,
              aovChange: Math.round(aovChange * 100) / 100,
              aovChangePercent: aovChangePercent !== null ? Math.round(aovChangePercent * 100) / 100 : null,
              additionalOrders: afterConversions - beforeConversions,
              additionalRevenue: Math.round(revenueChange * 100) / 100,
            },
            roi: {
              optimizationCost,
              additionalRevenue: Math.round(revenueChange * 100) / 100,
              roi: typeof roi === 'number' ? Math.round(roi * 100) / 100 : roi,
              roiFormatted: optimizationCost > 0
                ? `${typeof roi === 'number' ? roi.toFixed(1) : '∞'}%`
                : revenueChange > 0
                ? '∞'
                : '0%',
            },
          },
          period: params.period,
          optimizationDate: midDate.toISOString(),
        };
      }

    case 'analytics-segments':
      {
        const segments = generateMockSegments(params);
        const totalCustomers = segments.reduce((sum, s) => sum + s.customers, 0);
        const totalRevenue = segments.reduce((sum, s) => sum + s.revenue, 0);
        const overallAvgLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
        const avgAOV = segments.length > 0
          ? segments.reduce((sum, s) => sum + s.avgOrderValue, 0) / segments.length
          : 0;
        const avgOrders = segments.length > 0
          ? segments.reduce((sum, s) => sum + (s.customers * 1.5), 0) / totalCustomers
          : 0;
        return {
          summary: {
            totalCustomers,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            overallAvgLTV: Math.round(overallAvgLTV * 100) / 100,
            avgAOV: Math.round(avgAOV * 100) / 100,
            avgOrders: Math.round(avgOrders * 100) / 100,
          },
          segments: segments.map(s => ({
            name: s.segment,
            description: `Customers in ${s.segment} segment`,
            metrics: {
              count: s.customers,
              totalRevenue: Math.round(s.revenue * 100) / 100,
              avgLTV: Math.round((s.revenue / s.customers) * 100) / 100,
              avgAOV: Math.round(s.avgOrderValue * 100) / 100,
              avgOrders: Math.round((s.customers * 1.5) / s.customers * 100) / 100,
              conversionRate: s.conversionRate,
            },
          })),
          period: params.period,
        };
      }

    case 'analytics-revenue-forecast':
      {
        const forecast = generateMockRevenueForecast(params);
        const totalHistoricalRevenue = forecast.forecast.reduce((sum, f) => sum + f.predicted, 0) * 3; // Approximate
        const avgDailyRevenue = forecast.forecast.length > 0 ? forecast.forecast[0].predicted : 0;
        const forecast7Revenue = forecast.forecast.slice(0, 7).reduce((sum, f) => sum + f.predicted, 0);
        const forecast30Revenue = forecast.nextMonth;
        const forecast90Revenue = forecast.nextMonth * 3;
        const historical = Array.from({ length: 30 }, (_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (30 - index));
          return {
            date: date.toISOString().split('T')[0],
            revenue: Math.round(avgDailyRevenue * generateRandomInRange(`${params.accountId}-historical-${index}`, 0.7, 1.3, 0) * 100) / 100,
          };
        });
        return {
          summary: {
            totalHistoricalRevenue: Math.round(totalHistoricalRevenue * 100) / 100,
            avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
            totalForecastRevenue: Math.round(forecast30Revenue * 100) / 100,
            avgForecastRevenue: Math.round(avgDailyRevenue * 100) / 100,
            forecast7Revenue: Math.round(forecast7Revenue * 100) / 100,
            forecast30Revenue: Math.round(forecast30Revenue * 100) / 100,
            forecast90Revenue: Math.round(forecast90Revenue * 100) / 100,
            trend: forecast.growthRate > 0.01 ? 'increasing' : forecast.growthRate < -0.01 ? 'decreasing' : 'stable',
            avgGrowth: Math.round(forecast.growthRate * 100 * 100) / 100,
          },
          historical,
          forecast: forecast.forecast.map(f => ({
            date: f.date,
            forecast: f.predicted,
            lowerBound: Math.round(f.predicted * 0.8 * 100) / 100,
            upperBound: Math.round(f.predicted * 1.2 * 100) / 100,
            confidence: f.confidence,
          })),
          accuracy: null,
          period: params.period,
          forecastDays: 30,
        };
      }

    case 'analytics-abandonment-prediction':
      {
        const predictions = generateMockAbandonmentPredictions(params);
        const totalSessions = predictions.length * 10; // Approximate
        const highRiskSessions = predictions.filter(p => p.probability > 0.7).length;
        const avgRiskScore = predictions.length > 0
          ? predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length * 100
          : 0;
        const typicalCheckoutDuration = 300; // 5 minutes
        const avgCheckoutTime = 240; // 4 minutes
        const riskDistribution = {
          low: predictions.filter(p => p.probability < 0.4).length,
          medium: predictions.filter(p => p.probability >= 0.4 && p.probability < 0.7).length,
          high: predictions.filter(p => p.probability >= 0.7 && p.probability < 0.85).length,
          critical: predictions.filter(p => p.probability >= 0.85).length,
        };
        const abandonmentByRisk: Record<string, { total: number; abandoned: number; rate: number }> = {
          low: { total: riskDistribution.low, abandoned: Math.round(riskDistribution.low * 0.1), rate: 10 },
          medium: { total: riskDistribution.medium, abandoned: Math.round(riskDistribution.medium * 0.3), rate: 30 },
          high: { total: riskDistribution.high, abandoned: Math.round(riskDistribution.high * 0.6), rate: 60 },
          critical: { total: riskDistribution.critical, abandoned: Math.round(riskDistribution.critical * 0.9), rate: 90 },
        };
        return {
          summary: {
            totalSessions,
            highRiskSessions,
            avgRiskScore: Math.round(avgRiskScore * 100) / 100,
            typicalCheckoutDuration,
            avgCheckoutTime,
            riskDistribution,
            abandonmentByRisk,
          },
          predictions: predictions.map(p => ({
            sessionId: p.sessionId,
            prediction: {
              riskScore: Math.round(p.probability * 100),
              riskLevel: p.probability >= 0.85 ? 'critical' : p.probability >= 0.7 ? 'high' : p.probability >= 0.4 ? 'medium' : 'low',
              confidence: Math.round((1 - p.probability * 0.2) * 100),
              factors: p.factors,
              recommendations: [p.recommendedIntervention],
              interventionSuggested: p.probability > 0.7,
              interventionType: p.probability > 0.7 ? 'discount' : null,
            },
            isActive: false,
            isAbandoned: p.probability > 0.7,
            isCompleted: p.probability < 0.3,
          })).sort((a, b) => b.prediction.riskScore - a.prediction.riskScore).slice(0, 100),
          period: params.period,
        };
      }

    case 'boltx-predictions':
      {
        // For boltx-predictions endpoint, return a single prediction object
        // (this endpoint is for a specific session, not a list)
        const predictions = generateMockBoltXPredictions(params);
        if (predictions.length > 0) {
          const pred = predictions[0];
          return {
            riskScore: Math.round(pred.abandonmentProbability * 100),
            riskLevel: pred.abandonmentProbability >= 0.85 ? 'critical' : pred.abandonmentProbability >= 0.7 ? 'high' : pred.abandonmentProbability >= 0.4 ? 'medium' : 'low',
            confidence: Math.round((1 - pred.abandonmentProbability * 0.2) * 100),
            factors: pred.factors.map(f => ({
              factor: f.factor,
              impact: f.impact,
            })),
            recommendations: [
              'Consider offering a discount',
              'Simplify checkout process',
              'Add trust indicators',
            ],
            interventionSuggested: pred.abandonmentProbability > 0.7,
            interventionType: pred.abandonmentProbability > 0.7 ? 'discount' : undefined,
          };
        }
        // Fallback if no predictions generated
        return {
          riskScore: 50,
          riskLevel: 'medium' as const,
          confidence: 75,
          factors: [],
          recommendations: [],
          interventionSuggested: false,
          interventionType: undefined,
        };
      }

    case 'boltx-interventions':
      {
        const interventions = generateMockBoltXInterventions(params);
        const effectivenessByType: Record<string, {
          total: number;
          applied: number;
          converted: number;
          abandoned: number;
          conversionRate: number;
        }> = {};
        
        interventions.forEach((intervention) => {
          const type = intervention.type;
          if (!effectivenessByType[type]) {
            effectivenessByType[type] = {
              total: 0,
              applied: 0,
              converted: 0,
              abandoned: 0,
              conversionRate: 0,
            };
          }
          effectivenessByType[type].total++;
          if (intervention.applied) {
            effectivenessByType[type].applied++;
          }
          if (intervention.success) {
            effectivenessByType[type].converted++;
          } else if (intervention.applied && !intervention.success) {
            effectivenessByType[type].abandoned++;
          }
        });
        
        Object.keys(effectivenessByType).forEach((type) => {
          const data = effectivenessByType[type];
          data.conversionRate = data.applied > 0
            ? (data.converted / data.applied) * 100
            : 0;
        });
        
        return {
          interventions: interventions.map(i => ({
            id: i.id,
            sessionId: i.sessionId,
            intervention_type: i.type,
            applied: i.applied,
            applied_at: i.applied ? i.timestamp : null,
            result: i.success ? 'converted' : (i.applied ? 'abandoned' : 'pending'),
            metadata: {},
            created_at: i.timestamp,
          })),
          effectivenessByType,
          period: params.period,
          total: interventions.length,
        };
      }

    case 'boltx-personalization-metrics':
      {
        const metrics = generateMockPersonalizationMetrics(params);
        return {
          totalProfiles: metrics.profiles,
          activeProfiles: Math.round(metrics.profiles * 0.75),
          personalizationRate: Math.round((metrics.personalizedSessions / 1000) * 100 * 100) / 100,
          personalizedConversionRate: metrics.conversionLift + 10, // Base + lift
          nonPersonalizedConversionRate: 10, // Base rate
          deviceDistribution: {
            mobile: 0.6,
            desktop: 0.35,
            tablet: 0.05,
          },
          conversionByDevice: {
            mobile: { total: 600, converted: 48, conversionRate: 8 },
            desktop: { total: 350, converted: 42, conversionRate: 12 },
            tablet: { total: 50, converted: 3, conversionRate: 6 },
          },
          period: params.period,
        };
      }

    case 'boltx-personalization-profiles':
      {
        const profiles = generateMockPersonalizationProfiles(params);
        const deviceDistribution: Record<string, number> = {};
        profiles.forEach((profile) => {
          // Approximate device distribution
          const device = profile.name.includes('Mobile') ? 'mobile' : 'desktop';
          deviceDistribution[device] = (deviceDistribution[device] || 0) + 1;
        });
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const activeProfiles = profiles.filter(() => Math.random() > 0.3).length;
        return {
          profiles: profiles.map(p => ({
            id: p.profileId,
            session_id: `sess-${p.profileId}`,
            device_type: p.name.includes('Mobile') ? 'mobile' : 'desktop',
            browser: 'Chrome',
            location: 'BR',
            behavior: {},
            preferences: {},
            inferred_intent: undefined,
            metadata: {},
            created_at: yesterday.toISOString(),
            updated_at: now.toISOString(),
          })),
          deviceDistribution,
          activeProfiles,
          totalProfiles: profiles.length,
          period: params.period,
        };
      }

    case 'boltx-optimization':
      return {
        optimizations: generateMockOptimizations(params),
      };

    case 'analytics-events':
      {
        const page = Math.max(1, parseInt(queryParams?.page || '1', 10));
        const limit = Math.min(100, Math.max(10, parseInt(queryParams?.limit || '50', 10)));
        const eventType = queryParams?.event_type || null;
        const category = queryParams?.category || null;
        const step = queryParams?.step || null;

        const eventsData = generateMockAnalyticsEvents(params);
        
        // Apply filters
        let filteredEvents = eventsData.events;
        if (eventType) {
          filteredEvents = filteredEvents.filter(e => e.event_type === eventType);
        }
        if (category) {
          filteredEvents = filteredEvents.filter(e => e.category === category);
        }
        if (step) {
          filteredEvents = filteredEvents.filter(e => e.step === step);
        }

        // Recalculate summary for filtered events
        const filteredEventsByCategory = {
          user_action: 0,
          api_call: 0,
          metric: 0,
          error: 0,
        };
        const filteredEventsByType: Record<string, number> = {};
        
        filteredEvents.forEach(event => {
          filteredEventsByCategory[event.category]++;
          filteredEventsByType[event.event_type] = (filteredEventsByType[event.event_type] || 0) + 1;
        });

        const topEventTypes = Object.entries(filteredEventsByType)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([type, count]) => ({ type, count }));

        // Paginate
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredEvents.length / limit);

        const { start, end } = getMockDateRange(params.period, params.startDate, params.endDate);

        return {
          summary: {
            totalEvents: filteredEvents.length,
            uniqueSessions: new Set(filteredEvents.map(e => e.session_id)).size,
            eventsByCategory: filteredEventsByCategory,
            topEventTypes,
            errorCount: filteredEventsByCategory.error,
          },
          events: paginatedEvents,
          pagination: {
            page,
            limit,
            totalEvents: filteredEvents.length,
            totalPages,
            hasMore: page < totalPages,
          },
          period: params.period,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
        };
      }

    default:
      console.warn(`⚠️ [DEBUG] Unknown mock data endpoint: ${endpoint}`);
      return {};
  }
}

/**
 * Get mock data from request (extracts params from NextRequest)
 */
export async function getMockDataFromRequest(
  endpoint: string,
  accountId: string,
  request: { url: string }
): Promise<any> {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const period = parsePeriod(searchParams.get('period') || 'month');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  
  const startDate = startDateParam ? new Date(startDateParam) : undefined;
  const endDate = endDateParam ? new Date(endDateParam) : undefined;

  // Extract query params for endpoints that need them
  const queryParams: Record<string, string | null> = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  return getMockDataForEndpoint(endpoint, accountId, period, startDate, endDate, queryParams);
}

