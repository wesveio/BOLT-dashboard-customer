'use client';

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { motion } from 'framer-motion';

/**
 * Componente switcher para alternar entre tema light e dark
 * 
 * Posicionado no rodapé da sidebar, antes do botão de toggle
 * Adapta-se ao estado colapsado da sidebar
 */
export function ThemeSwitcher() {
  const { theme, toggleTheme, isLoading } = useTheme();
  const { isCollapsed } = useSidebar();

  if (isLoading) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-start'} mb-2`}>
      <motion.button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleTheme();
        }}
        className={`
          p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${isCollapsed ? 'w-full' : 'w-full'}
          ${
            isDark
              ? 'bg-default-800 text-warning hover:bg-default-700'
              : 'bg-default-100 text-foreground/70 hover:bg-default-200'
          }
        `}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center justify-center gap-2">
          {isDark ? (
            <MoonIcon className="w-5 h-5" />
          ) : (
            <SunIcon className="w-5 h-5" />
          )}
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-nowrap"
            >
              {isDark ? 'Dark' : 'Light'}
            </motion.span>
          )}
        </div>
      </motion.button>
    </div>
  );
}

