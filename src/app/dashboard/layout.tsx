'use client';

import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'sonner';
import { DashboardAuthProvider } from '@/contexts/DashboardAuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Sidebar } from '@/components/Dashboard/Sidebar/Sidebar';
import { DashboardHeader } from '@/components/Dashboard/Header/DashboardHeader';
import { AuthGuard } from '@/components/Dashboard/AuthGuard/AuthGuard';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main
          className={`flex-1 p-6 transition-all duration-200 ${
            isCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeroUIProvider>
      <DashboardAuthProvider>
        <SidebarProvider>
          <AuthGuard>
            <DashboardContent>{children}</DashboardContent>
            <Toaster position="top-right" richColors />
          </AuthGuard>
        </SidebarProvider>
      </DashboardAuthProvider>
    </HeroUIProvider>
  );
}

