'use client';

import { useLocale } from 'next-intl';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const locales = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  const handleLocaleChange = (newLocale: string) => {
    // Set locale cookie via API
    fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: newLocale }),
    })
      .then(() => {
        router.refresh();
      })
      .catch((error) => {
        console.error('Failed to change locale:', error);
      });
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="light"
          className="flex items-center gap-2"
          startContent={<GlobeAltIcon className="w-5 h-5" />}
        >
          <span className="hidden md:inline">{currentLocale.flag}</span>
          <span className="hidden md:inline text-sm font-semibold">
            {currentLocale.label}
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectionMode="single"
        selectedKeys={[locale]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          handleLocaleChange(selected);
        }}
      >
        {locales.map((loc) => (
          <DropdownItem key={loc.code}>
            <div className="flex items-center gap-2">
              <span>{loc.flag}</span>
              <span>{loc.label}</span>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

