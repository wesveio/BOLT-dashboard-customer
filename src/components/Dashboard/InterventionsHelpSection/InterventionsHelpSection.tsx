'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardBody } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import {
  QuestionMarkCircleIcon,
  BoltIcon,
  ChartBarIcon,
  InformationCircleIcon,
  PresentationChartLineIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export function InterventionsHelpSection() {
  const t = useTranslations('dashboard.boltx.interventions.help');
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['types']) // Expand first section by default
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const sections = [
    {
      id: 'types',
      icon: BoltIcon,
      title: t('types.title'),
      items: [
        {
          key: 'discount',
          title: t('types.discount.title'),
          description: t('types.discount.description'),
          example: t('types.discount.example'),
        },
        {
          key: 'security',
          title: t('types.security.title'),
          description: t('types.security.description'),
          example: t('types.security.example'),
        },
        {
          key: 'simplify',
          title: t('types.simplify.title'),
          description: t('types.simplify.description'),
          example: t('types.simplify.example'),
        },
        {
          key: 'progress',
          title: t('types.progress.title'),
          description: t('types.progress.description'),
          example: t('types.progress.example'),
        },
      ],
    },
    {
      id: 'metrics',
      icon: ChartBarIcon,
      title: t('metrics.title'),
      items: [
        {
          key: 'total',
          title: t('metrics.total.title'),
          description: t('metrics.total.description'),
        },
        {
          key: 'conversion',
          title: t('metrics.conversion.title'),
          description: t('metrics.conversion.description'),
        },
        {
          key: 'active',
          title: t('metrics.active.title'),
          description: t('metrics.active.description'),
        },
        {
          key: 'roi',
          title: t('metrics.roi.title'),
          description: t('metrics.roi.description'),
        },
      ],
    },
    {
      id: 'concepts',
      icon: InformationCircleIcon,
      title: t('concepts.title'),
      items: [
        {
          key: 'threshold',
          title: t('concepts.threshold.title'),
          description: t('concepts.threshold.description'),
        },
        {
          key: 'riskLevels',
          title: t('concepts.riskLevels.title'),
          description: t('concepts.riskLevels.description'),
        },
        {
          key: 'status',
          title: t('concepts.status.title'),
          description: t('concepts.status.description'),
        },
        {
          key: 'result',
          title: t('concepts.result.title'),
          description: t('concepts.result.description'),
        },
      ],
    },
    {
      id: 'charts',
      icon: PresentationChartLineIcon,
      title: t('charts.title'),
      items: [
        {
          key: 'effectiveness',
          title: t('charts.effectiveness.title'),
          description: t('charts.effectiveness.description'),
        },
        {
          key: 'detailed',
          title: t('charts.detailed.title'),
          description: t('charts.detailed.description'),
        },
        {
          key: 'table',
          title: t('charts.table.title'),
          description: t('charts.table.description'),
        },
      ],
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="mb-8"
    >
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <button
            onClick={() => setIsCardExpanded(!isCardExpanded)}
            className="w-full flex items-center justify-between gap-3 mb-0 text-left hover:opacity-80 transition-opacity duration-200"
            aria-expanded={isCardExpanded}
            aria-controls="help-content"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <QuestionMarkCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('title')}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            {isCardExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {isCardExpanded && (
              <motion.div
                id="help-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-6 space-y-3">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSections.has(section.id);

                    return (
                      <div
                        key={section.id}
                        className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-blue-300"
                      >
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
                          aria-expanded={isExpanded}
                          aria-controls={`section-${section.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900">
                              {section.title}
                            </h4>
                          </div>
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              id={`section-${section.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-0 space-y-4 bg-gray-50">
                                {section.items.map((item) => (
                                  <div
                                    key={item.key}
                                    className="p-4 bg-white rounded-lg border border-gray-100"
                                  >
                                    <h5 className="font-semibold text-gray-900 mb-2">
                                      {item.title}
                                    </h5>
                                    <p className="text-sm text-gray-700 mb-2">
                                      {item.description}
                                    </p>
                                    {item.example && (
                                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs font-medium text-blue-900 mb-1">
                                          Example:
                                        </p>
                                        <p className="text-xs text-blue-800">
                                          {item.example}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>
    </motion.div>
  );
}

