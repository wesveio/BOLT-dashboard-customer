'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider para gerenciar tema light/dark da dashboard
 * 
 * - Carrega preferência do usuário do banco de dados na inicialização
 * - Aplica classe 'light' ou 'dark' no elemento raiz (document.documentElement)
 * - Implementa debounce de 5 segundos para salvar preferência no DB
 * - Compatível com HeroUI que usa classes light/dark no elemento raiz
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useDashboardAuth();
  
  // Ref para debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para evitar múltiplas chamadas simultâneas
  const isSavingRef = useRef(false);

  /**
   * Aplica classe no elemento raiz do documento
   */
  const applyThemeClass = useCallback((newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
  }, []);

  /**
   * Salva preferência do tema no banco de dados
   * Implementa debounce de 5 segundos
   */
  const saveThemePreference = useCallback(async (themeToSave: Theme) => {
    if (!isAuthenticated || !user) {
      console.info('✅ [DEBUG] User not authenticated, skipping theme save');
      return;
    }

    // Limpa timer anterior se existir
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Se já está salvando, aguarda
    if (isSavingRef.current) {
      console.info('✅ [DEBUG] Theme save already in progress, debouncing...');
      return;
    }

    // Configura novo timer com debounce de 5 segundos
    debounceTimerRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        console.info(`✅ [DEBUG] Saving theme preference: ${themeToSave}`);

        const response = await fetch('/api/dashboard/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            category: 'theme',
            settings: {
              theme: themeToSave,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [DEBUG] Failed to save theme preference:', errorData);
          return;
        }

        console.info('✅ [DEBUG] Theme preference saved successfully');
      } catch (error) {
        console.error('❌ [DEBUG] Error saving theme preference:', error);
      } finally {
        isSavingRef.current = false;
        debounceTimerRef.current = null;
      }
    }, 5000); // 5 segundos de debounce
  }, [isAuthenticated, user]);

  /**
   * Carrega preferência do tema do banco de dados
   */
  const loadThemePreference = useCallback(async () => {
    // Se não autenticado, usa tema padrão 'light'
    if (!isAuthenticated || !user) {
      setThemeState('light');
      applyThemeClass('light');
      setIsLoading(false);
      return;
    }

    try {
      console.info('✅ [DEBUG] Loading theme preference from database...');
      const response = await fetch('/api/dashboard/settings', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const savedTheme = data.data?.settings?.theme?.theme as Theme | undefined;
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          console.info(`✅ [DEBUG] Loaded theme preference: ${savedTheme}`);
          setThemeState(savedTheme);
          applyThemeClass(savedTheme);
        } else {
          // Fallback para 'light' se não houver preferência salva
          console.info('✅ [DEBUG] No theme preference found, using default: light');
          setThemeState('light');
          applyThemeClass('light');
        }
      } else {
        // Em caso de erro, usa tema padrão
        console.warn('⚠️ [DEBUG] Failed to load theme preference, using default: light');
        setThemeState('light');
        applyThemeClass('light');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading theme preference:', error);
      setThemeState('light');
      applyThemeClass('light');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, applyThemeClass]);

  /**
   * Atualiza tema e salva preferência (com debounce)
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeClass(newTheme);
    saveThemePreference(newTheme);
  }, [applyThemeClass, saveThemePreference]);

  /**
   * Alterna entre light e dark
   */
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Aplica tema quando muda
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme, applyThemeClass]);

  // Carrega preferência no mount e quando autenticação muda
  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  // Limpa timer ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de tema
 * Deve ser usado dentro de ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  
  return context;
}

