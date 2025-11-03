'use client';

import { useApi } from '@/hooks/useApi';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Theme {
  id: string;
  name: string;
  isActive: boolean;
  baseTheme?: 'default' | 'single-page' | 'liquid-glass';
  base_theme?: 'default' | 'single-page' | 'liquid-glass';
}

interface ThemesResponse {
  themes: Theme[];
}

/**
 * Badge component that displays the currently active theme
 * Shows a visual indicator in the dashboard header
 */
export function ActiveThemeBadge() {
  const { data, isLoading } = useApi<ThemesResponse>('/api/dashboard/themes', {
    cacheKey: 'themes',
    cacheTTL: 5,
  });

  const themes = data?.themes || [];
  const activeTheme = themes.find((t) => t.isActive);

  // Default theme names mapping
  const defaultThemeNames: Record<string, string> = {
    'default': 'Default',
    'single-page': 'Single Page',
    'liquid-glass': 'Liquid Glass',
  };

  // Get theme display name
  const getThemeDisplayName = () => {
    if (!activeTheme) {
      return 'Default';
    }

    // Support both camelCase and snake_case from API
    const baseTheme = activeTheme.baseTheme || activeTheme.base_theme;

    // If it's a custom theme with baseTheme, show custom name
    if (baseTheme && activeTheme.name && !activeTheme.name.includes('Default')) {
      return activeTheme.name;
    }

    // If baseTheme exists, show it
    if (baseTheme) {
      return defaultThemeNames[baseTheme] || 'Default';
    }

    // Custom theme without baseTheme
    return activeTheme.name || 'Default';
  };

  const themeName = getThemeDisplayName();

  return (
    <Link
      href="/dashboard/themes"
      className="flex items-center transition-all duration-200 hover:opacity-80"
      aria-label={`Active theme: ${themeName}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isLoading ? 0.6 : 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 hover:border-blue-300 transition-all duration-200 group"
      >
        <PaintBrushIcon className="w-4 h-4 text-blue-600 group-hover:text-purple-600 transition-colors duration-200" />
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {isLoading ? (
            <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
          ) : (
            <>
              <span className="text-blue-600 font-semibold">Theme:</span>{' '}
              <span className="text-purple-600">{themeName}</span>
            </>
          )}
        </span>
        {/* Active indicator dot */}
        {!isLoading && activeTheme && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-green-500 shadow-sm"
            title="Theme is active"
          />
        )}
      </motion.div>
    </Link>
  );
}

