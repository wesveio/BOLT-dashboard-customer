import { Inter } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <HeroUIProvider>
          {children}
          <Toaster position="top-right" richColors />
        </HeroUIProvider>
      </body>
    </html>
  );
}

