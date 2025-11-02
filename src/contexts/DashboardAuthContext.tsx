'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
  accountId?: string;
  vtexAccountName?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface DashboardAuthContextType extends AuthState {
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const DashboardAuthContext = createContext<DashboardAuthContextType | undefined>(undefined);

interface DashboardAuthProviderProps {
  children: ReactNode;
}

/**
 * Provider centralizado para gerenciar autenticação do dashboard
 * 
 * Implementa deduplicação de requisições para evitar múltiplas chamadas simultâneas
 * ao endpoint /api/dashboard/auth/me
 */
export function DashboardAuthProvider({ children }: DashboardAuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  const router = useRouter();
  
  // Ref para deduplicação de requisições simultâneas
  const isFetchingRef = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Verifica autenticação do usuário
   * Implementa deduplicação: se já existe uma requisição em andamento,
   * retorna a mesma Promise ao invés de criar uma nova
   */
  const checkAuth = useCallback(async () => {
    // Se já existe uma requisição em andamento, retorna a mesma Promise
    if (isFetchingRef.current && fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    // Marca como em busca e cria nova Promise
    isFetchingRef.current = true;
    
    const fetchPromise = (async () => {
      try {
        const response = await fetch('/api/dashboard/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          setAuthState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      } finally {
        // Limpa flags após completar
        isFetchingRef.current = false;
        fetchPromiseRef.current = null;
      }
    })();

    // Armazena a Promise para reutilização
    fetchPromiseRef.current = fetchPromise;
    
    return fetchPromise;
  }, []);

  /**
   * Faz logout do usuário
   */
  const logout = useCallback(async () => {
    try {
      await fetch('/api/dashboard/auth/logout', { method: 'POST' });
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  // Executa verificação de autenticação no mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: DashboardAuthContextType = {
    ...authState,
    checkAuth,
    logout,
  };

  return (
    <DashboardAuthContext.Provider value={value}>
      {children}
    </DashboardAuthContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de autenticação
 * Deve ser usado dentro de DashboardAuthProvider
 */
export function useDashboardAuthContext() {
  const context = useContext(DashboardAuthContext);
  
  if (context === undefined) {
    throw new Error('useDashboardAuthContext must be used within DashboardAuthProvider');
  }
  
  return context;
}

