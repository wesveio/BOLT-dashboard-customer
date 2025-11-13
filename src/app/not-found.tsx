'use client';

import { motion as m } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { fadeIn, scaleIn } from '@/utils/animations';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <m.div
        className="max-w-2xl w-full text-center"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Icon Container with Gradient */}
        <m.div
          className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg"
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <svg
            className="w-12 h-12 md:w-16 md:h-16 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </m.div>

        {/* 404 Number */}
        <m.h1
          className="text-8xl md:text-9xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          404
        </m.h1>

        {/* Title */}
        <m.h2
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {t('title')}
        </m.h2>

        {/* Subtitle */}
        <m.p
          className="text-lg md:text-xl text-gray-600 mb-8 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {t('subtitle')}
        </m.p>

        {/* Action Buttons */}
        <m.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            as={Link}
            href="/dashboard"
            color="primary"
            size="lg"
            className="font-bold text-base py-7 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {t('goToDashboard')}
          </Button>
          <Button
            as={Link}
            href="/"
            variant="light"
            color="default"
            size="lg"
            className="font-semibold text-base py-7 px-8 hover:bg-gray-100 transition-colors"
          >
            {t('returnToHome')}
          </Button>
        </m.div>

        {/* Decorative line */}
        <m.div
          className="mt-12 w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-transparent via-gray-300 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        />
      </m.div>
    </div>
  );
}

