'use client';

import { useTranslations } from 'next-intl';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { HelpSection, type HelpSectionData } from '@/components/Dashboard/HelpSection/HelpSection';

export function PredictionsHelpSection() {
  const t = useTranslations('dashboard.boltx.predictions.help');

  const sections: HelpSectionData[] = [
    {
      id: 'riskScores',
      icon: ExclamationTriangleIcon,
      title: t('riskScores.title'),
      items: [
        {
          key: 'riskScore',
          title: t('riskScores.riskScore.title'),
          description: t('riskScores.riskScore.description'),
        },
        {
          key: 'riskLevels',
          title: t('riskScores.riskLevels.title'),
          description: t('riskScores.riskLevels.description'),
        },
        {
          key: 'prediction',
          title: t('riskScores.prediction.title'),
          description: t('riskScores.prediction.description'),
        },
      ],
    },
    {
      id: 'metrics',
      icon: ChartBarIcon,
      title: t('metrics.title'),
      items: [
        {
          key: 'totalSessions',
          title: t('metrics.totalSessions.title'),
          description: t('metrics.totalSessions.description'),
        },
        {
          key: 'highRisk',
          title: t('metrics.highRisk.title'),
          description: t('metrics.highRisk.description'),
        },
        {
          key: 'avgRisk',
          title: t('metrics.avgRisk.title'),
          description: t('metrics.avgRisk.description'),
        },
        {
          key: 'modelAccuracy',
          title: t('metrics.modelAccuracy.title'),
          description: t('metrics.modelAccuracy.description'),
        },
      ],
    },
    {
      id: 'model',
      icon: InformationCircleIcon,
      title: t('model.title'),
      items: [
        {
          key: 'howItWorks',
          title: t('model.howItWorks.title'),
          description: t('model.howItWorks.description'),
        },
        {
          key: 'features',
          title: t('model.features.title'),
          description: t('model.features.description'),
        },
        {
          key: 'accuracy',
          title: t('model.accuracy.title'),
          description: t('model.accuracy.description'),
        },
      ],
    },
    {
      id: 'charts',
      icon: PresentationChartLineIcon,
      title: t('charts.title'),
      items: [
        {
          key: 'distribution',
          title: t('charts.distribution.title'),
          description: t('charts.distribution.description'),
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
      defaultExpandedSections={['riskScores']}
    />
  );
}

