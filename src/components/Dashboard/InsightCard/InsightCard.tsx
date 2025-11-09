'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardBody, Button } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import {
  getInsightIcon,
  getInsightStyles,
  getInsightCardClassName,
  getInsightIconClassName,
  type InsightType,
} from '@/utils/insights';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  impact?: 'low' | 'medium' | 'high';
  timestamp?: string;
}

export interface InsightCardProps {
  /**
   * Insight data
   */
  insight: Insight;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Reusable insight card component
 * Uses insight utilities for consistent styling
 */
export const InsightCard = memo(function InsightCard({
  insight,
  className = '',
}: InsightCardProps) {
  const Icon = getInsightIcon(insight.type);
  const styles = getInsightStyles(insight.type);
  const cardClassName = getInsightCardClassName(insight.type);
  const iconClassName = getInsightIconClassName(insight.type);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={className}
    >
      <Card className={`${cardClassName} ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <div className={iconClassName}>
              <Icon className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-bold ${styles.text} mb-1 line-clamp-1`}>
                {insight.title}
              </h3>
              <p className={`text-xs ${styles.text} mb-2 line-clamp-2`}>
                {insight.description}
              </p>
              {insight.action && (
                <Link href={insight.action.href}>
                  <Button
                    size="sm"
                    variant="light"
                    className={`text-xs ${styles.text} p-0 h-auto`}
                  >
                    {insight.action.label} →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
});

