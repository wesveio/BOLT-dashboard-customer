# Solução para Erro PGRST106: Schema não exposto

## Problema

O PostgREST (usado pelo Supabase) por padrão **apenas expõe os schemas `public` e `graphql_public`**. Quando tentamos acessar tabelas no schema `dashboard` ou `customer` diretamente via PostgREST, recebemos o erro:

```
PGRST106: The schema must be one of the following: public, graphql_public
```

## Solução Implementada

Criamos **funções SQL no schema `public`** que acessam as tabelas nos schemas `dashboard` e `customer`. Como as funções estão no schema `public`, elas são expostas pelo PostgREST e podem ser chamadas via `.rpc()`.

### Migration Aplicada

**Arquivo:** `007_expose_dashboard_via_public_functions.sql`

Esta migration cria funções SQL no schema `public` que:
- Acessam tabelas no schema `dashboard` (users, auth_codes, sessions)
- Acessam tabelas no schema `customer` (accounts)
- Usam `SECURITY DEFINER` para garantir permissões adequadas

### Funções Criadas

#### User Functions
- `get_user_by_email(email)` - Busca usuário por email
- `get_user_by_id(user_id)` - Busca usuário por ID
- `create_user(...)` - Cria novo usuário
- `update_user_last_login(user_id)` - Atualiza último login

#### Auth Code Functions
- `get_recent_auth_codes(email, limit)` - Busca códigos recentes para rate limiting
- `insert_auth_code(...)` - Insere novo código de autenticação
- `get_auth_code_for_verification(email)` - Busca código para verificação
- `increment_auth_code_attempts(code_id)` - Incrementa tentativas
- `mark_auth_code_used(code_id)` - Marca código como usado

#### Session Functions
- `create_session(...)` - Cria nova sessão
- `get_session_by_token(token)` - Busca sessão por token
- `delete_session_by_token(token)` - Deleta sessão por token
- `delete_session_by_refresh_token(refresh_token)` - Deleta sessão por refresh token

#### Account Functions
- `get_account_by_vtex_name(vtex_account_name)` - Busca conta por VTEX account
- `create_account(...)` - Cria nova conta
- `delete_account(account_id)` - Deleta conta

## Como Usar

Todas as funções são chamadas via `.rpc()` sem especificar schema:

```typescript
// Antes (❌ Erro PGRST106)
const { data } = await supabaseAdmin
  .schema('dashboard')
  .from('users')
  .select('*');

// Depois (✅ Funciona)
const { data } = await supabaseAdmin
  .rpc('get_user_by_email', { p_email: email });
```

## Aplicar a Migration

Execute a migration no SQL Editor do Supabase Dashboard:

```sql
-- Execute o arquivo:
-- supabase/migrations/007_expose_dashboard_via_public_functions.sql
```

## Arquivos Atualizados

Todos os endpoints de autenticação foram atualizados para usar as funções:

- ✅ `src/app/api/dashboard/auth/signup/route.ts`
- ✅ `src/app/api/dashboard/auth/send-code/route.ts`
- ✅ `src/app/api/dashboard/auth/verify-code/route.ts`
- ✅ `src/app/api/dashboard/auth/me/route.ts`
- ✅ `src/app/api/dashboard/auth/logout/route.ts`

## Notas Importantes

1. **Funções retornam arrays**: As funções que retornam `TABLE` retornam arrays, mesmo quando há apenas um resultado. Sempre verifique `data.length > 0` e acesse `data[0]`.

2. **Security**: As funções usam `SECURITY DEFINER`, o que significa que executam com as permissões do criador da função (geralmente o superuser), permitindo acesso aos schemas protegidos.

3. **Performance**: Funções SQL podem ter pequeno overhead comparado a queries diretas, mas são necessárias devido às limitações do PostgREST.

4. **Alternativa Futura**: Se precisar expor o schema `dashboard` diretamente, será necessário configurar o PostgREST manualmente (não recomendado em Supabase gerenciado).

