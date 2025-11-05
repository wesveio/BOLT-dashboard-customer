/**
 * Prediction Models for BoltX
 * 
 * ML models for abandonment, conversion, and friction prediction
 */

import { AbandonmentPrediction, RiskLevel } from './types';

export interface PredictionFeatures {
  timeExceeded: number;
  errorCount: number;
  currentStep: string;
  stepDuration: number;
  totalDuration: number;
  hasReturned: boolean;
  stepProgress: number;
  deviceType?: string;
  location?: string;
  historicalAbandonments?: number;
  avgCheckoutTime?: number;
  historicalConversionRate?: number;
}

/**
 * Enhanced abandonment prediction model
 * Uses ML-based approach with feature weighting
 */
export class AbandonmentPredictor {
  private modelVersion: string = 'v1';

  /**
   * Predict abandonment risk
   */
  predict(features: PredictionFeatures): AbandonmentPrediction {
    let riskScore = 0;
    const weights = this.getFeatureWeights();

    // Time-based risk (weighted)
    const timeRisk = this.calculateTimeRisk(
      features.timeExceeded,
      features.totalDuration,
      features.avgCheckoutTime
    );
    riskScore += timeRisk * weights.time;

    // Error-based risk (weighted)
    const errorRisk = this.calculateErrorRisk(features.errorCount);
    riskScore += errorRisk * weights.errors;

    // Step-based risk (weighted)
    const stepRisk = this.calculateStepRisk(
      features.currentStep,
      features.stepDuration,
      features.stepProgress
    );
    riskScore += stepRisk * weights.step;

    // Behavioral risk (weighted)
    const behavioralRisk = this.calculateBehavioralRisk(
      features.hasReturned,
      features.historicalAbandonments,
      features.historicalConversionRate
    );
    riskScore += behavioralRisk * weights.behavior;

    // Device/Location risk (weighted)
    const contextRisk = this.calculateContextRisk(
      features.deviceType,
      features.location
    );
    riskScore += contextRisk * weights.context;

    // Clamp score to 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(features);

    // Determine risk level
    const riskLevel = this.getRiskLevel(riskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskLevel, features);

    // Determine if intervention is needed
    const interventionSuggested = riskScore >= 50;
    const interventionType = this.getInterventionType(riskLevel, features);

    return {
      riskScore: Math.round(riskScore),
      riskLevel,
      confidence,
      factors: {
        timeExceeded: features.timeExceeded,
        errorCount: features.errorCount,
        currentStep: features.currentStep,
        stepDuration: features.stepDuration,
        totalDuration: features.totalDuration,
        hasReturned: features.hasReturned,
        stepProgress: features.stepProgress,
        deviceType: features.deviceType,
        location: features.location,
        historicalData: {
          previousAbandonments: features.historicalAbandonments || 0,
          avgCheckoutTime: features.avgCheckoutTime || 0,
          conversionRate: features.historicalConversionRate || 0,
        },
      },
      recommendations,
      interventionSuggested,
      interventionType,
    };
  }

  /**
   * Get feature weights for model
   * These can be tuned based on historical data
   */
  private getFeatureWeights() {
    return {
      time: 0.30, // 30% weight
      errors: 0.25, // 25% weight
      step: 0.20, // 20% weight
      behavior: 0.15, // 15% weight
      context: 0.10, // 10% weight
    };
  }

  /**
   * Calculate time-based risk (0-40 points)
   */
  private calculateTimeRisk(
    timeExceeded: number,
    totalDuration: number,
    avgCheckoutTime?: number
  ): number {
    let risk = 0;

    // If time exceeds typical checkout duration
    if (timeExceeded > 1.5) {
      risk = 40; // Very high risk
    } else if (timeExceeded > 1.0) {
      risk = 30; // High risk
    } else if (timeExceeded > 0.5) {
      risk = 20; // Medium risk
    } else if (timeExceeded > 0.2) {
      risk = 10; // Low risk
    }

    // Adjust based on absolute time (e.g., stuck for > 5 minutes)
    if (totalDuration > 300) {
      risk = Math.max(risk, 35); // At least high risk
    } else if (totalDuration > 180) {
      risk = Math.max(risk, 25);
    }

    return risk;
  }

  /**
   * Calculate error-based risk (0-30 points)
   */
  private calculateErrorRisk(errorCount: number): number {
    if (errorCount >= 3) {
      return 30; // Critical
    } else if (errorCount === 2) {
      return 20; // High
    } else if (errorCount === 1) {
      return 10; // Medium
    }
    return 0;
  }

