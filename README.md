# Sistema Retífica

Sistema de gestão para retíficas, desenvolvido com React 19, TypeScript, Vite e Supabase.

## Configuração local

Requisitos: Node.js 22.18.0 (ou outra versão 22 a partir da 22.12) e npm 10.9 ou superior.

```bash
npm ci
```

Copie `.env.example` para `.env` e preencha as credenciais públicas do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Valide o projeto antes de publicar:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

O build de produção inclui PWA e divisão de código por rota. O arquivo `.env` não deve ser versionado; somente a chave pública `anon` do Supabase pertence ao frontend.

## Supabase e migrations

O esquema remoto fica versionado em `supabase/migrations/`. Depois de autenticar e
vincular o CLI ao projeto, valide qualquer alteração primeiro no banco local:

```bash
npx supabase start
npx supabase db reset --local
npx supabase test db --local supabase/tests
npx supabase db lint --local --level warning
```

Para atualizar os tipos TypeScript após uma migration:

```bash
npx supabase gen types --linked --lang=typescript --schema public > src/types/database.types.ts
```

O fluxo de criação, edição e exclusão de ordens de serviço usa RPCs transacionais
no PostgreSQL. Assim, a OS, seus itens e o estoque são confirmados ou revertidos
juntos. Nunca edite o banco de produção manualmente sem registrar a mudança em
uma migration.
