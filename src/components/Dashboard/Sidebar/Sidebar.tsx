'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  LightBulbIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ArrowTopRightOnSquareIcon,
  CreditCardIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { Avatar } from '@heroui/react';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const t = useTranslations('dashboard.sidebar');
  const pathname = usePathname();
  const { user, isLoading } = useDashboardAuth();

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: HomeIcon, label: t('overview') },
    { href: '/dashboard/performance', icon: ChartBarIcon, label: t('performance') },
    { href: '/dashboard/revenue', icon: CurrencyDollarIcon, label: t('revenue') },
    { href: '/dashboard/analytics', icon: ChartBarIcon, label: t('analytics') },
    { href: '/dashboard/themes', icon: PaintBrushIcon, label: t('themes') },
    { href: '/dashboard/insights', icon: LightBulbIcon, label: t('insights') },
    { href: '/dashboard/plans', icon: CreditCardIcon, label: t('plans') },
    { href: '/dashboard/integrations', icon: KeyIcon, label: t('integrations') },
    { href: '/dashboard/settings', icon: Cog6ToothIcon, label: t('settings') },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.email;
  };

  // Get user name for Avatar component
  const getUserNameForAvatar = () => {
    if (!user) return 'U';
    return user.name || user.email || 'U';
  };

  // Format role for display
  const formatRole = (role?: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <aside
      className={`bg-white border-r border-gray-100 fixed left-0 top-0 h-screen z-30 transition-all duration-200 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`flex-1 overflow-y-auto p-6 transition-all duration-200 ${isCollapsed ? 'px-4' : ''}`}>
        {/* Account Info Section */}
        {!isLoading && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 pb-6 border-b border-gray-100 transition-all duration-200 ${
              isCollapsed ? 'flex justify-center' : 'flex flex-col items-center'
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar
                size={isCollapsed ? 'sm' : 'md'}
                name={getUserNameForAvatar()}
                className="bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md"
              />
            </div>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center mt-3 w-full"
                >
                  {/* User Name */}
                  <p className="text-sm font-semibold text-gray-900 truncate w-full text-center">
                    {getUserDisplayName()}
                  </p>
                  
                  {/* Email */}
                  {(user.firstName || user.name) && (
                    <p className="text-xs text-gray-500 truncate mt-0.5 w-full text-center">
                      {user.email}
                    </p>
                  )}

                  {/* Role Badge */}
                  {user.role && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                      <UserCircleIcon className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">
                        {formatRole(user.role)}
                      </span>
                    </div>
                  )}

                  {/* VTEX Account */}
                  {user.vtexAccountName && (
                    <div className="mt-2 text-xs text-gray-600 truncate w-full text-center">
                      <span className="font-medium">{t('vtexAccount')}:</span>
                      <div className="flex items-center gap-1">
                        <Link href={`https://${user.vtexAccountName}.myvtex.com`} target="_blank" className="flex items-center gap-1 w-full justify-center"><span className="text-blue-600">{user.vtexAccountName}</span> <ArrowTopRightOnSquareIcon className="w-3 h-3 text-blue-600" /></Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href} title={isCollapsed ? item.label : ''}>
                <motion.div
                  className={`flex items-center gap-3 rounded-lg transition-all duration-200 ${
                    isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'
                  } ${
                    active
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                  }`}
                  whileHover={isCollapsed ? {} : { x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Icon
                    className={`flex-shrink-0 ${
                      isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                    } ${
                      active
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`font-semibold whitespace-nowrap overflow-hidden ${
                          active ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Toggle Button - Footer */}
      <div className={`border-t border-gray-100 p-4 flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </aside>
  );
}

