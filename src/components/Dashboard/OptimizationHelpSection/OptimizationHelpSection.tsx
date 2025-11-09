'use client';

import { useTranslations } from 'next-intl';
import {
  PaintBrushIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { HelpSection, type HelpSectionData } from '@/components/Dashboard/HelpSection/HelpSection';

export function OptimizationHelpSection() {
  const t = useTranslations('dashboard.boltx.optimization.help');

  const sections: HelpSectionData[] = [
    {
      id: 'fieldOptimization',
      icon: PaintBrushIcon,
      title: t('fieldOptimization.title'),
      items: [
        {
          key: 'whatIs',
          title: t('fieldOptimization.whatIs.title'),
          description: t('fieldOptimization.whatIs.description'),
        },
        {
          key: 'howWorks',
          title: t('fieldOptimization.howWorks.title'),
          description: t('fieldOptimization.howWorks.description'),
        },
        {
          key: 'benefits',
          title: t('fieldOptimization.benefits.title'),
          description: t('fieldOptimization.benefits.description'),
        },
      ],
    },
    {
      id: 'stepMetrics',
      icon: DocumentTextIcon,
      title: t('stepMetrics.title'),
      items: [
        {
          key: 'steps',
          title: t('stepMetrics.steps.title'),
          description: t('stepMetrics.steps.description'),
        },
        {
          key: 'completion',
          title: t('stepMetrics.completion.title'),
          description: t('stepMetrics.completion.description'),
        },
        {
          key: 'errorRate',
          title: t('stepMetrics.errorRate.title'),
          description: t('stepMetrics.errorRate.description'),
        },
        {
          key: 'timeToComplete',
          title: t('stepMetrics.timeToComplete.title'),
          description: t('stepMetrics.timeToComplete.description'),
        },
      ],
    },
    {
      id: 'effectiveness',
      icon: ChartBarIcon,
      title: t('effectiveness.title'),
      items: [
        {
          key: 'conversion',
          title: t('effectiveness.conversion.title'),
          description: t('effectiveness.conversion.description'),
        },
        {
          key: 'comparison',
          title: t('effectiveness.comparison.title'),
          description: t('effectiveness.comparison.description'),
        },
        {
          key: 'improvement',
          title: t('effectiveness.improvement.title'),
          description: t('effectiveness.improvement.description'),
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
          key: 'fieldPerformance',
          title: t('charts.fieldPerformance.title'),
          description: t('charts.fieldPerformance.description'),
        },
        {
          key: 'trend',
          title: t('charts.trend.title'),
          description: t('charts.trend.description'),
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
    <HelpSection
      title={t('title')}
      subtitle={t('subtitle')}
      sections={sections}
      defaultExpandedSections={['fieldOptimization']}
    />
  );
}

