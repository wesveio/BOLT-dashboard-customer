'use client';

import { Card, CardBody, Button } from '@heroui/react';
import { Plan, formatCurrency, formatPercentage, getPlanFeatures } from '@/utils/plans';
import Link from 'next/link';

interface PublicPricingCardProps {
  plan: Plan;
  isPopular?: boolean;
  onSelect?: () => void;
}

export function PublicPricingCard({ plan, isPopular = false, onSelect }: PublicPricingCardProps) {
  const isEnterprise = plan.code === 'enterprise';
  const features = getPlanFeatures(plan.features);

  return (
    <div className="h-full animate-fade-in-up">
      <div className="relative h-full">
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-lg whitespace-nowrap">
              Most Popular
            </span>
          </div>
        )}
        <Card
          className={`border transition-all duration-200 h-full flex flex-col ${
            isPopular
              ? 'border-blue-500 shadow-xl ring-2 ring-blue-200'
              : 'border-gray-100 hover:border-blue-200 hover:shadow-lg'
          }`}
        >

        <CardBody className="p-8 flex-1 flex flex-col">
          {/* Plan Header */}
          <div className="mb-8 text-center">
            <h3 className="text-2xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{plan.name}</h3>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-3xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                {isEnterprise ? 'Custom' : formatCurrency(plan.monthly_price, 'USD')}
              </span>
              {!isEnterprise && <span className="text-lg md:text-xl text-gray-600">/month</span>}
            </div>
            {!isEnterprise && (
              <p className="text-sm text-gray-600 mt-2">
                + {formatPercentage(plan.transaction_fee_percent)} transaction fee
              </p>
            )}
            {!isEnterprise && (
              <p className="text-xs text-gray-500 mt-1">All prices in USD</p>
            )}
            {isEnterprise && (
              <p className="text-sm text-gray-600 mt-2">Contact us for custom pricing</p>
            )}
          </div>

          {/* Features List */}
          <div className="flex-1 mb-8">
            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature.code} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <div className="mt-auto pt-6 border-t border-gray-100">
            {isEnterprise ? (
              <Button
                as={Link}
                href="/contact?sales=enterprise"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                Contact Sales
              </Button>
            ) : (
              <Button
                as={Link}
                href="/login"
                onClick={onSelect}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                Start Free Trial
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}

