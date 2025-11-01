'use client';

import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/Dashboard/Sidebar/Sidebar';
import { DashboardHeader } from '@/components/Dashboard/Header/DashboardHeader';
import { AuthGuard } from '@/components/Dashboard/AuthGuard/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeroUIProvider>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <DashboardHeader />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
        <Toaster position="top-right" richColors />
      </AuthGuard>
    </HeroUIProvider>
  );
}

