import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { GoogleTagManager } from '@/components/GoogleTagManager';
import { ScrollAnimation } from '@/components/Public/ScrollAnimation';
import { metadata } from './metadata';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export { metadata };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get locale from cookie or default
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = 
    localeCookie && routing.locales.includes(localeCookie as any)
      ? localeCookie
      : routing.defaultLocale;

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <body className={inter.className}>
        <GoogleTagManager />
        <ScrollAnimation />
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

