/**
 * AI Service Layer for BoltX
 * 
 * Main abstraction layer for AI services (OpenAI, local ML, etc.)
 */

import { OpenAIClient } from './openai-client';
import { AbandonmentPredictor } from './prediction-models';
import {
  AIServiceConfig,
  AIProvider,
  AIInsight,
  AbandonmentPrediction,
  PredictionFeatures,
  AIError,
  InsightCategory,
} from './types';

export class AIService {
  private config: AIServiceConfig;
  private openaiClient?: OpenAIClient;
  private abandonmentPredictor: AbandonmentPredictor;
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.abandonmentPredictor = new AbandonmentPredictor();

    // Initialize OpenAI client if configured
    if (config.provider === 'openai' && config.openai?.apiKey) {
      this.openaiClient = new OpenAIClient({
        apiKey: config.openai.apiKey,
        model: config.openai.model,
        maxTokens: config.openai.maxTokens,
        temperature: config.openai.temperature,
      });
    }
  }

  /**
   * Generate insights using AI
   */
  async generateInsights(
    analyticsData: Record<string, any>,
    category?: InsightCategory
  ): Promise<AIInsight[]> {
    const cacheKey = `insights:${category || 'all'}:${JSON.stringify(analyticsData)}`;
    
    // Check cache
    if (this.config.cache?.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    try {
      let insights: AIInsight[] = [];

      if (this.config.provider === 'openai' && this.openaiClient) {
        insights = await this.openaiClient.generateInsights(analyticsData, category);
      } else {
        // Fallback: generate basic insights without AI
        insights = this.generateFallbackInsights(analyticsData, category);
      }

      // Cache results
      if (this.config.cache?.enabled) {
        this.cache.set(cacheKey, {
          data: insights,
          expiresAt: Date.now() + (this.config.cache.ttl * 1000),
        });
      }

      return insights;
    } catch (error) {
      console.error('❌ [DEBUG] Error generating insights:', error);
      // Return fallback insights
      return this.generateFallbackInsights(analyticsData, category);
    }
  }

  /**
   * Predict abandonment risk
   */
  predictAbandonment(features: PredictionFeatures): AbandonmentPrediction {
    return this.abandonmentPredictor.predict(features);
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(
    context: string,
    data: Record<string, any>
  ): Promise<string[]> {
    const cacheKey = `recommendations:${context}:${JSON.stringify(data)}`;
    
    // Check cache
    if (this.config.cache?.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    try {
      let recommendations: string[] = [];

      if (this.config.provider === 'openai' && this.openaiClient) {
        recommendations = await this.openaiClient.generateRecommendations(context, data);
      } else {
        // Fallback recommendations
        recommendations = this.generateFallbackRecommendations(context, data);
      }

      // Cache results
      if (this.config.cache?.enabled) {
        this.cache.set(cacheKey, {
          data: recommendations,
          expiresAt: Date.now() + (this.config.cache.ttl * 1000),
        });
      }

      return recommendations;
    } catch (error) {
      console.error('❌ [DEBUG] Error generating recommendations:', error);
      return this.generateFallbackRecommendations(context, data);
    }
  }

  /**
   * Get AI service configuration
   */
  getConfig(): AIServiceConfig {
    return this.config;
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    if (this.config.provider === 'openai') {
      return !!this.openaiClient;
    }
    return true; // Local models always available
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate fallback insights when AI is unavailable
   */
  private generateFallbackInsights(
    analyticsData: Record<string, any>,
    category?: InsightCategory
  ): AIInsight[] {
    const insights: AIInsight[] = [];

    // Basic insights based on data patterns
    if (analyticsData.abandonmentRate > 0.5) {
      insights.push({
        id: `fallback-${Date.now()}`,
        category: category || 'conversion',
        title: 'High Abandonment Rate',
        description: `Abandonment rate is ${(analyticsData.abandonmentRate * 100).toFixed(1)}%. Consider optimizing checkout flow.`,
        impact: 'high',
        recommendations: [
          'Simplify checkout steps',
          'Add progress indicators',
          'Offer guest checkout',
        ],
        generatedAt: new Date(),
      });
    }

    if (analyticsData.avgCheckoutTime > 300) {
      insights.push({
        id: `fallback-${Date.now()}-2`,
        category: category || 'ux',
        title: 'Long Checkout Time',
        description: `Average checkout time is ${Math.round(analyticsData.avgCheckoutTime)}s. This may impact conversion.`,
        impact: 'medium',
        recommendations: [
          'Reduce form fields',
          'Enable auto-fill',
          'Add save progress feature',
        ],
        generatedAt: new Date(),
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: `fallback-${Date.now()}-3`,
        category: category || 'ux',
        title: 'Review Analytics Data',
        description: 'Review the analytics data manually to identify improvement opportunities.',
        impact: 'low',
        recommendations: ['Analyze conversion funnel', 'Check for drop-off points'],
        generatedAt: new Date(),
      });
    }

    return insights;
  }

  /**
   * Generate fallback recommendations
   */
  private generateFallbackRecommendations(
    context: string,
    data: Record<string, any>
  ): string[] {
    return [
      'Review the data and identify patterns',
      'Test different approaches',
      'Monitor metrics closely',
    ];
  }
}

/**
 * Create AI service instance from environment variables (legacy)
 * @deprecated Use createAIServiceWithConfig instead
 */
export function createAIService(): AIService | null {
  const enabled = process.env.BOLTX_ENABLED === 'true';
  const openaiKey = process.env.OPENAI_API_KEY;
  const provider = (process.env.BOLTX_AI_PROVIDER || 'openai') as AIProvider;

  if (!enabled) {
    console.info('ℹ️ [DEBUG] BoltX is disabled');
    return null;
  }

  const config: AIServiceConfig = {
    provider,
    openai: openaiKey
      ? {
          apiKey: openaiKey,
          model: process.env.BOLTX_OPENAI_MODEL || 'gpt-4-turbo-preview',
          maxTokens: parseInt(process.env.BOLTX_OPENAI_MAX_TOKENS || '2000', 10),
          temperature: parseFloat(process.env.BOLTX_OPENAI_TEMPERATURE || '0.7'),
        }
      : undefined,
    cache: {
      enabled: process.env.BOLTX_CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.BOLTX_CACHE_TTL || '3600', 10), // 1 hour default
    },
    rateLimit: {
      requestsPerMinute: parseInt(process.env.BOLTX_RATE_LIMIT || '60', 10),
    },
  };

  if (provider === 'openai' && !openaiKey) {
    console.warn('⚠️ [DEBUG] OpenAI API key not found, AI features will be limited');
  }

  return new AIService(config);
}

/**
 * Create AI service instance from configuration
 * This is the preferred method as it supports database configuration
 */
export function createAIServiceWithConfig(config: AIServiceConfig): AIService | null {
  if (!config) {
    return null;
  }

  return new AIService(config);
}

