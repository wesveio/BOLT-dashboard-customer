'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-collapsed';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('‼️ [DEBUG] Failed to load sidebar state from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed));
      } catch (error) {
        console.warn('‼️ [DEBUG] Failed to save sidebar state to localStorage:', error);
      }
    }
  }, [isCollapsed, isInitialized]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      console.info('✅ [DEBUG] Sidebar toggle:', { from: prev, to: newState });
      return newState;
    });
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

