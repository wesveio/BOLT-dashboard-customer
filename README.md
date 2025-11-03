# Dashboard Cliente BOLT

Dashboard completa para clientes BOLT com analytics, performance, insights e editor WYSIWYG de temas.

## Features

- 📊 **Analytics & Performance** - Métricas detalhadas do checkout
- 💰 **Revenue Dashboard** - Visão completa de vendas e receita
- 🎨 **Theme Editor (WYSIWYG)** - Customização visual de temas
- 🔐 **Passwordless Authentication** - Autenticação sem senha via código por email
- 🌍 **Multi-language Support** - Suporte a múltiplos idiomas (EN, PT-BR, ES)
- 👥 **Role-Based Access Control** - Sistema de roles e permissões
- ⚡ **Real-time Updates** - Atualizações em tempo real via Supabase Realtime

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: HeroUI, Tailwind CSS, Framer Motion
- **Database**: Supabase (PostgreSQL + TimescaleDB)
- **Data Fetching**: TanStack Query v5
- **Charts**: Recharts
- **i18n**: next-intl
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Supabase account and project
- Email service API key (Resend, SendGrid, or AWS SES)

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Fill in your environment variables in `.env.local`:
- Supabase URL and keys
- Email service configuration
- Auth configuration

4. Run database migrations:
```bash
# Apply Supabase migrations (see supabase/migrations/)
```

5. Start development server:
```bash
yarn dev
```

The dashboard runs on **port 3001** by default.

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Port Configuration

- **Checkout App**: Runs on port **3000**
- **Dashboard App**: Runs on port **3001**

To run both applications simultaneously:

```bash
# Terminal 1 - Checkout (port 3000)
cd bckstg-checkout
yarn dev

# Terminal 2 - Dashboard (port 3001)
cd dashboard-customer
yarn dev
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # i18n routing
│   │   └── dashboard/     # Dashboard pages
│   └── api/               # API routes
├── components/
│   └── Dashboard/         # Dashboard components
├── lib/
│   └── supabase.ts        # Supabase client
├── i18n/
│   ├── messages/          # Translation files
│   └── config.ts          # i18n configuration
└── utils/
    ├── auth/              # Auth utilities
    └── dashboard/          # Dashboard utilities
```

## Environment Variables

See `.env.local.example` for all required environment variables.

## Documentation

- [Design Style Guide](../bckstg-checkout/docs/DESIGN-STYLE-GUIDE.md) - Follow the design system
- [Design Quick Reference](../bckstg-checkout/docs/DESIGN-QUICK-REFERENCE.md) - Quick reference for common patterns

## License

This project is licensed under the MIT License.

