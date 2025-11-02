'use client';

import { ReactNode, memo } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Unified page header component with title and subtitle
 * Supports optional action buttons for consistent styling
 */
export const PageHeader = memo(function PageHeader({ title, subtitle, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
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

