/**
 * Form Optimizer for BoltX
 * 
 * Analyzes and optimizes form fields based on user behavior and performance
 */

import { UserProfile, FormOptimization } from './types';

export interface FieldAnalysis {
  fieldName: string;
  visibility: boolean;
  order: number;
  required: boolean;
  validationRules?: any;
  completionRate?: number;
  errorRate?: number;
  avgTimeToComplete?: number;
}

export class FormOptimizer {
  /**
   * Generate form optimization based on user profile and analytics
   */
  generateOptimization(
    profile: UserProfile,
    step: string,
    fieldAnalytics?: FieldAnalysis[]
  ): FormOptimization {
    const optimization: FormOptimization = {
      fieldVisibility: {},
      fieldOrder: {},
      validationRules: {},
    };

    // Step-specific optimizations
    if (step === 'profile') {
      this.optimizeProfileFields(optimization, profile, fieldAnalytics);
    } else if (step === 'shipping') {
      this.optimizeShippingFields(optimization, profile, fieldAnalytics);
    } else if (step === 'payment') {
      this.optimizePaymentFields(optimization, profile, fieldAnalytics);
    }

    return optimization;
  }

  /**
   * Optimize profile fields
   */
  private optimizeProfileFields(
    optimization: FormOptimization,
    profile: UserProfile,
    fieldAnalytics?: FieldAnalysis[]
  ): void {
    // Mobile users: show email first (easier to type)
    if (profile.deviceType === 'mobile') {
      optimization.fieldOrder.profile = ['email', 'phone', 'firstName', 'lastName', 'document'];
    } else {
      // Desktop: show name first
      optimization.fieldOrder.profile = ['firstName', 'lastName', 'email', 'phone', 'document'];
    }

    // Hide corporate fields if not needed (based on behavior)
    if (profile.behavior.previousPurchases === 0) {
      // First-time users: hide corporate fields by default
      optimization.fieldVisibility['corporateName'] = false;
      optimization.fieldVisibility['tradeName'] = false;
      optimization.fieldVisibility['corporateDocument'] = false;
      optimization.fieldVisibility['stateInscription'] = false;
      optimization.fieldVisibility['corporatePhone'] = false;
    }

    // High urgency: simplify form (hide optional fields)
    if (profile.inferredIntent?.urgency === 'high') {
      optimization.fieldVisibility['corporateName'] = false;
      optimization.fieldVisibility['tradeName'] = false;
      optimization.fieldVisibility['corporateDocument'] = false;
      optimization.fieldVisibility['stateInscription'] = false;
      optimization.fieldVisibility['corporatePhone'] = false;
    }

    // Apply analytics-based optimizations
    if (fieldAnalytics) {
      this.applyAnalyticsOptimizations(optimization, fieldAnalytics, 'profile');
    }
  }

  /**
   * Optimize shipping fields
   */
  private optimizeShippingFields(
    optimization: FormOptimization,
    profile: UserProfile,
    fieldAnalytics?: FieldAnalysis[]
  ): void {
    // Mobile: show postal code first (most important)
    if (profile.deviceType === 'mobile') {
      optimization.fieldOrder.shipping = [
        'postalCode',
        'country',
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
      ];
    } else {
      optimization.fieldOrder.shipping = [
        'country',
        'postalCode',
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
      ];
    }

    // High urgency: hide optional fields
    if (profile.inferredIntent?.urgency === 'high') {
      optimization.fieldVisibility['complement'] = false;
    }

    // Apply analytics-based optimizations
    if (fieldAnalytics) {
      this.applyAnalyticsOptimizations(optimization, fieldAnalytics, 'shipping');
    }
  }

  /**
   * Optimize payment fields
   */
  private optimizePaymentFields(
    optimization: FormOptimization,
    profile: UserProfile,
    fieldAnalytics?: FieldAnalysis[]
  ): void {
    // Mobile: show card number first (most important)
    if (profile.deviceType === 'mobile') {
      optimization.fieldOrder.payment = [
        'cardNumber',
        'cardHolderName',
        'expirationDate',
        'cvv',
        'billingAddress',
      ];
    } else {
      optimization.fieldOrder.payment = [
        'cardHolderName',
        'cardNumber',
        'expirationDate',
        'cvv',
        'billingAddress',
      ];
    }

    // If user has saved cards, prioritize saved account selection
    if (profile.behavior.previousPurchases && profile.behavior.previousPurchases > 0) {
      optimization.fieldOrder.payment = [
        'savedAccount',
        'cardNumber',
        'cardHolderName',
        'expirationDate',
        'cvv',
      ];
    }

    // Apply analytics-based optimizations
    if (fieldAnalytics) {
      this.applyAnalyticsOptimizations(optimization, fieldAnalytics, 'payment');
    }
  }

  /**
   * Apply analytics-based optimizations
   */
  private applyAnalyticsOptimizations(
    optimization: FormOptimization,
    fieldAnalytics: FieldAnalysis[],
    step: string
  ): void {
    // Reorder fields based on completion rate (higher first)
    const sortedFields = [...fieldAnalytics]
      .filter((field) => field.completionRate !== undefined)
      .sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))
      .map((field) => field.fieldName);

    if (sortedFields.length > 0) {
      optimization.fieldOrder[step] = sortedFields;
    }

    // Hide fields with very low completion rate (< 10%)
    fieldAnalytics.forEach((field) => {
      if (field.completionRate !== undefined && field.completionRate < 0.1) {
        optimization.fieldVisibility[field.fieldName] = false;
      }
    });

    // Adjust validation rules based on error rate
    fieldAnalytics.forEach((field) => {
      if (field.errorRate !== undefined && field.errorRate > 0.3) {
        // High error rate: add more lenient validation or better error messages
        optimization.validationRules[field.fieldName] = {
          ...field.validationRules,
          lenient: true,
          showHelpText: true,
        };
      }
    });
  }

  /**
   * Calculate field completion rate from analytics
   */
  calculateCompletionRate(filledCount: number, totalAttempts: number): number {
    if (totalAttempts === 0) return 0;
    return filledCount / totalAttempts;
  }

  /**
   * Calculate field error rate from analytics
   */
  calculateErrorRate(errorCount: number, totalAttempts: number): number {
    if (totalAttempts === 0) return 0;
    return errorCount / totalAttempts;
  }

  /**
   * Get optimal field order for step
   */
  getOptimalFieldOrder(
    step: string,
    profile: UserProfile,
    defaultOrder: string[]
  ): string[] {
    const optimization = this.generateOptimization(profile, step);
    return optimization.fieldOrder[step] || defaultOrder;
  }

  /**
   * Get field visibility for step
   */
  getFieldVisibility(
    step: string,
    profile: UserProfile,
    defaultVisibility: Record<string, boolean> = {}
  ): Record<string, boolean> {
    const optimization = this.generateOptimization(profile, step);
    return {
      ...defaultVisibility,
      ...optimization.fieldVisibility,
    };
  }
}

/**
 * Create form optimizer instance
 */
export function createFormOptimizer(): FormOptimizer {
  return new FormOptimizer();
}

