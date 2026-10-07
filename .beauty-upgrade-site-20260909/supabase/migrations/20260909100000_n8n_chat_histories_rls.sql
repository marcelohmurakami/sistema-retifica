-- A tabela é usada pelo Postgres Chat Memory do n8n, que se conecta pelo
-- servidor. Ela não deve ficar acessível diretamente a visitantes ou clientes.
alter table if exists public.n8n_chat_histories enable row level security;

revoke all on table public.n8n_chat_histories from anon, authenticated;

comment on table public.n8n_chat_histories is
  'Memória interna do n8n: acesso somente por credencial de servidor.';
