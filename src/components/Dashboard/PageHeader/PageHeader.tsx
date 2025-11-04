'use client';

import { ReactNode, memo } from 'react';
import { DashboardBreadcrumbs } from '../Breadcrumbs/DashboardBreadcrumbs';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  showBreadcrumb?: boolean;
}

/**
 * Unified page header component with title and subtitle
 * Supports optional action buttons for consistent styling
 * Includes breadcrumbs for subpages when applicable
 */
export const PageHeader = memo(function PageHeader({ 
  title, 
  subtitle, 
  action, 
  className = '',
  showBreadcrumb = true,
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      {showBreadcrumb && <DashboardBreadcrumbs />}
      <div className={action ? 'flex items-center justify-between' : ''}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
});

