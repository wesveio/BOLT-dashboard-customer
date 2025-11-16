/**
 * Insights utilities
 * Provides consistent styling and icon mappings for insights across the dashboard
 */

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

export type InsightType = 'success' | 'warning' | 'info' | 'recommendation';
export type InsightImpact = 'low' | 'medium' | 'high';

/**
 * Icon mapping for insight types
 */
export const insightIcons = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  recommendation: LightBulbIcon,
} as const;

/**
 * Color scheme mapping for insight types
 * Uses HeroUI semantic colors with opacity for dark mode compatibility
 */
export const insightColors = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
    icon: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    icon: 'text-warning',
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    icon: 'text-primary',
  },
  recommendation: {
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    text: 'text-secondary',
    icon: 'text-secondary',
  },
} as const;

/**
 * Chip color mapping for insight impact levels
 */
export const impactColors: Record<InsightImpact, 'default' | 'primary' | 'danger'> = {
  low: 'default',
  medium: 'primary',
  high: 'danger',
};

/**
 * Get icon component for insight type
 */
export function getInsightIcon(type: InsightType) {
  return insightIcons[type];
}

/**
 * Get color styles for insight type
 */
export function getInsightStyles(type: InsightType) {
  return insightColors[type];
}

/**
 * Get chip color for insight impact
 */
export function getImpactColor(impact: InsightImpact): 'default' | 'primary' | 'danger' {
  return impactColors[impact];
}

/**
 * Get combined styles for insight card
 * Returns className string for card styling
 */
export function getInsightCardClassName(type: InsightType): string {
  const styles = getInsightStyles(type);
  return `border-2 ${styles.bg} ${styles.border} ${styles.text} hover:shadow-lg transition-all duration-200`;
}

/**
 * Get icon container className for insight
 */
export function getInsightIconClassName(type: InsightType): string {
  const styles = getInsightStyles(type);
  return `w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center flex-shrink-0`;
}

