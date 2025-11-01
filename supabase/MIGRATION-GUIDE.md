# 🗄️ Guia de Migrações do Supabase

Este guia explica como executar as migrações SQL para criar as tabelas no Supabase.

## 📋 Arquivos de Migração

As migrações estão organizadas na pasta `supabase/migrations/` e devem ser executadas nesta ordem:

1. `001_initial_schema.sql` - Schema inicial (schemas, tabelas principais)
2. `002_rls_policies.sql` - Políticas de Row Level Security (RLS)
3. `003_materialized_views.sql` - Views materializadas para analytics
4. `004_auth_tables.sql` - Índices e funções de autenticação
5. `005_add_user_fields.sql` - Campos adicionais de usuário

## 🚀 Método 1: Supabase CLI (Recomendado)

O Supabase CLI é a forma mais profissional e automatizada de gerenciar migrações.

### Instalação

```bash
# macOS
brew install supabase/tap/supabase

# Ou via npm
npm install -g supabase
```

### Configuração

1. Faça login no Supabase:
```bash
supabase login
```

2. Link seu projeto local ao projeto remoto:
```bash
cd dashboard-customer
supabase link --project-ref seu-project-ref
```

Você encontra o `project-ref` nas configurações do projeto no Dashboard do Supabase.

3. Execute as migrações:
```bash
supabase db push
```

Ou para um ambiente específico:
```bash
supabase db push --db-url "postgresql://postgres:[senha]@[host]:5432/postgres"
```

### Vantagens
- ✅ Versionamento automático
- ✅ Rollback fácil
- ✅ Sincronização com banco local
- ✅ Histórico de migrações

---

## 📝 Método 2: SQL Editor do Dashboard (Mais Simples)

Esta é a forma mais direta e não requer instalação de ferramentas.

### Passos

1. **Acesse o Dashboard do Supabase:**
   - Vá para https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Execute cada migração em ordem:**
   
   a. Copie o conteúdo de `001_initial_schema.sql`
   
   b. Cole no SQL Editor
   
   c. Clique em **"Run"** ou pressione `Ctrl+Enter` (Mac: `Cmd+Enter`)
   
   d. Verifique se não há erros
   
   e. Repita para os próximos arquivos na ordem numérica

### Verificação

Após executar todas as migrações, verifique se as tabelas foram criadas:

```sql
-- Verificar schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('customer', 'dashboard', 'analytics');

-- Verificar tabelas no schema customer
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'customer';

-- Verificar tabelas no schema dashboard
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'dashboard';

-- Verificar tabelas no schema analytics
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'analytics';
```

### Vantagens
- ✅ Não requer instalação
- ✅ Interface visual
- ✅ Fácil verificação de erros
- ✅ Ideal para testes rápidos

---

## 💻 Método 3: Script Node.js Automatizado

Este projeto inclui um script para executar as migrações automaticamente.

### Pré-requisitos

1. Configure as variáveis de ambiente no `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

2. Instale dependências (se ainda não tiver):
```bash
yarn install
```

### Execução

```bash
# Via tsx (recomendado)
npx tsx scripts/run-migrations.ts

# Ou adicione ao package.json e execute:
yarn run migrate
```

**Nota:** Este método pode ter limitações dependendo da versão do Supabase. Se encontrar erros, use o Método 2 (SQL Editor).

---

## 🔍 Verificação Pós-Migração

Após executar todas as migrações, verifique:

### 1. Tabelas Criadas

Execute no SQL Editor:

```sql
-- Resumo de todas as tabelas
SELECT 
  table_schema,
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = t.table_schema 
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema IN ('customer', 'dashboard', 'analytics')
ORDER BY table_schema, table_name;
```

### 2. Políticas RLS Ativas

```sql
-- Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname IN ('customer', 'dashboard', 'analytics')
ORDER BY schemaname, tablename;
```

### 3. Índices Criados

```sql
-- Verificar índices
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname IN ('customer', 'dashboard', 'analytics')
ORDER BY schemaname, tablename;
```

### 4. Funções Criadas

```sql
-- Verificar funções customizadas
SELECT 
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema IN ('customer', 'dashboard', 'analytics')
ORDER BY routine_schema, routine_name;
```

---

## 🛠️ Solução de Problemas

### Erro: "relation already exists"

Se você já executou algumas migrações antes:

```sql
-- Verificar quais tabelas já existem
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('customer', 'dashboard', 'analytics');
```

Opções:
1. **Dropar e recriar** (⚠️ apaga dados):
   - Execute `DROP SCHEMA IF EXISTS customer CASCADE;`
   - Execute `DROP SCHEMA IF EXISTS dashboard CASCADE;`
   - Execute `DROP SCHEMA IF EXISTS analytics CASCADE;`
   - Execute todas as migrações novamente

2. **Executar apenas migrações pendentes**:
   - Execute apenas os arquivos que ainda não foram executados

### Erro: "permission denied"

Certifique-se de estar usando:
- **SQL Editor:** Conta de admin do projeto (automático)
- **CLI:** Service Role Key ou credenciais de admin
- **Script:** `SUPABASE_SERVICE_ROLE_KEY` configurada

### Erro: "extension does not exist"

Algumas extensões podem não estar disponíveis no seu plano do Supabase:

```sql
-- Verificar extensões disponíveis
SELECT * FROM pg_available_extensions WHERE name IN ('uuid-ossp', 'pg_trgm', 'timescaledb');
```

Se `timescaledb` não estiver disponível, comente as linhas relacionadas nas migrações.

---

## 📚 Estrutura do Banco de Dados

Após executar todas as migrações, você terá:

### Schema `customer`
- `accounts` - Contas de clientes (VTEX accounts)

### Schema `dashboard`
- `users` - Usuários do dashboard
- `auth_codes` - Códigos de autenticação passwordless
- `sessions` - Sessões de usuários
- `theme_configs` - Configurações de tema
- `theme_versions` - Versões de temas
- `financial_metrics` - Métricas financeiras

### Schema `analytics`
- `events` - Eventos do checkout (time-series)
- `checkout_metrics_hourly` - Métricas por hora (materialized view)
- `checkout_metrics_daily` - Métricas diárias (materialized view)
- `checkout_funnel` - Métricas de funnel (materialized view)

---

## 🎯 Próximos Passos

Após executar as migrações:

1. ✅ Verifique se todas as tabelas foram criadas
2. ✅ Configure as variáveis de ambiente na aplicação
3. ✅ Teste a conexão com o banco
4. ✅ Configure dados iniciais (se necessário)
5. ✅ Teste autenticação e criação de usuários

---

## 📖 Referências

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/tables)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl-constraints.html)

