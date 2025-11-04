/**
 * Abandonment Prediction Utility
 * 
 * Calculates risk scores for checkout abandonment based on:
 * - Time spent in checkout
 * - Number of errors encountered
 * - Current step in funnel
 * - Historical patterns
 */

export interface AbandonmentRiskFactors {
  timeExceeded: number; // Percentage of typical checkout time exceeded
  errorCount: number;
  currentStep: string;
  stepDuration: number; // Time spent on current step (seconds)
  totalDuration: number; // Total checkout duration (seconds)
  hasReturned: boolean; // User returned to checkout
  stepProgress: number; // Progress through steps (0-1)
}

export interface AbandonmentPrediction {
  riskScore: number; // 0-100 (higher = more risk)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: AbandonmentRiskFactors;
  recommendations: string[];
}

/**
 * Calculate abandonment risk score
 * 
 * @param factors - Risk factors for the checkout session
 * @returns Abandonment prediction with score and recommendations
 */
export function predictAbandonment(factors: AbandonmentRiskFactors): AbandonmentPrediction {
  let riskScore = 0;

  // Time-based risk (0-40 points)
  // If time exceeds typical checkout duration, add risk
  if (factors.timeExceeded > 1.5) {
    riskScore += 40; // Very high risk if >150% of typical time
  } else if (factors.timeExceeded > 1.0) {
    riskScore += 25; // High risk if >100% of typical time
  } else if (factors.timeExceeded > 0.5) {
    riskScore += 15; // Medium risk if >50% of typical time
  }

  // Error-based risk (0-30 points)
  if (factors.errorCount >= 3) {
    riskScore += 30; // Critical if 3+ errors
  } else if (factors.errorCount === 2) {
    riskScore += 20; // High if 2 errors
  } else if (factors.errorCount === 1) {
    riskScore += 10; // Medium if 1 error
  }

  // Step-based risk (0-20 points)
  // Earlier steps have lower risk, payment step has highest risk
  const stepRiskMap: Record<string, number> = {
    cart: 5,
    profile: 10,
    shipping: 15,
    payment: 20,
  };
  riskScore += stepRiskMap[factors.currentStep] || 10;

  // Step duration risk (0-10 points)
  // If stuck on a step for too long, add risk
  if (factors.stepDuration > 300) { // 5 minutes
    riskScore += 10;
  } else if (factors.stepDuration > 180) { // 3 minutes
    riskScore += 5;
  }

  // Progress risk (0-10 points)
  // Lower progress = higher risk
  if (factors.stepProgress < 0.25) {
    riskScore += 10;
  } else if (factors.stepProgress < 0.5) {
    riskScore += 5;
  }

  // Reduce risk if user returned (shows intent)
  if (factors.hasReturned) {
    riskScore = Math.max(0, riskScore - 15);
  }

  // Clamp score to 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore >= 70) {
    riskLevel = 'critical';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, factors);

  return {
    riskScore,
    riskLevel,
    factors,
    recommendations,
  };
}

/**
 * Generate recommendations based on risk level and factors
 */
function generateRecommendations(
  riskLevel: string,
  factors: AbandonmentRiskFactors
): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Consider offering a discount or incentive');
    recommendations.push('Send recovery email if user abandons');
  }

  if (factors.errorCount > 0) {
    recommendations.push('Improve error handling and user feedback');
    recommendations.push('Simplify checkout process');
  }

  if (factors.timeExceeded > 1.0) {
    recommendations.push('Optimize checkout flow to reduce time');
    recommendations.push('Consider auto-fill options for faster checkout');
  }

  if (factors.currentStep === 'payment') {
    recommendations.push('Offer multiple payment options');
    recommendations.push('Show security badges and trust indicators');
  }

  if (factors.stepDuration > 180) {
    recommendations.push('Add progress indicators to show completion');
    recommendations.push('Provide clear next steps guidance');
  }

  return recommendations;
}

/**
 * Calculate typical checkout duration based on historical data
 * 
 * @param avgCheckoutTime - Average checkout time from historical data (seconds)
 * @returns Typical checkout duration threshold
 */
export function getTypicalCheckoutDuration(avgCheckoutTime: number): number {
  // Typical checkout is considered 1.2x average for safety margin
  return avgCheckoutTime * 1.2;
}

