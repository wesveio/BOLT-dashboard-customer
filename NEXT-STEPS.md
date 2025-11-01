# Próximos Passos - Dashboard Customer

## Status Atual ✅

### Implementado
- ✅ Estrutura base (Next.js, TypeScript, Tailwind, i18n)
- ✅ Autenticação passwordless (código por email)
- ✅ Sistema RBAC (roles e permissões)
- ✅ Todas as páginas principais (Overview, Performance, Revenue, Analytics, Themes, Insights, Profile, Settings)
- ✅ Componentes de métricas (MetricCard, ChartCard, FunnelChart, RealtimeIndicator)
- ✅ APIs básicas (Profile, Settings, Themes, Metrics)
- ✅ Migrations do Supabase
- ✅ Design style guide aplicado
- ✅ Multi-language (EN, PT-BR, ES)

---

## 🔴 PRIORIDADE ALTA - Próximos Passos

### 1. Integração Real de Dados do Supabase (8-12h)

**Objetivo:** Substituir dados mockados por dados reais do banco

**Tasks:**
- [ ] Conectar página Performance com API de metrics
- [ ] Conectar página Revenue com dados reais
- [ ] Conectar Analytics (Payment, Shipping, Devices, Browsers) com queries reais
- [ ] Criar API endpoints específicos para cada tipo de analytics
- [ ] Implementar filtros de período nas APIs
- [ ] Adicionar loading states durante fetch de dados

**APIs a Criar:**
- `/api/dashboard/analytics/payment` - Dados de métodos de pagamento
- `/api/dashboard/analytics/shipping` - Dados de métodos de frete
- `/api/dashboard/analytics/devices` - Dados por dispositivo
- `/api/dashboard/analytics/browsers` - Dados por navegador e plataforma
- `/api/dashboard/performance` - Métricas de performance detalhadas
- `/api/dashboard/revenue` - Dados de receita com agregações

**Arquivos a Modificar:**
- `src/app/dashboard/performance/page.tsx`
- `src/app/dashboard/revenue/page.tsx`
- `src/app/dashboard/analytics/*/page.tsx`
- Criar hooks customizados (`usePerformanceMetrics`, `useRevenueData`, etc.)

---

### 2. Carregar Tema ao Editar (2-3h)

**Objetivo:** Quando usuário clica em "Edit", carregar configuração do tema do Supabase

**Tasks:**
- [ ] Implementar `useEffect` no ThemeEditor para carregar tema quando `themeId !== 'new'`
- [ ] Adicionar loading state durante carregamento
- [ ] Tratar erro caso tema não encontrado
- [ ] Popular form com dados carregados

**Arquivos:**
- `src/components/Dashboard/ThemeEditor/ThemeEditor.tsx`

---

### 3. Melhorar API de Metrics com Materialized Views (4-6h)

**Objetivo:** Usar views materializadas para queries mais rápidas

**Tasks:**
- [ ] Refatorar `/api/dashboard/metrics/route.ts` para usar materialized views
- [ ] Criar queries otimizadas para cada período
- [ ] Adicionar cache de resultados (Redis ou memória)
- [ ] Implementar refresh automático das views

**Arquivos:**
- `src/app/api/dashboard/metrics/route.ts`
- `supabase/migrations/003_materialized_views.sql` (atualizar)

---

### 4. Implementar Geração Real de Insights (6-8h)

**Objetivo:** Conectar insights generator com dados reais do Supabase

**Tasks:**
- [ ] Criar API `/api/dashboard/insights`
- [ ] Integrar `insights-generator.ts` com dados reais
- [ ] Adicionar cache de insights (evitar regenerar constantemente)
- [ ] Implementar sistema de priorização de insights
- [ ] Adicionar timestamp real dos insights
- [ ] Conectar página Insights com API

**Arquivos:**
- `src/app/api/dashboard/insights/route.ts`
- `src/app/dashboard/insights/page.tsx`
- `src/utils/dashboard/insights-generator.ts`

---

## 🟡 PRIORIDADE MÉDIA - Melhorias e Features

### 5. Real-time Updates com Supabase Subscriptions (6-8h)

**Objetivo:** Atualizar métricas em tempo real sem refresh manual

**Tasks:**
- [ ] Implementar Supabase Realtime subscriptions nas páginas principais
- [ ] Criar hook `useRealtimeMetrics`
- [ ] Atualizar charts automaticamente quando novos eventos chegam
- [ ] Adicionar indicador visual de atualização

**Arquivos:**
- Criar `src/hooks/useRealtimeMetrics.ts`
- Modificar páginas de métricas para usar subscription

---

### 6. Upload de Avatar (4-6h)

**Objetivo:** Permitir upload de foto de perfil

**Tasks:**
- [ ] Criar bucket no Supabase Storage para avatares
- [ ] Implementar componente de upload com preview
- [ ] Criar API `/api/dashboard/profile/avatar`
- [ ] Adicionar validação de imagem (tipo, tamanho)
- [ ] Implementar crop/resize da imagem
- [ ] Atualizar Profile page com upload funcional

**Arquivos:**
- `src/app/api/dashboard/profile/avatar/route.ts`
- `src/components/Dashboard/AvatarUpload/AvatarUpload.tsx`
- `src/app/dashboard/profile/page.tsx`

---

### 7. Filtros e Períodos Avançados (4-6h)

