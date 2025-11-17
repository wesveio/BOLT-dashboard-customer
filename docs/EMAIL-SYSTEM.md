# 📧 Sistema de Emails - Dashboard Customer

Documentação completa sobre o sistema de emails do dashboard-customer, incluindo tipos de emails, configuração, templates e fluxos de disparo.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Tipos de Emails](#tipos-de-emails)
- [Templates e Localização](#templates-e-localização)
- [Fluxos de Disparo](#fluxos-de-disparo)
- [Provedores Suportados](#provedores-suportados)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema de emails do dashboard-customer utiliza um serviço abstrato que suporta múltiplos provedores (Resend, SendGrid) e oferece templates responsivos com suporte a dark mode e múltiplos idiomas.

### Arquitetura

```
src/
├── utils/
│   ├── auth/
│   │   └── email-service.ts          # Serviço de email e templates de autenticação
│   └── contact/
│       └── email-templates.ts        # Templates de formulário de contato
└── app/
    └── api/
        ├── dashboard/
        │   ├── auth/
        │   │   ├── send-code/       # Envio de código de acesso
        │   │   └── signup/           # Notificação de nova conta
        │   └── users/
        │       ├── invite/           # Convite de usuário
        │       └── invitations/[id]/resend/  # Reenvio de convite
        └── public/
            └── contact/              # Formulário de contato
```

---

## Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no arquivo `.env.local`:

```bash
# Provedor de email: 'resend' ou 'sendgrid'
EMAIL_SERVICE_PROVIDER=resend

# API Key do provedor escolhido
EMAIL_SERVICE_API_KEY=re_xxxxxxxxxxxxx

# Email remetente (deve estar verificado no provedor)
EMAIL_SERVICE_FROM=noreply@bckstg.com

# Email para notificações internas (opcional)
CONTACT_EMAIL=hello@bckstg.com

# URL base da aplicação (para links em emails)
NEXT_PUBLIC_APP_URL=https://dashboard.bckstg.com
# ou
NEXT_PUBLIC_BASE_URL=https://dashboard.bckstg.com
```

### Configuração por Provedor

#### Resend

1. Crie uma conta em [Resend](https://resend.com)
2. Verifique seu domínio
3. Gere uma API Key
4. Configure `EMAIL_SERVICE_PROVIDER=resend`
5. Configure `EMAIL_SERVICE_API_KEY` com sua API Key
6. Configure `EMAIL_SERVICE_FROM` com um email verificado

#### SendGrid

1. Crie uma conta em [SendGrid](https://sendgrid.com)
2. Verifique seu domínio
3. Gere uma API Key
4. Configure `EMAIL_SERVICE_PROVIDER=sendgrid`
5. Configure `EMAIL_SERVICE_API_KEY` com sua API Key
6. Configure `EMAIL_SERVICE_FROM` com um email verificado

---

## Tipos de Emails

### 1. 📨 Código de Acesso (Passwordless Auth)

**Função**: `generateAccessCodeEmail()`

**Arquivo**: `src/utils/auth/email-service.ts`

**Endpoint**: `POST /api/dashboard/auth/send-code`

**Quando é disparado**: Quando um usuário solicita login via passwordless authentication.

**Destinatário**: Email do usuário que solicitou o código.

**Assuntos por idioma**:
- 🇺🇸 **EN**: `🚀 Your BOLT Access Code`
- 🇧🇷 **PT-BR**: `🚀 Seu Código de Acesso do BOLT`
- 🇪🇸 **ES**: `🚀 Su Código de Acceso del BOLT`

**Conteúdo**:
- Código de acesso de 6 dígitos
- Aviso de expiração (10 minutos)
- Nota de segurança sobre uso único
- Logo BOLT

**Características**:
- ✅ Suporte a dark mode
- ✅ Responsivo
- ✅ Código expira em 10 minutos
- ✅ Rate limiting: máximo 3 códigos por hora por email

**Exemplo de uso**:
```typescript
// Endpoint: POST /api/dashboard/auth/send-code
// Body: { email: "user@example.com" }
```

---

### 2. 👥 Convite de Usuário

**Função**: `generateInvitationEmail()`

**Arquivo**: `src/utils/auth/email-service.ts`

**Endpoints**:
- `POST /api/dashboard/users/invite` (novo convite)
- `POST /api/dashboard/users/invitations/[id]/resend` (reenvio)

**Quando é disparado**:
- Quando um owner/admin cria um novo convite para um usuário
- Quando um owner/admin reenvia um convite existente

**Destinatário**: Email do usuário convidado.

**Assuntos por idioma**:
- 🇺🇸 **EN**: `🚀 You've been invited to join BOLT`
- 🇧🇷 **PT-BR**: `🚀 Você foi convidado para o BOLT`
- 🇪🇸 **ES**: `🚀 Has sido invitado a unirte a BOLT`

**Conteúdo**:
- Link de aceitação do convite (único por token)
- Nome do usuário que enviou o convite
- Role atribuída (Owner, Admin, Editor, Viewer)
- Aviso de expiração (24 horas)
- Logo BOLT

**Características**:
- ✅ Suporte a dark mode
- ✅ Responsivo
- ✅ Link único e seguro
- ✅ Expira em 24 horas
- ✅ Botão de ação destacado

**Roles suportados**:
- `owner` → Proprietário / Owner / Propietario
- `admin` → Administrador / Administrator / Administrador
- `editor` → Editor / Editor / Editor
- `viewer` → Visualizador / Viewer / Visualizador

**Exemplo de uso**:
```typescript
// Endpoint: POST /api/dashboard/users/invite
// Body: { 
//   email: "newuser@example.com",
//   role: "editor"
// }
```

---

### 3. 🤩 Notificação de Nova Conta

**Função**: `generateNewAccountNotificationEmail()`

**Arquivo**: `src/utils/auth/email-service.ts`

**Endpoint**: `POST /api/dashboard/auth/signup`

**Quando é disparado**: Quando um novo usuário cria uma conta no sistema.

**Destinatário**: Email configurado em `CONTACT_EMAIL` ou `EMAIL_SERVICE_FROM` (equipe/admin).

**Assunto**: `[🤩 NEW ACCOUNT 🤩] New Account Created: {company_name}`

**Conteúdo**:
- **Informações da Conta**:
  - Account ID
  - Company Name
  - VTEX Account Name
  - Plan Type
  - Status
  - Demo Mode
  - Onboarding Required
  - Created At
- **Informações do Usuário**:
  - User ID
  - Email
  - Full Name
  - First Name
  - Last Name
  - Role
  - Created At

**Características**:
- ✅ Suporte a dark mode
- ✅ Responsivo
- ✅ Formatação de datas legível
- ✅ Layout em tabela organizada
- ✅ Idioma: Inglês (EN)

**Nota**: Este email é enviado de forma não-bloqueante. Se falhar, não impede o signup do usuário.

**Exemplo de uso**:
```typescript
// Endpoint: POST /api/dashboard/auth/signup
// Body: {
//   email: "user@example.com",
//   firstName: "John",
//   lastName: "Doe",
//   companyName: "Example Corp",
//   vtexAccountName: "examplecorp",
//   ...
// }
```

---

### 4. 📧 Notificação de Formulário de Contato

**Função**: `generateContactEmail()` (modo notificação)

**Arquivo**: `src/utils/contact/email-templates.ts`

**Endpoint**: `POST /api/public/contact`

**Quando é disparado**: Quando alguém preenche e envia o formulário de contato público.

**Destinatário**: Email configurado em `CONTACT_EMAIL` ou `EMAIL_SERVICE_FROM` (equipe/admin).

**Assuntos por idioma**:
- 🇺🇸 **EN**: `📧 New Contact Form Submission - BOLT`
- 🇧🇷 **PT-BR**: `📧 Novo Contato do Formulário - BOLT`
- 🇪🇸 **ES**: `📧 Nuevo Contacto del Formulario - BOLT`

**Assunto especial**: Se `source=enterprise`, o assunto inclui prefixo:
- `🟢 ENTERPRISE 🟢 | 📧 New Contact Form Submission - BOLT`

**Conteúdo**:
- Nome do contato
- Email (link clicável)
- Empresa (se fornecido)
- Telefone (se fornecido, link clicável)
- Mensagem
- Flag "Wants Demo" (se marcado)

**Características**:
- ✅ Suporte a dark mode
- ✅ Responsivo
- ✅ Rate limiting: máximo 3 envios por 15 minutos por IP
- ✅ Destaque para pedidos de demo
- ✅ Links clicáveis para email e telefone

**Exemplo de uso**:
```typescript
// Endpoint: POST /api/public/contact
// Body: {
//   name: "John Doe",
//   email: "john@example.com",
//   company: "Example Corp",
//   phone: "+1234567890",
//   message: "Interested in learning more...",
//   wantsDemo: true,
//   source: "enterprise" // opcional
// }
```

---

### 5. ✅ Confirmação de Formulário de Contato

**Função**: `generateContactEmail()` (modo confirmação)

**Arquivo**: `src/utils/contact/email-templates.ts`

**Endpoint**: `POST /api/public/contact` (opcional)

**Quando é disparado**: Após o envio bem-sucedido do formulário de contato (se habilitado).

**Destinatário**: Email do usuário que preencheu o formulário.

**Assuntos por idioma**:
- 🇺🇸 **EN**: `✅ We received your message - BOLT`
- 🇧🇷 **PT-BR**: `✅ Recebemos sua mensagem - BOLT`
- 🇪🇸 **ES**: `✅ Recibimos tu mensaje - BOLT`

**Conteúdo**:
- Mensagem de agradecimento personalizada
- Confirmação de recebimento
- Tempo de resposta esperado (24 horas)
- Destaque se pediu demo
- Informações de contato para urgências

**Características**:
- ✅ Suporte a dark mode
- ✅ Responsivo
- ✅ Mensagem personalizada com nome do usuário
- ✅ Não bloqueia o envio se falhar

**Nota**: Este email é opcional e não bloqueia o processo se falhar. O erro é apenas logado.

---

## Templates e Localização

### Estrutura dos Templates

Todos os templates seguem uma estrutura consistente:

1. **Logo BOLT** - SVG inline com suporte a dark mode
2. **Cabeçalho** - Título e saudação
3. **Conteúdo principal** - Informações específicas do email
4. **Ações** - Botões ou links quando aplicável
5. **Notas de segurança** - Avisos sobre expiração, segurança, etc.
6. **Rodapé** - Informações de contato e branding

### Suporte a Dark Mode

Todos os templates incluem:
- Media query `@media (prefers-color-scheme: dark)`
- Cores adaptáveis para modo claro/escuro
- Contraste adequado para acessibilidade

### Idiomas Suportados

| Idioma | Código | Status |
|--------|--------|--------|
| Inglês | `en` | ✅ Completo |
| Português (Brasil) | `pt-BR` | ✅ Completo |
| Espanhol | `es` | ✅ Completo |

**Detecção de idioma**:
1. Preferências do usuário (settings)
2. Header `x-locale` da requisição
3. Locale padrão da aplicação

---

## Fluxos de Disparo

### Fluxo 1: Login Passwordless

```
Usuário → POST /api/dashboard/auth/send-code
  ↓
Validação de email
  ↓
Rate limiting check (3/hora)
  ↓
Geração de código (6 dígitos)
  ↓
Hash e armazenamento no DB
  ↓
Geração de template de email
  ↓
Envio via email service
  ↓
Resposta de sucesso
```

**Arquivo**: `src/app/api/dashboard/auth/send-code/route.ts`

---

### Fluxo 2: Convite de Usuário

```
Owner/Admin → POST /api/dashboard/users/invite
  ↓
Validação de permissões
  ↓
Criação de invitation no DB
  ↓
Geração de token único
  ↓
Geração de template de email
  ↓
Envio via email service
  ↓
Resposta com dados do convite
```

**Arquivo**: `src/app/api/dashboard/users/invite/route.ts`

**Reenvio**:
```
Owner/Admin → POST /api/dashboard/users/invitations/[id]/resend
  ↓
Validação de permissões
  ↓
Atualização de invitation (novo token)
  ↓
Geração de template de email
  ↓
Envio via email service
  ↓
Resposta com dados atualizados
```

**Arquivo**: `src/app/api/dashboard/users/invitations/[id]/resend/route.ts`

---

### Fluxo 3: Signup de Nova Conta

```
Usuário → POST /api/dashboard/auth/signup
  ↓
Validação de dados
  ↓
Criação de account no DB
  ↓
Criação de user no DB
  ↓
[PARALELO] Envio de notificação (não-bloqueante)
  ↓
Geração de template de email
  ↓
Envio via email service
  ↓
Log de sucesso/erro (não afeta signup)
  ↓
Resposta com dados do usuário
```

**Arquivo**: `src/app/api/dashboard/auth/signup/route.ts`

---

### Fluxo 4: Formulário de Contato

```
Usuário → POST /api/public/contact
  ↓
Validação de dados
  ↓
Rate limiting check (3/15min por IP)
  ↓
Geração de template de notificação
  ↓
Envio para equipe (bloqueante)
  ↓
[OPCIONAL] Geração de template de confirmação
  ↓
[OPCIONAL] Envio para usuário (não-bloqueante)
  ↓
Resposta de sucesso
```

**Arquivo**: `src/app/api/public/contact/route.ts`

---

## Provedores Suportados

### Resend

**Classe**: `ResendEmailService`

**Endpoint**: `https://api.resend.com/emails`

**Formato de requisição**:
```json
{
  "from": "noreply@bckstg.com",
  "to": "user@example.com",
  "subject": "Subject",
  "html": "<html>...</html>",
  "text": "Plain text version"
}
```

**Vantagens**:
- ✅ API simples e direta
- ✅ Boa documentação
- ✅ Suporte a React Email (futuro)

---

### SendGrid

**Classe**: `SendGridEmailService`

**Endpoint**: `https://api.sendgrid.com/v3/mail/send`

**Formato de requisição**:
```json
{
  "from": { "email": "noreply@bckstg.com" },
  "personalizations": [{
    "to": [{ "email": "user@example.com" }],
    "subject": "Subject"
  }],
  "content": [
    { "type": "text/html", "value": "<html>...</html>" },
    { "type": "text/plain", "value": "Plain text version" }
  ]
}
```

**Vantagens**:
- ✅ Infraestrutura robusta
- ✅ Analytics avançados
- ✅ Suporte a templates dinâmicos

---

## Troubleshooting

### Email não está sendo enviado

1. **Verifique as variáveis de ambiente**:
   ```bash
   echo $EMAIL_SERVICE_PROVIDER
   echo $EMAIL_SERVICE_API_KEY
   echo $EMAIL_SERVICE_FROM
   ```

2. **Verifique os logs do servidor**:
   - Procure por `❌ [DEBUG] Email service error:`
   - Procure por `✅ [DEBUG] Email sent successfully`

3. **Teste a API do provedor diretamente**:
   ```bash
   # Resend
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer $EMAIL_SERVICE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"from":"noreply@bckstg.com","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
   ```

4. **Verifique se o domínio está verificado** no provedor

5. **Verifique rate limits** do provedor

---

### Email está sendo enviado mas não chega

1. **Verifique a caixa de spam**
2. **Verifique se o email destinatário está correto**
3. **Verifique logs do provedor** (Resend Dashboard, SendGrid Activity)
4. **Verifique se o domínio remetente está verificado**
5. **Teste com outro email**

---

### Template não está renderizando corretamente

1. **Verifique suporte a HTML** do cliente de email
2. **Teste em diferentes clientes** (Gmail, Outlook, Apple Mail)
3. **Verifique se o SVG está sendo renderizado** (alguns clientes não suportam)
4. **Use versão text** como fallback

---

### Rate Limiting

**Código de Acesso**:
- Máximo: 3 códigos por hora por email
- Erro: `429 Too many requests`

**Formulário de Contato**:
- Máximo: 3 envios por 15 minutos por IP
- Erro: `429 Too many requests`

**Solução**: Aguarde o período de rate limit ou ajuste os limites no código.

---

## Melhores Práticas

### ✅ Fazer

- ✅ Sempre incluir versão text dos emails
- ✅ Testar templates em múltiplos clientes de email
- ✅ Usar rate limiting para prevenir abuso
- ✅ Logar erros sem expor informações sensíveis
- ✅ Não bloquear fluxos críticos por falhas de email
- ✅ Validar emails antes de enviar
- ✅ Usar variáveis de ambiente para configuração

### ❌ Evitar

- ❌ Não expor erros detalhados ao cliente
- ❌ Não bloquear signup/login por falha de email
- ❌ Não enviar emails sem validação
- ❌ Não hardcodar configurações
- ❌ Não ignorar rate limits
- ❌ Não enviar informações sensíveis em emails

---

## Estrutura de Arquivos

```
src/
├── utils/
│   ├── auth/
│   │   └── email-service.ts              # Serviço e templates de auth
│   └── contact/
│       └── email-templates.ts            # Templates de contato
└── app/
    └── api/
        ├── dashboard/
        │   ├── auth/
        │   │   ├── send-code/
        │   │   │   └── route.ts          # Endpoint de código de acesso
        │   │   └── signup/
        │   │       └── route.ts          # Endpoint de signup
        │   └── users/
        │       ├── invite/
        │       │   └── route.ts          # Endpoint de convite
        │       └── invitations/[id]/resend/
        │           └── route.ts          # Endpoint de reenvio
        └── public/
            └── contact/
                └── route.ts             # Endpoint de contato
```

---

## Referências

- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Email HTML Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding/)
- [Dark Mode in Email](https://www.emailonacid.com/blog/article/email-development/email-development-dark-mode-support-in-email/)

---

## Changelog

### v1.0.0 (Atual)
- ✅ Suporte a Resend e SendGrid
- ✅ 5 tipos de emails implementados
- ✅ Suporte a 3 idiomas (EN, PT-BR, ES)
- ✅ Dark mode em todos os templates
- ✅ Rate limiting implementado
- ✅ Templates responsivos

---

**Última atualização**: 2024

