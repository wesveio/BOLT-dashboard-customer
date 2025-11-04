'use client';

import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'sonner';
import { DashboardAuthProvider } from '@/contexts/DashboardAuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Sidebar } from '@/components/Dashboard/Sidebar/Sidebar';
import { BottomNav } from '@/components/Dashboard/BottomNav/BottomNav';
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
            isCollapsed ? 'md:ml-20' : 'md:ml-64'
          } pb-20 md:pb-6`}
        >
          {children}
        </main>
      </div>
      <BottomNav />
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

