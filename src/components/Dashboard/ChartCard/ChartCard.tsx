'use client';

import { memo } from 'react';
import { Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const ChartCard = memo(function ChartCard({
  title,
  subtitle,
  children,
  action,
  className = '',
}: ChartCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={className}
    >
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
          <div>{children}</div>
        </CardBody>
      </Card>
    </motion.div>
  );
});

