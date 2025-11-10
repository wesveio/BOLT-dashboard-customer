'use client';

import { useLocale } from 'next-intl';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';
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
          startContent={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
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

