'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { Card, CardBody, Avatar } from '@heroui/react';
import { slideIn } from '@/utils/animations';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { UserIcon, BuildingOfficeIcon, PhoneIcon, BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { formatDate, getUserDisplayName } from '@/utils/formatters';

export default function DashboardPage() {
  const tSidebar = useTranslations('dashboard.sidebar');
  const tOverview = useTranslations('dashboard.overview');
  const { user, isLoading } = useDashboardAuth();

  return (
    <PageWrapper>
      <PageHeader title={tOverview('title')} subtitle={tOverview('welcome')} />

      {/* User Info Card */}
      {isLoading ? (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Placeholder metric cards */}
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 h-full flex flex-col"
          >
            <CardBody className="p-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between h-full">
                <div className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-600 mb-1">Metric {i}</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 ml-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{tOverview('quickStart')}</h2>
          <p className="text-gray-600">{tOverview('description')}</p>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}

