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

export function DashboardHeader() {
  const t = useTranslations('dashboard.header');
  const { user, logout } = useDashboardAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 sticky top-0 z-20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - can add breadcrumbs or title here */}
          <div className="flex-1"></div>

          {/* Right side - User menu and language switcher */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  variant="light"
                  className="flex items-center gap-3 px-3"
                  isIconOnly={false}
                >
                  <Avatar
                    size="sm"
                    name={user?.name || user?.email || 'U'}
                    className="bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                  />
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
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
    </header>
  );
}

