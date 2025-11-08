/**
 * OpenAI Client for BoltX
 * 
 * Handles communication with OpenAI API for generative insights
 */

import { AIError, AIInsight, InsightCategory, InsightImpact } from './types';

export interface OpenAIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class OpenAIClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private maxTokens: number = 2000;
  private temperature: number = 0.7;

  constructor(config: {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4-turbo-preview';
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Generate insights from analytics data
   */
  async generateInsights(
    analyticsData: Record<string, any>,
    category?: InsightCategory
  ): Promise<AIInsight[]> {
    try {
      const prompt = this.buildInsightsPrompt(analyticsData, category);
      const response = await this.callAPI(prompt);
      
      return this.parseInsightsResponse(response.content, category);
    } catch (error) {
      console.error('❌ [DEBUG] OpenAI API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate recommendations based on data
   */
  async generateRecommendations(
    context: string,
    data: Record<string, any>
  ): Promise<string[]> {
    try {
      const prompt = this.buildRecommendationsPrompt(context, data);
      const response = await this.callAPI(prompt);
      
      return this.parseRecommendationsResponse(response.content);
    } catch (error) {
      console.error('❌ [DEBUG] OpenAI API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callAPI(prompt: string): Promise<OpenAIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce analytics AI assistant. Provide clear, actionable insights and recommendations based on data analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return {
      content,
      usage: data.usage,
    };
  }

  /**
   * Build prompt for insights generation
   */
  private buildInsightsPrompt(
    analyticsData: Record<string, any>,
    category?: InsightCategory
  ): string {
    const categoryFilter = category ? `Focus on ${category} insights.` : '';
    
    return `Analyze the following e-commerce checkout analytics data and generate actionable insights.

${categoryFilter}

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}

Please provide insights in the following JSON format:
[
  {
    "category": "revenue|conversion|ux|security",
    "title": "Brief insight title",
    "description": "Detailed description of the insight",
    "impact": "high|medium|low",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  }
]

Focus on:
- Actionable recommendations
- Data-driven insights
- Clear impact assessment
- Specific, measurable improvements

Return only valid JSON array, no additional text.`;
  }

  /**
   * Build prompt for recommendations
   */
  private buildRecommendationsPrompt(
    context: string,
    data: Record<string, any>
  ): string {
    return `Based on the following context and data, provide actionable recommendations.

Context: ${context}

Data:
${JSON.stringify(data, null, 2)}

Provide 3-5 specific, actionable recommendations. Return as a JSON array of strings:
["Recommendation 1", "Recommendation 2", ...]

Return only valid JSON array, no additional text.`;
  }

  /**
   * Parse insights response from OpenAI
   */
  private parseInsightsResponse(
    content: string,
    category?: InsightCategory
  ): AIInsight[] {
    try {
      // Try to extract JSON from response (might have markdown code blocks)
      let jsonContent = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
      }

      const insights = JSON.parse(jsonContent) as any[];

      // Helper function to normalize category
      const normalizeCategory = (cat: string): InsightCategory => {
        const normalized = cat?.toLowerCase().trim();
        // Map invalid categories to valid ones
        if (normalized === 'abandonment') return 'conversion';
        if (['revenue', 'conversion', 'ux', 'security'].includes(normalized)) {
          return normalized as InsightCategory;
        }
        return 'ux'; // Default fallback
      };

      return insights.map((insight, index) => ({
        id: `insight-${Date.now()}-${index}`,
        category: normalizeCategory(category || insight.category || 'ux'),
        title: insight.title || 'Insight',
        description: insight.description || '',
        impact: (insight.impact || 'medium') as InsightImpact,
        recommendations: Array.isArray(insight.recommendations)
          ? insight.recommendations
          : [],
        generatedAt: new Date(),
        metadata: insight.metadata || {},
      }));
    } catch (error) {
      console.error('❌ [DEBUG] Failed to parse insights response:', error);
      // Return fallback insight
      return [
        {
          id: `insight-error-${Date.now()}`,
          category: (category || 'ux') as InsightCategory,
          title: 'Analysis Available',
          description: 'Analytics data has been analyzed. Review the data manually for insights.',
          impact: 'medium' as InsightImpact,
          recommendations: ['Review analytics data manually', 'Check for patterns in the data'],
          generatedAt: new Date(),
        },
      ];
    }
  }

  /**
   * Parse recommendations response
   */
  private parseRecommendationsResponse(content: string): string[] {
    try {
      let jsonContent = content.trim();
      
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
      }

      const recommendations = JSON.parse(jsonContent);
      
      if (Array.isArray(recommendations)) {
        return recommendations.filter((rec) => typeof rec === 'string');
      }
      
      return [];
    } catch (error) {
      console.error('❌ [DEBUG] Failed to parse recommendations:', error);
      return ['Review the data and identify improvement opportunities'];
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): AIError {
    const isRetryable =
      error instanceof TypeError ||
      (error.message && error.message.includes('fetch')) ||
      (typeof error === 'object' && error.status >= 500);

    return {
      code: error.code || 'OPENAI_ERROR',
      message: error.message || 'Unknown OpenAI error',
      provider: 'openai',
      retryable: isRetryable,
      metadata: {
        status: error.status,
        response: error.response,
      },
    };
  }
}