  /**
   * Calculate step-based risk (0-25 points)
   */
  private calculateStepRisk(
    currentStep: string,
    stepDuration: number,
    stepProgress: number
  ): number {
    const stepRiskMap: Record<string, number> = {
      cart: 5,
      profile: 10,
      shipping: 15,
      payment: 20,
    };

    let risk = stepRiskMap[currentStep] || 10;

    // Increase risk if stuck on step for too long
    if (stepDuration > 300) {
      risk += 10; // Very stuck
    } else if (stepDuration > 180) {
      risk += 5; // Stuck
    }

    // Increase risk if low progress
    if (stepProgress < 0.25) {
      risk += 5;
    }

    return Math.min(25, risk);
  }

  /**
   * Calculate behavioral risk (0-20 points)
   */
  private calculateBehavioralRisk(
    hasReturned: boolean,
    historicalAbandonments?: number,
    historicalConversionRate?: number
  ): number {
    let risk = 0;

    // Reduce risk if user returned (shows intent)
    if (hasReturned) {
      risk -= 15;
    }

    // Increase risk based on historical abandonments
    if (historicalAbandonments && historicalAbandonments > 2) {
      risk += 15; // High risk user
    } else if (historicalAbandonments && historicalAbandonments > 0) {
      risk += 10; // Medium risk user
    }

    // Adjust based on historical conversion rate
    if (historicalConversionRate !== undefined) {
      if (historicalConversionRate < 0.2) {
        risk += 10; // Low converter
      } else if (historicalConversionRate < 0.5) {
        risk += 5; // Medium converter
      }
    }

    return Math.max(0, Math.min(20, risk));
  }

  /**
   * Calculate context-based risk (0-10 points)
   */
  private calculateContextRisk(
    deviceType?: string,
    location?: string
  ): number {
    let risk = 0;

    // Mobile users tend to have higher abandonment
    if (deviceType === 'mobile') {
      risk += 5;
    }

    // Location-based risk (can be expanded with actual data)
    // For now, minimal impact

    return Math.min(10, risk);
  }

  /**
   * Calculate prediction confidence (0-1)
   */
  private calculateConfidence(features: PredictionFeatures): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence with more data
    if (features.historicalAbandonments !== undefined) {
      confidence += 0.2;
    }
    if (features.avgCheckoutTime !== undefined) {
      confidence += 0.1;
    }
    if (features.historicalConversionRate !== undefined) {
      confidence += 0.1;
    }
    if (features.deviceType) {
      confidence += 0.05;
    }
    if (features.location) {
      confidence += 0.05;
    }

    return Math.min(1, confidence);
  }

  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): RiskLevel {
    if (score >= 70) {
      return 'critical';
    } else if (score >= 50) {
      return 'high';
    } else if (score >= 30) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate recommendations based on risk
   */
  private generateRecommendations(
    riskLevel: RiskLevel,
    features: PredictionFeatures
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Consider offering a discount or incentive');
      recommendations.push('Send recovery email if user abandons');
      recommendations.push('Simplify checkout process');
    }

    if (features.errorCount > 0) {
      recommendations.push('Improve error handling and user feedback');
      recommendations.push('Simplify form validation');
    }

    if (features.timeExceeded > 1.0) {
      recommendations.push('Optimize checkout flow to reduce time');
      recommendations.push('Consider auto-fill options for faster checkout');
    }

    if (features.currentStep === 'payment') {
      recommendations.push('Offer multiple payment options');
      recommendations.push('Show security badges and trust indicators');
    }

    if (features.stepDuration > 180) {
      recommendations.push('Add progress indicators to show completion');
      recommendations.push('Provide clear next steps guidance');
    }

    return recommendations;
  }

  /**
   * Get intervention type based on risk
   */
  private getInterventionType(
    riskLevel: RiskLevel,
    features: PredictionFeatures
  ): 'discount' | 'security' | 'simplify' | 'progress' | undefined {
    if (!this.shouldIntervene(riskLevel)) {
      return undefined;
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      return 'discount';
    }

    if (features.currentStep === 'payment') {
      return 'security';
    }

    if (features.errorCount > 0 || features.stepDuration > 180) {
      return 'simplify';
    }

    return 'progress';
  }

  /**
   * Determine if intervention is needed
   */
  private shouldIntervene(riskLevel: RiskLevel): boolean {
    return riskLevel === 'critical' || riskLevel === 'high' || riskLevel === 'medium';
  }
}

