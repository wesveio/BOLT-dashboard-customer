'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { Card, CardBody, Avatar, Select, SelectItem } from '@heroui/react';
import { slideIn } from '@/utils/animations';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { UserIcon, BuildingOfficeIcon, PhoneIcon, BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { useMetricsData } from '@/hooks/useDashboardData';
import { formatDate, getUserDisplayName, formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, Period } from '@/utils/default-data';

export default function DashboardPage() {
  const tOverview = useTranslations('dashboard.overview');
  const { user, isLoading: isLoadingAuth } = useDashboardAuth();
  const [period, setPeriod] = useState<Period>('week');
  const { metrics, isLoading, error, refetch } = useMetricsData({ period });

  return (
    <PageWrapper>
      <PageHeader
        title={tOverview('title')}
        subtitle={tOverview('welcome')}
        action={
          <Select
            size="sm"
            selectedKeys={[period]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as Period;
              setPeriod(selected);
            }}
            className="w-40"
          >
            {periodOptions.map((option) => (
              <SelectItem key={option.value} textValue={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        }
      />

      {/* User Info Card */}
      {isLoadingAuth ? (
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mb-8">
          <CardBody className="p-6">
            <LoadingState fullScreen={false} />
          </CardBody>
        </Card>
      ) : user ? (
        <m.div variants={slideIn} initial="hidden" animate="visible">
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mb-8">
            <CardBody className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Avatar and Basic Info */}
                <div className="flex items-start gap-4">
                  <Avatar
                    size="lg"
                    name={getUserDisplayName(user)}
                    className="w-20 h-20 text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {getUserDisplayName(user)}
                    </h2>
                    <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                      {user.role || 'viewer'}
                    </div>
                  </div>
                </div>

                {/* Right: Additional Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <PhoneIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Telefone</p>
                        <p className="text-sm font-semibold text-gray-900">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.company && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Empresa</p>
                        <p className="text-sm font-semibold text-gray-900">{user.company}</p>
                      </div>
                    </div>
                  )}

                  {user.jobTitle && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cargo</p>
                        <p className="text-sm font-semibold text-gray-900">{user.jobTitle}</p>
                      </div>
                    </div>
                  )}

                  {user.lastLogin && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Último Acesso</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(user.lastLogin)}
                        </p>
                      </div>
                    </div>
                  )}

                  {user.createdAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Membro desde</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </m.div>
      ) : null}

      {/* Metrics Cards */}
      {error ? (
        <ErrorState message={tOverview('messages.failedToLoad')} onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title={tOverview('totalRevenue')}
            value={formatCurrency(metrics.totalRevenue)}
            subtitle={tOverview('subtitles.totalRevenue')}
            icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
            isLoading={isLoading}
          />
          <MetricCard
            title={tOverview('totalOrders')}
            value={formatNumber(metrics.totalOrders)}
            subtitle={tOverview('subtitles.totalOrders')}
            icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
            isLoading={isLoading}
          />
          <MetricCard
            title={tOverview('conversionRate')}
            value={formatPercentage(metrics.conversionRate)}
            subtitle={tOverview('subtitles.conversionRate')}
            icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
            isLoading={isLoading}
          />
          <MetricCard
            title={tOverview('totalSessions')}
            value={metrics.totalSessions.toLocaleString()}
            subtitle={tOverview('subtitles.totalSessions')}
            icon={<ChartBarIcon className="w-6 h-6 text-white" />}
            isLoading={isLoading}
          />
        </div>
      )}

      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{tOverview('quickStart')}</h2>
          <p className="text-gray-600">{tOverview('description')}</p>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}

