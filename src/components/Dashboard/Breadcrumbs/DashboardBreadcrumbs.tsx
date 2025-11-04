'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Breadcrumbs, BreadcrumbItem } from '@heroui/react';
import { generateBreadcrumbs, shouldShowBreadcrumbs } from '@/utils/breadcrumbs';

/**
 * Dashboard breadcrumbs component using HeroUI Breadcrumbs
 * Displays navigation hierarchy for subpages
 */
export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations();

  // Don't render if we shouldn't show breadcrumbs
  if (!shouldShowBreadcrumbs(pathname || '')) {
    return null;
  }

  const breadcrumbItems = generateBreadcrumbs(pathname || '');

  // If we only have one item (Dashboard), don't show breadcrumbs
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Breadcrumbs
      size="md"
      color="primary"
      variant="light"
      separator="/"
      className="mb-4"
    >
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const translatedLabel = t(item.translationKey);

        // Last item should not be a link and should be marked as current
        return (
          <BreadcrumbItem
            key={item.href}
            href={isLast ? undefined : item.href}
            isCurrent={isLast}
          >
            {translatedLabel}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumbs>
  );
}

