'use client';

import { memo, useMemo } from 'react';
import { Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { formatPercentage } from '@/utils/formatters';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  isLoading = false,
  className = '',
}: MetricCardProps) {
  // Convert value to string for display and tooltip
  const valueString = useMemo(() => {
    return typeof value === 'string' ? value : String(value);
  }, [value]);

  // Check if value is long enough to potentially overflow
  const isLongValue = useMemo(() => {
    return valueString.length > 12;
  }, [valueString]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`h-full ${className}`}
    >
      <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
        <CardBody className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between h-full gap-4">
            <div className="flex-1 flex flex-col min-w-0">
              <p className="text-sm text-foreground/70 mb-1 font-semibold truncate">{title}</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-default-200 rounded animate-pulse" />
              ) : (
                <p
                  className="text-xl sm:text-2xl font-bold text-foreground break-words overflow-hidden"
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    lineHeight: '1.2',
                  }}
                  title={isLongValue ? valueString : undefined}
                >
                  {valueString}
                </p>
              )}
              {subtitle && (
                <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <span
                    className={`text-xs font-semibold ${
                      trend.isPositive ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {trend.isPositive ? '↑' : '↓'} {formatPercentage(Math.abs(trend.value))}
                  </span>
                  <span className="text-xs text-foreground/60">vs previous period</span>
                </div>
              )}
            </div>
            {icon && (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                {icon}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
});

