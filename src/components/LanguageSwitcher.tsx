'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Select, SelectItem } from '@heroui/react';
import { locales, type Locale } from '@/i18n/config';

const localeNames: Record<Locale, string> = {
  'en': 'English',
  'pt-BR': 'Português',
  'es': 'Español',
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = async (newLocale: string) => {
    try {
      // Set locale cookie via API
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      });

      // Refresh the page to apply new locale
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Failed to change locale:', error);
    }
  };

  return (
    <Select
      selectedKeys={[locale]}
      onSelectionChange={(keys) => {
        const newLocale = Array.from(keys)[0] as Locale;
        if (newLocale && newLocale !== locale) {
          handleLocaleChange(newLocale);
        }
      }}
      size="sm"
      variant="bordered"
      aria-label="Select language"
      disabled={isPending}
      classNames={{
        base: 'min-w-[140px]',
      }}
    >
      {locales.map((loc) => (
        <SelectItem key={loc} value={loc}>
          {localeNames[loc]}
        </SelectItem>
      ))}
    </Select>
  );
}

