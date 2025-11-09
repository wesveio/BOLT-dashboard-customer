'use client';

import { useTranslations } from 'next-intl';
import {
  LightBulbIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { HelpSection, type HelpSectionData } from '@/components/Dashboard/HelpSection/HelpSection';

export function PersonalizationHelpSection() {
  const t = useTranslations('dashboard.boltx.personalization.help');

  const sections: HelpSectionData[] = [
    {
      id: 'profiles',
      icon: LightBulbIcon,
      title: t('profiles.title'),
      items: [
        {
          key: 'whatAre',
          title: t('profiles.whatAre.title'),
          description: t('profiles.whatAre.description'),
        },
        {
          key: 'howCreated',
          title: t('profiles.howCreated.title'),
          description: t('profiles.howCreated.description'),
        },
        {
          key: 'benefits',
          title: t('profiles.benefits.title'),
          description: t('profiles.benefits.description'),
        },
      ],
    },
    {
      id: 'deviceTypes',
      icon: DevicePhoneMobileIcon,
      title: t('deviceTypes.title'),
      items: [
        {
          key: 'detection',
          title: t('deviceTypes.detection.title'),
          description: t('deviceTypes.detection.description'),
        },
        {
          key: 'types',
          title: t('deviceTypes.types.title'),
          description: t('deviceTypes.types.description'),
        },
        {
          key: 'personalization',
          title: t('deviceTypes.personalization.title'),
          description: t('deviceTypes.personalization.description'),
        },
      ],
    },
    {
      id: 'metrics',
      icon: ChartBarIcon,
      title: t('metrics.title'),
      items: [
        {
          key: 'conversion',
          title: t('metrics.conversion.title'),
          description: t('metrics.conversion.description'),
        },
        {
          key: 'profiles',
          title: t('metrics.profiles.title'),
          description: t('metrics.profiles.description'),
        },
        {
          key: 'improvement',
          title: t('metrics.improvement.title'),
          description: t('metrics.improvement.description'),
        },
      ],
    },
    {
      id: 'configuration',
      icon: Cog6ToothIcon,
      title: t('configuration.title'),
      items: [
        {
          key: 'rules',
          title: t('configuration.rules.title'),
          description: t('configuration.rules.description'),
        },
        {
          key: 'settings',
          title: t('configuration.settings.title'),
          description: t('configuration.settings.description'),
        },
      ],
    },
    {
      id: 'charts',
      icon: PresentationChartLineIcon,
      title: t('charts.title'),
      items: [
        {
          key: 'deviceDistribution',
          title: t('charts.deviceDistribution.title'),
          description: t('charts.deviceDistribution.description'),
        },
        {
          key: 'conversion',
          title: t('charts.conversion.title'),
          description: t('charts.conversion.description'),
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
      defaultExpandedSections={['profiles']}
    />
  );
}

