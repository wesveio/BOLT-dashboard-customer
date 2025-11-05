/**
 * BoltX AI Types
 * 
 * Type definitions for AI service layer and prediction models
 */

export type AIProvider = 'openai' | 'local' | 'custom';

export type InsightCategory = 'revenue' | 'conversion' | 'ux' | 'security';

export type InsightImpact = 'high' | 'medium' | 'low';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AIInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  impact: InsightImpact;
  recommendations: string[];
  generatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AbandonmentPrediction {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  factors: {
    timeExceeded: number;
    errorCount: number;
    currentStep: string;
    stepDuration: number;
    totalDuration: number;
    hasReturned: boolean;
    stepProgress: number;
    deviceType?: string;
    location?: string;
    historicalData?: {
      previousAbandonments: number;
      avgCheckoutTime: number;
      conversionRate: number;
    };
  };
  recommendations: string[];
  interventionSuggested?: boolean;
  interventionType?: 'discount' | 'security' | 'simplify' | 'progress';
}

export interface UserProfile {
  sessionId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  location?: {
    country: string;
    region?: string;
    city?: string;
  };
  behavior: {
    timeOnSite: number;
    pagesVisited: number;
    checkoutAttempts: number;
    previousPurchases?: number;
    avgOrderValue?: number;
  };
  preferences?: {
    preferredPaymentMethod?: string;
    preferredShippingMethod?: string;
    preferredLanguage?: string;
  };
  inferredIntent?: {
    urgency: 'low' | 'medium' | 'high';
    priceSensitivity: 'low' | 'medium' | 'high';
    devicePreference: 'mobile' | 'desktop';
  };
}

export interface PersonalizationConfig {
  fieldOrder: string[];
  highlightedOptions: {
    paymentMethods?: string[];
    shippingOptions?: string[];
  };
  messages: Record<string, string>;
  layoutVariant?: 'mobile-first' | 'desktop-first';
  showRecommendations: boolean;
}

export interface FormOptimization {
  fieldVisibility: Record<string, boolean>;
  fieldOrder: Record<string, string[]>;
  validationRules: Record<string, any>;
  grouping: Record<string, string[]>;
}

export interface OptimizationResult {
  id: string;
  type: 'form' | 'layout' | 'content' | 'flow';
  appliedAt: Date;
  config: Record<string, any>;
  metrics: {
    conversionRate: number;
    avgTime: number;
    errorRate: number;
    beforeConversionRate?: number;
    improvement?: number;
  };
}

export interface AIError {
  code: string;
  message: string;
  provider?: AIProvider;
  retryable: boolean;
  metadata?: Record<string, any>;
}

export interface AIServiceConfig {
  provider: AIProvider;
  openai?: {
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
  };
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
  };
  rateLimit?: {
    requestsPerMinute: number;
  };
}

