'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { useApi } from '@/hooks/useApi';
import { Card, CardBody, Chip } from '@heroui/react';
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'recommendation';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
}

// Default insights fallback
const defaultInsights: Insight[] = [
    {
      id: '1',
      type: 'success',
      title: 'Conversion Rate Improved',
      description: 'Your checkout conversion rate increased by 12.5% compared to last month.',
      impact: 'high',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      type: 'warning',
      title: 'High Abandonment on Payment Step',
      description: '42% of users abandon checkout at the payment step. Consider optimizing payment options.',
      action: {
        label: 'View Payment Analytics',
        href: '/dashboard/analytics/payment',
      },
      impact: 'high',
      timestamp: '5 hours ago',
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Mobile Optimization Opportunity',
      description: 'Mobile conversion rate is 20% lower than desktop. Consider improving mobile checkout experience.',
      action: {
        label: 'View Device Analytics',
        href: '/dashboard/analytics/devices',
      },
      impact: 'medium',
      timestamp: '1 day ago',
    },
    {
      id: '4',
      type: 'info',
      title: 'Peak Hours Identified',
      description: 'Most checkouts occur between 6 PM and 9 PM. Consider scheduling promotions during these hours.',
      impact: 'low',
      timestamp: '2 days ago',
    },
    {
      id: '5',
      type: 'success',
      title: 'Average Order Value Increased',
      description: 'AOV increased by 8.2% this week. Great job on upselling!',
      impact: 'medium',
      timestamp: '3 days ago',
    },
  ];

const insightIcons = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  recommendation: LightBulbIcon,
};

const insightColors = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    icon: 'text-green-600',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
    icon: 'text-orange-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    icon: 'text-blue-600',
  },
  recommendation: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    icon: 'text-purple-600',
  },
};

const impactColors = {
  low: 'default',
  medium: 'primary',
  high: 'danger',
};

export default function InsightsPage() {
  const t = useTranslations('dashboard.insights');
  const { data, isLoading, error, refetch } = useApi<{ insights: Insight[] }>('/api/dashboard/insights', {
    cacheKey: 'insights',
    cacheTTL: 5,
  });
  const insights = data?.insights || defaultInsights;

  const filteredInsights = {
    high: insights.filter((i) => i.impact === 'high'),
    medium: insights.filter((i) => i.impact === 'medium'),
    low: insights.filter((i) => i.impact === 'low'),
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message={t('messages.generating')} fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message={t('messages.failedToLoad')} onRetry={refetch} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('labels.totalInsights')}</p>
                <p className="text-2xl font-bold text-gray-900">{insights.length}</p>
              </div>
              <LightBulbIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </CardBody>
        </Card>
        <Card className="border border-red-200 bg-red-50 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">{t('labels.highImpact')}</p>
                <p className="text-2xl font-bold text-red-900">{filteredInsights.high.length}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
          </CardBody>
        </Card>
        <Card className="border border-blue-200 bg-blue-50 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">{t('labels.mediumImpact')}</p>
                <p className="text-2xl font-bold text-blue-900">{filteredInsights.medium.length}</p>
              </div>
              <InformationCircleIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardBody>
        </Card>
        <Card className="border border-gray-200 bg-gray-50 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('labels.lowImpact')}</p>
                <p className="text-2xl font-bold text-gray-900">{filteredInsights.low.length}</p>
              </div>
              <InformationCircleIcon className="w-8 h-8 text-gray-600" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight) => {
          const Icon = insightIcons[insight.type];
          const colors = insightColors[insight.type];

          return (
            <div key={insight.id}>
              <Card
                className={`border-2 ${colors.border} ${colors.bg} hover:shadow-lg transition-all duration-200`}
              >
                <CardBody className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-lg font-bold ${colors.text}`}>{insight.title}</h3>
                        <Chip
                          color={impactColors[insight.impact] as any}
                          variant="flat"
                          size="sm"
                          className="ml-2"
                        >
                          {insight.impact.toUpperCase()}
                        </Chip>
                      </div>
                      <p className={`text-sm ${colors.text} mb-4`}>{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{insight.timestamp}</span>
                        {insight.action && (
                          <a
                            href={insight.action.href}
                            className={`text-sm font-semibold ${colors.text} hover:underline`}
                          >
                            {insight.action.label} →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Empty State (if no insights) */}
      {insights.length === 0 && (
        <Card className="border border-gray-100">
          <CardBody className="p-12 text-center">
            <LightBulbIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Insights Yet</h3>
            <p className="text-gray-600">
              Insights will appear here as we analyze your checkout data.
            </p>
          </CardBody>
        </Card>
      )}
    </PageWrapper>
  );
}

