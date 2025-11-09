'use client';

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

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  isLoading = false,
  className = '',
}: MetricCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`h-full ${className}`}
    >
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
        <CardBody className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between h-full">
            <div className="flex-1 flex flex-col">
              <p className="text-sm text-gray-600 mb-1 font-semibold">{title}</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={`text-xs font-semibold ${
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trend.isPositive ? '↑' : '↓'} {formatPercentage(Math.abs(trend.value))}
                  </span>
                  <span className="text-xs text-gray-500">vs previous period</span>
                </div>
              )}
            </div>
            {icon && (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0 ml-4">
                {icon}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

