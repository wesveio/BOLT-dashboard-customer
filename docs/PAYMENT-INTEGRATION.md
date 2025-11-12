# Payment Integration Documentation

## Overview

Sistema completo de integração de pagamentos com suporte a assinaturas, regionalização de preços (USD/BRL) e múltiplos payment gateways através de uma camada de abstração.

## Arquitetura

### Camada de Abstração

O sistema foi projetado com uma camada de abstração que permite trocar facilmente entre diferentes payment gateways:

```
IPaymentGateway (Interface)
    ↓
BasePaymentGateway (Classe Base)
    ↓
StripeGateway (Implementação Stripe)
    ↓
PaymentGatewayFactory (Factory Pattern)
```

### Componentes Principais

1. **Payment Gateway Abstraction** (`src/lib/payments/`)
   - `types.ts` - Interfaces e tipos
   - `base-gateway.ts` - Classe base com funcionalidades comuns
   - `payment-gateway-factory.ts` - Factory para criar gateways
   - `gateways/stripe-gateway.ts` - Implementação Stripe
   - `gateways/stripe-error-mapper.ts` - Mapeamento de erros Stripe

2. **Error Handling** (`src/lib/payments/error-handler.ts`)
   - Retry automático com backoff exponencial
   - Mensagens amigáveis ao usuário
   - Identificação de erros retryáveis
   - Validação de ambiente

3. **Currency Service** (`src/lib/payments/currency-service.ts`)
   - Conversão USD ↔ BRL
   - Regionalização de preços
   - Formatação de valores

4. **APIs Backend**
   - `/api/dashboard/subscriptions/checkout` - Cria payment intent
   - `/api/dashboard/subscriptions` - Cria/gerencia subscriptions
   - `/api/dashboard/subscriptions/[id]/cancel` - Cancela subscription
   - `/api/dashboard/subscriptions/transactions/[id]` - Detalhes da transação
   - `/api/webhooks/stripe` - Handler de webhooks
   - `/api/dashboard/plans?currency=USD|BRL` - Planos com regionalização

5. **Componentes Frontend**
   - `PaymentForm.tsx` - Formulário de pagamento com Stripe Elements
   - `TransactionDetailsModal.tsx` - Modal com detalhes da transação
   - `CancelSubscriptionModal.tsx` - Modal para cancelar subscription
   - `SubscriptionHistory.tsx` - Histórico com transações clicáveis

## Configuração

### Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Payment Gateway
PAYMENT_GATEWAY_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DEFAULT_PAYMENT_CURRENCY=USD
SUPPORTED_CURRENCIES=USD,BRL
```

### Banco de Dados

Execute a migration:

```bash
npm run migrate
```

A migration `068_add_payment_gateway_fields.sql` adiciona os campos necessários:
- `payment_provider`
- `payment_intent_id`
- `payment_method_id`
- `gateway_subscription_id`
- `gateway_customer_id`
- `gateway_invoice_id`
- `receipt_url`
- `invoice_url`

### Webhook Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Adicione endpoint: `https://seu-dominio.com/api/webhooks/stripe`
3. Selecione eventos:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
4. Copie o "Signing secret" para `STRIPE_WEBHOOK_SECRET`

## Fluxo de Pagamento

### 1. Seleção de Plano

```typescript
// Usuário seleciona plano na página /dashboard/plans
handlePlanSelect(plan) → {
  if (plan.monthly_price > 0) {
    // Mostra PaymentForm
  } else {
    // Plano gratuito, cria subscription diretamente
  }
}
```

### 2. Processamento de Pagamento

```typescript
// PaymentForm cria payment intent
POST /api/dashboard/subscriptions/checkout
  → Cria customer no Stripe (se não existir)
  → Cria payment intent
  → Retorna client_secret

// Usuário confirma pagamento
stripe.confirmCardPayment(client_secret, { payment_method })
  → Pagamento processado
  → onSuccess(payment_intent_id)
```

### 3. Criação de Subscription

```typescript
// Após pagamento bem-sucedido
POST /api/dashboard/subscriptions
  → Cria subscription no Stripe
  → Cria subscription no banco
  → Cria transaction record
  → Retorna subscription criada
```

