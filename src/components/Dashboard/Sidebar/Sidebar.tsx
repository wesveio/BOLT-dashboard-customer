'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  LightBulbIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function Sidebar() {
  const t = useTranslations('dashboard.sidebar');
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: HomeIcon, label: t('overview') },
    { href: '/dashboard/performance', icon: ChartBarIcon, label: t('performance') },
    { href: '/dashboard/revenue', icon: CurrencyDollarIcon, label: t('revenue') },
    { href: '/dashboard/analytics', icon: ChartBarIcon, label: t('analytics') },
    { href: '/dashboard/themes', icon: PaintBrushIcon, label: t('themes') },
    { href: '/dashboard/insights', icon: LightBulbIcon, label: t('insights') },
    { href: '/dashboard/settings', icon: Cog6ToothIcon, label: t('settings') },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen sticky top-0">
      <div className="p-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BOLT
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                  }`}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span
                    className={`font-semibold ${
                      active ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

