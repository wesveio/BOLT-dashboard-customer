'use client';

import { useTranslations } from 'next-intl';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button,
} from '@heroui/react';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { ActiveThemeBadge } from '../ActiveThemeBadge/ActiveThemeBadge';
import { useSidebar } from '@/contexts/SidebarContext';
import Image from 'next/image';
import Link from 'next/link';

export function DashboardHeader() {
  const t = useTranslations('dashboard.header');
  const { user, logout } = useDashboardAuth();
  const { isCollapsed } = useSidebar();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={`sticky top-4 z-20 transition-all duration-200 ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}
    >
      <div className="mx-4">
        <div className="backdrop-blur-md bg-white/80 border border-white/30 rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Left side - Logo */}
            <Link
              href="/dashboard"
              className="flex items-center transition-opacity duration-200 hover:opacity-80"
              aria-label="Bolt - Go to dashboard"
            >
              <div className="relative w-auto flex items-center" style={{ height: '18px' }}>
                <Image
                  src="/bolt.svg"
                  alt="Bolt Logo"
                  width={68}
                  height={23}
                  className="h-full w-auto object-contain"
                  style={{
                    filter: 'brightness(0) saturate(100%)',
                  }}
                  priority
                  unoptimized
                />
              </div>
            </Link>

          {/* Right side - User menu and language switcher */}
          <div className="flex items-center gap-4">
            <ActiveThemeBadge />
            <LanguageSwitcher />

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  variant="light"
                  className="flex items-center"
                  isIconOnly={true}
                >
                  <Avatar
                    size="sm"
                    name={user?.name || user?.email || 'U'}
                    className="bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                  />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem key="profile" href="/dashboard/profile">
                  {t('profile')}
                </DropdownItem>
                <DropdownItem key="settings" href="/dashboard/settings">
                  {t('settings')}
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  onClick={handleLogout}
                >
                  {t('logout')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}