### 4. Webhooks

```typescript
// Stripe envia webhook
POST /api/webhooks/stripe
  → Verifica assinatura
  → Processa evento
  → Atualiza banco de dados
  → Retorna confirmação
```

## Regionalização de Preços

### Conversão de Moedas

```typescript
// API aceita parâmetro currency
GET /api/dashboard/plans?currency=BRL

// Service converte automaticamente
convertCurrency(amount, 'USD', 'BRL')
  → Retorna preço convertido
```

### Taxas de Câmbio

As taxas são configuradas em `currency-service.ts`. Em produção, implemente:

```typescript
async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Integrar com API de câmbio (ex: exchangerate-api.com)
}
```

## Tratamento de Erros

### Retry Automático

Erros retryáveis são automaticamente tentados novamente com backoff exponencial:

- Erros de rede (ECONNRESET, ETIMEDOUT, etc.)
- Erros de API (500, 502, 503, 504)
- Rate limits (429)

### Mensagens Amigáveis

Erros são mapeados para mensagens amigáveis:

```typescript
card_declined → "Your card was declined. Please try a different payment method."
expired_card → "Your card has expired. Please use a different card."
insufficient_funds → "Your card has insufficient funds..."
```

## Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Com coverage
npm run test:coverage

# Apenas testes de payments
npm test src/lib/payments
```

### Cobertura

- ✅ Currency Service (15+ testes)
- ✅ Error Handler (20+ testes)
- ✅ Stripe Error Mapper (10+ testes)
- ✅ Payment Gateway Factory (5+ testes)
- ✅ Payment Flow Integration (10+ testes)

## Adicionar Novo Payment Gateway

Para adicionar um novo gateway (ex: Paddle):

1. **Criar implementação**:
```typescript
// src/lib/payments/gateways/paddle-gateway.ts
export class PaddleGateway extends BasePaymentGateway {
  // Implementar IPaymentGateway
}
```

2. **Atualizar factory**:
```typescript
// src/lib/payments/payment-gateway-factory.ts
case 'paddle':
  return new PaddleGateway(config);
```

3. **Adicionar variáveis de ambiente**:
```env
PADDLE_API_KEY=...
PADDLE_VENDOR_ID=...
```

## Segurança

### PCI Compliance

- ✅ Dados de cartão nunca tocam nossos servidores
- ✅ Stripe Elements para coleta segura (SAQ A)
- ✅ Webhooks verificados com assinatura
- ✅ Chaves secretas apenas no servidor

### Validações

- ✅ Validação de assinatura de webhook
- ✅ Verificação de idempotência
- ✅ Validação de sessão do usuário
- ✅ Verificação de propriedade de recursos

## Monitoramento

### Logs

Todos os erros são logados com formato consistente:

```
❌ [DEBUG] [PaymentGateway:stripe] Error in createSubscription
✅ [DEBUG] [PaymentGateway:stripe] Stripe customer created
⚠️ [DEBUG] Retry attempt 1/3 after 1000ms
```

### Métricas Recomendadas

- Taxa de sucesso de pagamentos
- Tempo médio de processamento
- Taxa de retry
- Erros por tipo
- Conversão de moedas

## Troubleshooting

### Pagamento Falha

1. Verificar logs do servidor
2. Verificar logs do Stripe Dashboard
3. Verificar se webhook está configurado
4. Verificar variáveis de ambiente

### Webhook Não Processa

1. Verificar `STRIPE_WEBHOOK_SECRET`
2. Verificar URL do webhook no Stripe
3. Verificar eventos selecionados
4. Verificar logs de idempotência

### Conversão de Moeda Incorreta

1. Verificar taxas em `currency-service.ts`
2. Implementar API de câmbio em produção
3. Verificar formato de moeda (ISO 4217)

## Próximos Passos

- [ ] Implementar API de câmbio em tempo real
- [ ] Adicionar suporte a Paddle
- [ ] Implementar testes E2E
- [ ] Adicionar métricas e monitoramento
- [ ] Implementar notificações por email
- [ ] Adicionar suporte a mais moedas

## Referências

- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Elements](https://stripe.com/docs/stripe-js/react)
- [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)

