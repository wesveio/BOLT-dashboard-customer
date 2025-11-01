'use client';

import { useTranslations } from 'next-intl';
import { Card, CardBody } from '@heroui/react';

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  percentage: number;
}

interface FunnelChartProps {
  data: FunnelStep[];
  isLoading?: boolean;
}

export function FunnelChart({ data, isLoading = false }: FunnelChartProps) {
  const t = useTranslations('common');

  if (isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
      <CardBody className="p-6">
        <div className="space-y-4">
          {data.map((step, index) => {
            const widthPercentage = (step.count / maxCount) * 100;

            return (
              <div key={step.step} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-gray-900">{step.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{step.count.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{step.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${widthPercentage}%` }}
                  >
                    {widthPercentage > 15 && (
                      <span className="text-white text-xs font-semibold">
                        {step.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {index < data.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

