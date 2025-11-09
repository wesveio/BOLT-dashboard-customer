'use client';

import { useTranslations } from 'next-intl';
import {
  BoltIcon,
  ChartBarIcon,
  InformationCircleIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { HelpSection, type HelpSectionData } from '@/components/Dashboard/HelpSection/HelpSection';

export function InterventionsHelpSection() {
  const t = useTranslations('dashboard.boltx.interventions.help');

  const sections: HelpSectionData[] = [
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
    <HelpSection
      title={t('title')}
      subtitle={t('subtitle')}
      sections={sections}
      defaultExpandedSections={['types']}
    />
  );
}

