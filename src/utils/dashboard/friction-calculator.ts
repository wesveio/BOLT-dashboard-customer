/**
 * Friction Score Calculator
 * 
 * Calculates checkout friction based on:
 * - Time spent in checkout
 * - Number of errors encountered
 * - Number of back navigations
 * - Number of fields filled
 * - Total steps completed
 */

export interface FrictionFactors {
  totalDuration: number; // Total checkout duration (seconds)
  errorCount: number;
  backNavigations: number; // Number of times user went back
  fieldsFilled: number;
  totalFields: number;
  stepsCompleted: number;
  totalSteps: number;
  hasReturned: boolean; // User returned to checkout after abandoning
}

export interface FrictionScore {
  score: number; // 0-100 (0 = no friction, 100 = max friction)
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: FrictionFactors;
  breakdown: {
    timeScore: number;
    errorScore: number;
    navigationScore: number;
    completionScore: number;
  };
}

/**
 * Calculate friction score
 * 
 * @param factors - Friction factors for the checkout session
 * @returns Friction score with breakdown
 */
export function calculateFrictionScore(factors: FrictionFactors): FrictionScore {
  // Normalize time (0-40 points)
  // Assume typical checkout takes 3 minutes (180 seconds)
  // If > 5 minutes, max friction
  const maxTime = 300; // 5 minutes
  const normalizedTime = Math.min(factors.totalDuration / maxTime, 1);
  const timeScore = normalizedTime * 40;

  // Error score (0-30 points)
  // Each error adds friction
  const errorScore = Math.min(factors.errorCount * 10, 30);

  // Navigation score (0-20 points)
  // Going back indicates confusion/friction
  const navigationScore = Math.min(factors.backNavigations * 5, 20);

  // Completion score (0-10 points, inverted - less completion = more friction)
  const fieldsCompletion = factors.totalFields > 0
    ? factors.fieldsFilled / factors.totalFields
    : 1;
  const stepsCompletion = factors.totalSteps > 0
    ? factors.stepsCompleted / factors.totalSteps
    : 1;
  const avgCompletion = (fieldsCompletion + stepsCompletion) / 2;
  const completionScore = (1 - avgCompletion) * 10;

  // Calculate total friction score
  let totalScore = timeScore + errorScore + navigationScore + completionScore;

  // Reduce score if user returned (shows intent despite friction)
  if (factors.hasReturned) {
    totalScore = Math.max(0, totalScore - 10);
  }

  // Clamp score to 0-100
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine friction level
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (totalScore >= 70) {
    level = 'critical';
  } else if (totalScore >= 50) {
    level = 'high';
  } else if (totalScore >= 30) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    score: totalScore,
    level,
    factors,
    breakdown: {
      timeScore,
      errorScore,
      navigationScore,
      completionScore,
    },
  };
}

/**
 * Calculate average friction score from multiple sessions
 */
export function calculateAverageFriction(scores: FrictionScore[]): {
  avgScore: number;
  avgBreakdown: FrictionScore['breakdown'];
  distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
} {
  if (scores.length === 0) {
    return {
      avgScore: 0,
      avgBreakdown: {
        timeScore: 0,
        errorScore: 0,
        navigationScore: 0,
        completionScore: 0,
      },
      distribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };
  }

  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const avgBreakdown = {
    timeScore: scores.reduce((sum, s) => sum + s.breakdown.timeScore, 0) / scores.length,
    errorScore: scores.reduce((sum, s) => sum + s.breakdown.errorScore, 0) / scores.length,
    navigationScore: scores.reduce((sum, s) => sum + s.breakdown.navigationScore, 0) / scores.length,
    completionScore: scores.reduce((sum, s) => sum + s.breakdown.completionScore, 0) / scores.length,
  };

  const distribution = {
    low: scores.filter(s => s.level === 'low').length,
    medium: scores.filter(s => s.level === 'medium').length,
    high: scores.filter(s => s.level === 'high').length,
    critical: scores.filter(s => s.level === 'critical').length,
  };

  return {
    avgScore,
    avgBreakdown,
    distribution,
  };
}

