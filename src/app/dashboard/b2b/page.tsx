'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { Card, CardBody } from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import {
  BuildingOfficeIcon,
  DocumentCheckIcon,
  CreditCardIcon,
  UserGroupIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';

export default function B2BOverviewPage() {
  const t = useTranslations('dashboard.b2b.overview');
  const [metrics, setMetrics] = useState({
    totalWorkflows: 0,
    activeBuyers: 0,
    creditLimitsConfigured: 0,
    totalPurchaseOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const { data: workflowsData } = useApi<{ workflows: unknown[] }>('/api/dashboard/b2b/workflows');
  const { data: buyersData } = useApi<{ buyers: unknown[] }>('/api/dashboard/b2b/buyers');
  const { data: limitsData } = useApi<{ limits: unknown[] }>('/api/dashboard/b2b/credit-limits');
  const { data: ordersData } = useApi<{ orders: unknown[] }>('/api/dashboard/b2b/purchase-orders');

  useEffect(() => {
    if (workflowsData && buyersData && limitsData && ordersData) {
      setMetrics({
        totalWorkflows: workflowsData.workflows?.length || 0,
        activeBuyers: buyersData.buyers?.length || 0,
        creditLimitsConfigured: limitsData.limits?.length || 0,
        totalPurchaseOrders: ordersData.orders?.length || 0,
      });
      setIsLoading(false);
    }
  }, [workflowsData, buyersData, limitsData, ordersData]);

  const quickLinks = [
    {
      title: t('quickLinks.workflows'),
      description: t('quickLinks.workflowsDesc'),
      href: '/dashboard/b2b/workflows',
      icon: DocumentCheckIcon,
      count: metrics.totalWorkflows,
    },
    {
      title: t('quickLinks.creditLimits'),
      description: t('quickLinks.creditLimitsDesc'),
      href: '/dashboard/b2b/credit-limits',
      icon: CreditCardIcon,
      count: metrics.creditLimitsConfigured,
    },
    {
      title: t('quickLinks.buyers'),
      description: t('quickLinks.buyersDesc'),
      href: '/dashboard/b2b/buyers',
      icon: UserGroupIcon,
      count: metrics.activeBuyers,
    },
    {
      title: t('quickLinks.purchaseOrders'),
      description: t('quickLinks.purchaseOrdersDesc'),
      href: '/dashboard/b2b/purchase-orders',
      icon: ShoppingBagIcon,
      count: metrics.totalPurchaseOrders,
    },
  ];

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={BuildingOfficeIcon}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('metrics.workflows')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalWorkflows}</p>
              </div>
              <DocumentCheckIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('metrics.buyers')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeBuyers}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-purple-600" />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('metrics.creditLimits')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.creditLimitsConfigured}
                </p>
              </div>
              <CreditCardIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('metrics.purchaseOrders')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalPurchaseOrders}</p>
              </div>
              <ShoppingBagIcon className="w-8 h-8 text-orange-600" />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardBody className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{link.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                      <p className="text-xs text-gray-500">
                        {link.count} {link.count === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageWrapper>
  );
}

