'use client';

import { motion } from 'framer-motion';
import { Card, CardBody, Button } from '@heroui/react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Plan, formatCurrency, formatPercentage, getPlanFeatures } from '@/utils/plans';

interface PricingCardProps {
  plan: Plan;
  currentPlanId?: string | null;
  isCurrentPlan?: boolean;
  onSelect?: (plan: Plan) => void;
  isLoading?: boolean;
  showFeatures?: boolean;
}

export function PricingCard({
  plan,
  currentPlanId,
  isCurrentPlan = false,
  onSelect,
  isLoading = false,
  showFeatures = true,
}: PricingCardProps) {
  const isEnterprise = plan.code === 'enterprise';
  const features = getPlanFeatures(plan.features);

  const handleSelect = () => {
    if (onSelect && !isCurrentPlan) {
      onSelect(plan);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`h-full ${isCurrentPlan ? 'order-first md:order-none' : ''}`}
    >
      <Card
        className={`border transition-all duration-200 h-full flex flex-col ${
          isCurrentPlan
            ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
            : 'border-gray-100 hover:border-blue-200 hover:shadow-lg'
        }`}
      >
        <CardBody className="p-6 flex-1 flex flex-col">
          {/* Plan Header */}
          <div className="mb-6">
            {isCurrentPlan && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
                <CheckIcon className="w-4 h-4" />
                Current Plan
              </div>
            )}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900">
                {isEnterprise ? 'Custom' : formatCurrency(plan.monthly_price, 'USD')}
              </span>
              {!isEnterprise && <span className="text-gray-600">/month</span>}
            </div>
            {!isEnterprise && (
              <p className="text-sm text-gray-600">
                + {formatPercentage(plan.transaction_fee_percent)} transaction fee
              </p>
            )}
          </div>

          {/* Features List */}
          {showFeatures && (
            <div className="flex-1 mb-6">
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature.code} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mt-0.5">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-auto pt-6 border-t border-gray-100">
            {isCurrentPlan ? (
              <Button
                disabled
                className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
              >
                Current Plan
              </Button>
            ) : (
              <Button
                onClick={handleSelect}
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all duration-200"
              >
                {isEnterprise ? 'Contact Sales' : 'Select Plan'}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

