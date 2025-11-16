'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  PaintBrushIcon,
  HomeIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { usePlanAccess } from '@/hooks/usePlanAccess';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function BottomNav() {
  const t = useTranslations('dashboard.sidebar');
  const pathname = usePathname();
  const { canAccessRoute } = usePlanAccess();

  // Select most important items for bottom nav (5 items total)
  // Filter based on plan features
  const allNavItems: NavItem[] = [
    { href: '/dashboard', icon: HomeIcon, label: t('overview') },
    { href: '/dashboard/performance', icon: BoltIcon, label: t('performance') },
    { href: '/dashboard/revenue', icon: CurrencyDollarIcon, label: t('revenue') },
    { href: '/dashboard/analytics', icon: ChartBarIcon, label: t('analytics') },
    { href: '/dashboard/themes', icon: PaintBrushIcon, label: t('themes') },
  ];

  // Filter nav items based on plan features
  const navItems: NavItem[] = allNavItems.filter((item) => canAccessRoute(item.href));

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-default z-50 shadow-lg safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Main items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <motion.div
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-primary/10'
                      : 'hover:bg-default-100'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon
                    className={`w-5 h-5 mb-1 ${
                      active ? 'text-primary' : 'text-foreground/50'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      active ? 'text-primary' : 'text-foreground/70'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

