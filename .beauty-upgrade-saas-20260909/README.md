# AgendaPro

Sistema web de gestão para empresas que trabalham com horários e atendimentos,
como consultórios, salões, barbearias, clínicas e prestadores de serviço.

## Tecnologias

- React 19 e TypeScript
- Vite 8
- Supabase (Auth, PostgreSQL e RLS)
- TanStack React Query
- React Router
- Sonner e React Error Boundary

## Preparação do ambiente

1. Instale as dependências:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e informe os dados públicos do seu
   projeto Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

Use somente a chave publicável no navegador. Chaves secretas e `service_role`
nunca devem ser adicionadas ao projeto React.

3. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

## Comandos

```bash
npm run dev        # servidor local
npm run typecheck  # valida os tipos TypeScript
npm run lint       # executa o ESLint
npm run build      # gera o build de produção
npm run check      # executa todas as verificações acima
npm run db:types   # atualiza os tipos do banco Supabase
```

## Organização principal

```text
src/
├── components_shared/  # componentes reutilizáveis e layout
├── features/
│   ├── auth/           # sessão, login e vínculo com a empresa
│   └── access/         # assinatura, plano, cargo e permissões
├── pages/              # módulos e páginas da aplicação
├── supabase/           # cliente tipado do Supabase
└── types/              # tipos gerados a partir do banco
```

## Componentes reutilizáveis

Os componentes visuais compartilhados ficam em `src/components_shared` e podem
ser importados pelo arquivo central da pasta:

```tsx
import {
  DataTable,
  EmptyState,
  Modal,
  Pagination,
  TextField,
} from '../../components_shared'
```

A pasta está separada por responsabilidade: `overlay` para modais, `forms` para
campos e máscaras, `data` para tabelas e paginação, `filters` para busca e
filtros e `feedback` para loading, skeleton, erros e estados vazios. Exemplos e
as principais propriedades estão documentados em
`src/components_shared/README.md`.

O `FileUpload` seleciona e valida arquivos no navegador. O envio ao Supabase
Storage deve ser feito pelo serviço do módulo que estiver usando o componente.

## Autorização

O acesso a um módulo depende de duas verificações:

1. a funcionalidade precisa estar ativa em `permissoes_planos` para o plano da
   empresa;
2. o cargo em `usuarios_empresas.tipo` precisa permitir o módulo.

A interface esconde os módulos não permitidos e as rotas também são protegidas.
As políticas RLS do Supabase continuam sendo a camada de segurança responsável
por impedir acesso direto e indevido aos dados.

## Primeiro commit

O repositório local utiliza a branch `main`. Antes de publicar, revise os
arquivos e crie o primeiro commit:

```bash
git status
git add .
git commit -m "feat: estrutura inicial do AgendaPro"
```