**Objetivo:** Permitir seleção customizada de períodos e filtros

**Tasks:**
- [ ] Criar componente DateRangePicker
- [ ] Adicionar filtros por status, tipo, etc.
- [ ] Implementar comparação de períodos (vs. período anterior)
- [ ] Adicionar filtros avançados nas páginas de analytics

**Arquivos:**
- `src/components/Dashboard/DateRangePicker/DateRangePicker.tsx`
- `src/components/Dashboard/FilterPanel/FilterPanel.tsx`

---

### 8. Export de Dados (4-6h)

**Objetivo:** Permitir export de relatórios em CSV/Excel/PDF

**Tasks:**
- [ ] Criar API `/api/dashboard/export`
- [ ] Implementar geração de CSV
- [ ] Implementar geração de Excel (usando biblioteca como `xlsx`)
- [ ] Adicionar botões de export nas páginas principais
- [ ] Incluir filtros aplicados no export

**Arquivos:**
- `src/app/api/dashboard/export/route.ts`
- `src/utils/export-helpers.ts`

---

### 9. Two-Factor Authentication Real (6-8h)

**Objetivo:** Implementar 2FA funcional (não apenas toggle)

**Tasks:**
- [ ] Integrar com serviço de 2FA (SMS ou TOTP)
- [ ] Criar páginas de setup de 2FA
- [ ] Implementar verificação em todas as rotas protegidas
- [ ] Adicionar backup codes
- [ ] Implementar recovery flow

**Arquivos:**
- `src/app/api/dashboard/auth/two-factor/route.ts`
- `src/components/Dashboard/TwoFactorSetup/TwoFactorSetup.tsx`

---

### 10. Delete Account Funcional (2-3h)

**Objetivo:** Permitir exclusão real de conta com confirmação

**Tasks:**
- [ ] Criar modal de confirmação com input de email
- [ ] Implementar API `/api/dashboard/account/delete`
- [ ] Adicionar soft delete (ou hard delete conforme política)
- [ ] Limpar todos os dados relacionados (GDPR compliance)

**Arquivos:**
- `src/app/api/dashboard/account/delete/route.ts`
- `src/components/Dashboard/DeleteAccountModal/DeleteAccountModal.tsx`

---

## 🟢 PRIORIDADE BAIXA - Otimizações e Melhorias

### 11. Paginação e Infinite Scroll (3-4h)

**Objetivo:** Otimizar carregamento de listas grandes

**Tasks:**
- [ ] Adicionar paginação em Themes
- [ ] Implementar infinite scroll em Insights
- [ ] Adicionar skeleton loaders

---

### 12. Cache Strategy (4-6h)

**Objetivo:** Melhorar performance com cache inteligente

**Tasks:**
- [ ] Implementar React Query para cache de queries
- [ ] Adicionar cache server-side para métricas
- [ ] Implementar stale-while-revalidate pattern

---

### 13. Error Boundaries e Error Handling (3-4h)

**Objetivo:** Melhor tratamento de erros em toda aplicação

**Tasks:**
- [ ] Criar Error Boundary components
- [ ] Padronizar mensagens de erro
- [ ] Adicionar retry mechanisms
- [ ] Implementar error logging

---

### 14. Testes (8-12h)

**Objetivo:** Garantir qualidade com testes automatizados

**Tasks:**
- [ ] Setup Jest + React Testing Library
- [ ] Testes unitários dos componentes principais
- [ ] Testes de integração das APIs
- [ ] Testes E2E com Playwright/Cypress

**Arquivos:**
- Criar `__tests__/` directories
- Setup de testing framework

---

### 15. Documentação (4-6h)

**Objetivo:** Documentar APIs e componentes

**Tasks:**
- [ ] Criar README completo do projeto
- [ ] Documentar todas as APIs (OpenAPI/Swagger)
- [ ] Criar guia de contribuição
- [ ] Documentar arquitetura e decisões técnicas

---

## 📋 Ordem Sugerida de Implementação

### Sprint 1 (Semana 1-2)
1. ✅ Integração Real de Dados do Supabase
2. ✅ Carregar Tema ao Editar
3. ✅ Melhorar API de Metrics

### Sprint 2 (Semana 3-4)
4. ✅ Geração Real de Insights
5. ✅ Real-time Updates
6. ✅ Upload de Avatar

### Sprint 3 (Semana 5-6)
7. ✅ Filtros e Períodos Avançados
8. ✅ Export de Dados
9. ✅ Two-Factor Authentication

### Sprint 4 (Semana 7-8)
10. ✅ Delete Account
11. ✅ Testes
12. ✅ Documentação

---

## 🎯 Quick Wins (Fazer Agora)

Se quiser resultados rápidos, foque nestes:

1. **Carregar Tema ao Editar** (2h) - Impacto alto, esforço baixo
2. **Integrar Performance Page com API** (3h) - Dados reais logo
3. **Geração Real de Insights** (6h) - Feature completa e útil

---

## 📝 Notas Importantes

- Todas as APIs já têm estrutura básica, só precisam conectar com queries reais
- Materialized views já estão criadas nas migrations, só precisam ser usadas
- Design system está completo e consistente
- RBAC está funcional, apenas precisa de testes

---

## 🚀 Começar Agora

Sugestão: Comece pelo **Carregar Tema ao Editar** (quick win) e depois **Integração Real de Dados** (maior impacto).

