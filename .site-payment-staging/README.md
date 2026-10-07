# Site público de agendamento

Site Next.js multiempresa por domínio/slug. A identidade continua exclusiva para cada cliente, mas empresa, unidade, serviços, profissionais, horários, avaliações autorizadas e conteúdo editorial são carregados do Supabase.

## Ambiente local

Copie `.env.example` para `.env.local`, preencha a URL e a chave publicável do Supabase e execute:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. O domínio `localhost` deve estar cadastrado na aba **Configurações → Site público** do painel. `SUPABASE_SITE_SLUG` é um fallback útil para preview; em produção, o domínio cadastrado no banco é a fonte principal.

## Segurança

O navegador não usa `service_role`. A página pública acessa somente RPCs liberadas para `anon`, e o Supabase filtra os campos publicados. Alterações editoriais são feitas por usuário autenticado no painel e protegidas por RLS.

## Validação

```bash
npm run lint
npm run build
```
