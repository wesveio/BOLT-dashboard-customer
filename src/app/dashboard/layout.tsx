'use client';

import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'sonner';
import { DashboardAuthProvider } from '@/contexts/DashboardAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { PeriodProvider } from '@/contexts/PeriodContext';
import { PlanAccessProvider } from '@/contexts/PlanAccessContext';
import { Sidebar } from '@/components/Dashboard/Sidebar/Sidebar';
import { BottomNav } from '@/components/Dashboard/BottomNav/BottomNav';
import { DashboardHeader } from '@/components/Dashboard/Header/DashboardHeader';
import { AuthGuard } from '@/components/Dashboard/AuthGuard/AuthGuard';
import { DemoModeBanner } from '@/components/Dashboard/DemoModeBanner/DemoModeBanner';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main
          className={`flex-1 p-6 transition-all duration-200 ${
            isCollapsed ? 'md:ml-20' : 'md:ml-64'
          } pb-20 md:pb-6`}
        >
          <DemoModeBanner />
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

/**
 * Wrapper para HeroUIProvider
 * O HeroUI detecta automaticamente a classe 'light' ou 'dark' no elemento raiz
 * que é aplicada pelo ThemeContext
 */
function HeroUIProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthProvider>
      <ThemeProvider>
        <HeroUIProviderWrapper>
          <PlanAccessProvider>
            <SidebarProvider>
              <PeriodProvider>
                <AuthGuard>
                  <DashboardContent>{children}</DashboardContent>
                  <Toaster position="top-right" richColors />
                </AuthGuard>
              </PeriodProvider>
            </SidebarProvider>
          </PlanAccessProvider>
        </HeroUIProviderWrapper>
      </ThemeProvider>
    </DashboardAuthProvider>
  );
}

