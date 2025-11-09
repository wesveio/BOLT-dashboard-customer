'use client';

import { Card, CardBody, Chip } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { formatPercentage } from '@/utils/formatters';
import { formatRelativeTime } from '@/utils/formatters';
import type { ModelMetrics } from '@/lib/ai/models/abandonment-predictor';

interface ModelMetricsCardProps {
  metrics: ModelMetrics | null;
  isLoading?: boolean;
}

export function ModelMetricsCard({ metrics, isLoading = false }: ModelMetricsCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    );
  }

  if (!metrics || metrics.trainingSize === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Model Performance</h3>
              <Chip color="default" size="sm" variant="flat">
                Not Trained
              </Chip>
            </div>
            <p className="text-sm text-gray-600">
              Model metrics will be available after training with historical data.
            </p>
          </CardBody>
        </Card>
      </motion.div>
    );
  }

  const isTrained = metrics.trainingSize > 0;
  const lastTrainedText = metrics.lastTrained
    ? formatRelativeTime(metrics.lastTrained.toISOString())
    : 'Never';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Model Performance</h3>
            <Chip
              color={isTrained ? 'success' : 'default'}
              size="sm"
              variant="flat"
            >
              {isTrained ? 'Trained' : 'Not Trained'}
            </Chip>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(metrics.accuracy * 100)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Precision</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(metrics.precision * 100)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Recall</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(metrics.recall * 100)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">F1 Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(metrics.f1Score * 100)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Training Size</span>
              <span className="font-semibold text-gray-900">{metrics.trainingSize.toLocaleString()} sessions</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Last Trained</span>
              <span className="text-gray-900">{lastTrainedText}</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

