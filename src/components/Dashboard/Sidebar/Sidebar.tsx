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
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  ArrowTopRightOnSquareIcon,
  CreditCardIcon,
  KeyIcon,
  BoltIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Avatar } from '@heroui/react';

interface NavSubItem {
  href: string;
  label: string;
  translationKey: string;
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subItems?: NavSubItem[];
}

export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const t = useTranslations('dashboard.sidebar');
  const tAnalytics = useTranslations('dashboard.analytics');
  const tBoltX = useTranslations('dashboard.boltx');
  const tDashboards = useTranslations('dashboard.dashboards');
  const pathname = usePathname();
  const { user, isLoading } = useDashboardAuth();
  const { canAccessRoute } = usePlanAccess();

  // Define all nav items (will be filtered by plan features)
  // Note: BoltX is included here and will be filtered by canAccessRoute
  const allNavItems: NavItem[] = [
    { href: '/dashboard', icon: HomeIcon, label: t('overview') },
    { href: '/dashboard/performance', icon: BoltIcon, label: t('performance') },
    { href: '/dashboard/revenue', icon: CurrencyDollarIcon, label: t('revenue') },
    {
      href: '/dashboard/analytics',
      icon: ChartBarIcon,
      label: t('analytics'),
      subItems: [
        {
          href: '/dashboard/analytics/payment',
          label: tAnalytics('payment.title'),
          translationKey: 'dashboard.analytics.payment.title',
        },
        {
          href: '/dashboard/analytics/shipping',
          label: tAnalytics('shipping.title'),
          translationKey: 'dashboard.analytics.shipping.title',
        },
        {
          href: '/dashboard/analytics/coupons',
          label: tAnalytics('coupons.title'),
          translationKey: 'dashboard.analytics.coupons.title',
        },
        {
          href: '/dashboard/analytics/micro-conversions',
          label: tAnalytics('microConversions.title'),
          translationKey: 'dashboard.analytics.microConversions.title',
        },
        {
          href: '/dashboard/analytics/geography',
          label: tAnalytics('geography.title'),
          translationKey: 'dashboard.analytics.geography.title',
        },
        {
          href: '/dashboard/analytics/ltv',
          label: tAnalytics('ltv.title'),
          translationKey: 'dashboard.analytics.ltv.title',
        },
        {
          href: '/dashboard/analytics/cac',
          label: tAnalytics('cac.title'),
          translationKey: 'dashboard.analytics.cac.title',
        },
        {
          href: '/dashboard/analytics/retention',
          label: tAnalytics('retention.title'),
          translationKey: 'dashboard.analytics.retention.title',
        },
        {
          href: '/dashboard/analytics/abandonment-prediction',
          label: tAnalytics('abandonmentPrediction.title'),
          translationKey: 'dashboard.analytics.abandonmentPrediction.title',
        },
        {
          href: '/dashboard/analytics/cohorts',
          label: tAnalytics('cohorts.title'),
          translationKey: 'dashboard.analytics.cohorts.title',
        },
        {
          href: '/dashboard/analytics/segments',
          label: tAnalytics('segments.title'),
          translationKey: 'dashboard.analytics.segments.title',
        },
        {
          href: '/dashboard/analytics/optimization-roi',
          label: tAnalytics('optimizationROI.title'),
          translationKey: 'dashboard.analytics.optimizationROI.title',
        },
        {
          href: '/dashboard/analytics/friction-score',
          label: tAnalytics('frictionScore.title'),
          translationKey: 'dashboard.analytics.frictionScore.title',
        },
        {
          href: '/dashboard/analytics/revenue-forecast',
          label: tAnalytics('revenueForecast.title'),
          translationKey: 'dashboard.analytics.revenueForecast.title',
        },
        {
          href: '/dashboard/analytics/devices',
          label: tAnalytics('devices.title'),
          translationKey: 'dashboard.analytics.devices.title',
        },
        {
          href: '/dashboard/analytics/browsers',
          label: tAnalytics('browsers.title'),
          translationKey: 'dashboard.analytics.browsers.title',
        },
      ],
    },
    {
      href: '/dashboard/dashboards',
      icon: Squares2X2Icon,
      label: t('dashboards'),
    },
    { href: '/dashboard/security', icon: ShieldCheckIcon, label: t('security') },
    { href: '/dashboard/themes', icon: PaintBrushIcon, label: t('themes') },
    { href: '/dashboard/insights', icon: LightBulbIcon, label: t('insights') },
    {
      href: '/dashboard/boltx',
      icon: CpuChipIcon,
      label: t('boltx'),
      subItems: [
        {
          href: '/dashboard/boltx/predictions',
          label: tBoltX('predictions.title'),
          translationKey: 'dashboard.boltx.predictions.title',
        },
        {
          href: '/dashboard/boltx/interventions',
          label: tBoltX('interventions.title'),
          translationKey: 'dashboard.boltx.interventions.title',
        },
        {
          href: '/dashboard/boltx/personalization',
          label: tBoltX('personalization.title'),
          translationKey: 'dashboard.boltx.personalization.title',
        },
        {
          href: '/dashboard/boltx/optimization',
          label: tBoltX('optimization.title'),
          translationKey: 'dashboard.boltx.optimization.title',
        },
        {
          href: '/dashboard/boltx/settings',
          label: t('settings'),
          translationKey: 'dashboard.settings.title',
        },
      ],
    },
    { href: '/dashboard/plans', icon: CreditCardIcon, label: t('plans') },
    { href: '/dashboard/integrations', icon: KeyIcon, label: t('integrations') },
    { href: '/dashboard/settings', icon: Cog6ToothIcon, label: t('settings') },
  ];

  // Filter nav items based on plan features
  const navItems: NavItem[] = allNavItems
    .map((item) => {
      // Check if parent route is accessible
      const parentAccessible = canAccessRoute(item.href);
      
      // Debug log for BoltX
      if (item.href === '/dashboard/boltx') {
        console.info('✅ [DEBUG] BoltX route check:', {
          href: item.href,
          parentAccessible,
        });
      }
      
      // Filter sub-items if they exist
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter((subItem) => canAccessRoute(subItem.href));
        // Only include parent item if it has accessible sub-items or if parent route is accessible
        if (filteredSubItems.length > 0 || parentAccessible) {
          return {
            ...item,
            subItems: filteredSubItems,
          };
        }
        return null;
      }
      
      // For items without sub-items, include only if parent route is accessible
      return parentAccessible ? item : null;
    })
    .filter((item): item is NavItem => item !== null);

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
      className={`hidden md:flex bg-white border-r border-gray-100 fixed left-0 top-0 h-screen z-30 transition-all duration-200 flex-col ${
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
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSubItemActive = hasSubItems && item.subItems?.some((subItem) => isActive(subItem.href));
            const shouldExpand = !isCollapsed && hasSubItems && (active || isSubItemActive);

            return (
              <div key={item.href}>
                <Link href={item.href} title={isCollapsed ? item.label : ''}>
                  <motion.div
                    className={`flex items-center gap-3 rounded-lg transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'
                    } ${
                      active || isSubItemActive
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
                        active || isSubItemActive
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <>
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`font-semibold whitespace-nowrap overflow-hidden flex-1 ${
                              active || isSubItemActive ? 'text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            {item.label}
                          </motion.span>
                          {hasSubItems && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              {shouldExpand ? (
                                <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                              )}
                            </motion.div>
                          )}
                        </>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>

                {/* Sub-items */}
                <AnimatePresence>
                  {shouldExpand && item.subItems && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                        {item.subItems.map((subItem) => {
                          const subActive = isActive(subItem.href);
                          return (
                            <Link key={subItem.href} href={subItem.href}>
                              <motion.div
                                className={`px-3 py-2 rounded-md transition-all duration-200 ${
                                  subActive
                                    ? 'bg-blue-50 border border-blue-200 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                whileHover={{ x: 2 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                              >
                                <span className="text-sm">{subItem.label}</span>
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Toggle Button - Footer */}
      <div className={`border-t border-gray-100 p-4 flex ${isCollapsed ? 'justify-center' : 'justify-end'} relative z-10`}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCollapse();
          }}
          className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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

