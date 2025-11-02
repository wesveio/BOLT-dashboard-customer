/**
 * Hook para acessar autenticação do dashboard
 * 
 * Agora utiliza DashboardAuthContext para compartilhar estado entre componentes,
 * evitando múltiplas chamadas redundantes ao endpoint /api/dashboard/auth/me
 * 
 * IMPORTANTE: Deve ser usado dentro de DashboardAuthProvider
 */
import { useDashboardAuthContext } from '@/contexts/DashboardAuthContext';

export function useDashboardAuth() {
  return useDashboardAuthContext();
}

