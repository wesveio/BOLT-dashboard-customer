'use client';

import { ReactNode, memo } from 'react';
import { DashboardBreadcrumbs } from '../Breadcrumbs/DashboardBreadcrumbs';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string; // Alias for subtitle for consistency
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
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
  description,
  action, 
  icon: Icon,
  className = '',
  showBreadcrumb = true,
}: PageHeaderProps) {
  const displaySubtitle = subtitle || description;
  
  return (
    <div className={`pt-8 mb-8 ${className}`}>
      {showBreadcrumb && <DashboardBreadcrumbs />}
      <div className={action ? 'flex items-center justify-between' : ''}>
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8 text-foreground/70" />}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            {displaySubtitle && <p className="text-foreground/70">{displaySubtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
});

