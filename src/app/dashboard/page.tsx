'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { Card, CardBody } from '@heroui/react';
import { fadeIn } from '@/utils/animations';

export default function DashboardPage() {
  const tSidebar = useTranslations('dashboard.sidebar');
  const tOverview = useTranslations('dashboard.overview');

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{tOverview('title')}</h1>
        <p className="text-gray-600">{tOverview('welcome')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Placeholder metric cards */}
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200"
          >
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Metric {i}</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
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
    </m.div>
  );
}

