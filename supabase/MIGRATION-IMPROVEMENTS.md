# 📋 Análise de Melhorias nas Migrações

## 🔍 Problemas Identificados

### 1. **CHECK Constraints Faltando** ✅ CORRIGIDO
- **Problema**: Campos `plan_type`, `status`, `role`, e `category` não têm CHECK constraints
- **Risco**: Dados inválidos podem ser inseridos
- **Solução**: Adicionados CHECK constraints em `006_improvements.sql`

### 2. **Triggers para updated_at** ✅ CORRIGIDO
- **Problema**: Campos `updated_at` não são atualizados automaticamente
- **Risco**: Timestamps desatualizados
- **Solução**: Criado trigger genérico `update_updated_at_column()`

### 3. **Constraints de Integridade** ✅ CORRIGIDO
- **Problema**: 
  - `theme_versions` não tem UNIQUE constraint em (theme_id, version_number)
  - `financial_metrics` não valida que `period_end >= period_start`
  - `auth_codes.attempts` não tem limite máximo
- **Solução**: Adicionados constraints apropriados

### 4. **Validação de Email** ✅ CORRIGIDO
- **Problema**: Emails não são validados no formato
- **Solução**: Função `is_valid_email()` e CHECK constraints

### 5. **Materialized Views com TimescaleDB** ✅ CORRIGIDO
- **Problema**: Views usam `time_bucket()` que requer TimescaleDB (pode não estar disponível)
- **Solução**: Substituído por `DATE_TRUNC()` nativo do PostgreSQL

### 6. **Índices Faltando** ✅ CORRIGIDO
- **Problema**: Alguns índices importantes para performance estão faltando
- **Solução**: Adicionados índices para:
  - Temas ativos por account
  - Últimas versões de temas
  - Períodos de métricas financeiras
  - Queries compostas em events

### 7. **RLS Policies com auth.uid()** ⚠️ ATENÇÃO NECESSÁRIA
- **Problema**: Policies em `002_rls_policies.sql` usam `auth.uid()` mas o sistema usa autenticação customizada
- **Impacto**: Policies não funcionarão corretamente
- **Solução Necessária**: 
  - Opção 1: Migrar para Supabase Auth nativo
  - Opção 2: Criar função customizada que retorna o user_id da sessão atual
  - Opção 3: Usar service_role para bypass RLS e implementar controle no código da aplicação

### 8. **Limpeza de Dados Expirados** ✅ MELHORADO
- **Problema**: Funções de cleanup deletam imediatamente
- **Solução**: Agora mantém registros por 7 dias antes de deletar (para auditoria)

## 📝 Melhorias Implementadas

### Constraints de Validação
```sql
-- Enums validados
CHECK (plan_type IN ('basic', 'pro', 'enterprise'))
CHECK (status IN ('active', 'suspended', 'cancelled'))
CHECK (role IN ('owner', 'admin', 'editor', 'viewer'))
CHECK (category IN ('user_action', 'api_call', 'metric', 'error'))

-- Validações de integridade
CHECK (period_end >= period_start)
CHECK (version_number > 0)
CHECK (attempts >= 0 AND attempts <= 10)
CHECK (refresh_expires_at > expires_at)
```

### Triggers Automáticos
- `update_accounts_updated_at`: Atualiza `updated_at` em `customer.accounts`
- `update_users_updated_at`: Atualiza `updated_at` em `dashboard.users`
- `update_theme_configs_updated_at`: Atualiza `updated_at` em `dashboard.theme_configs`

### Índices de Performance
- `idx_theme_configs_active`: Busca rápida de temas ativos
- `idx_theme_versions_latest`: Ordenação por versão mais recente
- `idx_financial_metrics_period`: Queries por período
- `idx_events_customer_category_time`: Queries compostas em eventos
- `idx_events_order_form`: Lookups por order_form_id

### Views Materializadas Corrigidas
- Substituído `time_bucket()` por `DATE_TRUNC()` (PostgreSQL nativo)
- Adicionado filtro `WHERE customer_id IS NOT NULL` para evitar agregações inválidas

## ⚠️ Ações Necessárias

### 1. Corrigir RLS Policies (URGENTE)
As policies atuais não funcionarão com autenticação customizada. Escolha uma abordagem:

**Opção A: Função Helper Customizada**
```sql
-- Criar função que obtém user_id da sessão atual via token
CREATE OR REPLACE FUNCTION dashboard.get_current_user_id()
RETURNS UUID AS $$
DECLARE
  v_token TEXT;
  v_user_id UUID;
BEGIN
  -- Obter token do header da requisição (via current_setting)
  v_token := current_setting('request.headers', true)::json->>'authorization';
  
  -- Buscar user_id na tabela sessions
  SELECT user_id INTO v_user_id
  FROM dashboard.sessions
  WHERE token = v_token
    AND expires_at > NOW();
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usar nas policies
CREATE POLICY "Users can view their account"
  ON customer.accounts FOR SELECT
  USING (id IN (
    SELECT account_id FROM dashboard.users
    WHERE id = dashboard.get_current_user_id()
  ));
```

**Opção B: Desabilitar RLS e Controlar no Código**
```sql
-- Desabilitar RLS e usar service_role com controle na aplicação
ALTER TABLE customer.accounts DISABLE ROW LEVEL SECURITY;
-- ... fazer o mesmo para outras tabelas
```

**Opção C: Integrar com Supabase Auth**
- Migrar para usar Supabase Auth nativo
- Criar trigger para sincronizar `auth.users` com `dashboard.users`

### 2. Adicionar Refresh Automático de Views
```sql
-- Configurar pg_cron (se disponível)
SELECT cron.schedule(
  'refresh-analytics-views',
  '0 * * * *', -- A cada hora
  $$SELECT analytics.refresh_materialized_views()$$
);
```

### 3. Revisar Cleanup Functions
- Configurar execução automática via cron job ou scheduled function
- Considerar usar `pg_cron` extension

## 🚀 Próximos Passos

1. ✅ Executar `006_improvements.sql` em ambiente de desenvolvimento
2. ⚠️ Decidir e implementar correção para RLS policies
3. ⚠️ Configurar refresh automático das views materializadas
4. ⚠️ Testar todas as constraints e triggers
5. ⚠️ Revisar performance após adicionar novos índices

## 📊 Checklist de Validação

- [ ] Executar `006_improvements.sql` sem erros
- [ ] Verificar que CHECK constraints funcionam (tentar inserir valor inválido)
- [ ] Testar triggers de `updated_at`
- [ ] Validar que emails são rejeitados se inválidos
- [ ] Confirmar que views materializadas usam `DATE_TRUNC`
- [ ] Decidir e implementar solução para RLS policies
- [ ] Configurar cleanup automático
- [ ] Executar análise de performance (EXPLAIN ANALYZE)

## 🔗 Referências

- [PostgreSQL CHECK Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL DATE_TRUNC](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-TRUNC)

