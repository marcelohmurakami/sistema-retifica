begin;
set local role postgres;
set local search_path = extensions, public, pg_catalog;

select extensions.plan(9);

select extensions.is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  ),
  0,
  'todas as tabelas public usam RLS'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.clientes', 'SELECT'),
  'anon não consulta clientes diretamente'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.agendamentos', 'SELECT'),
  'anon não consulta agendamentos diretamente'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.pagamentos', 'SELECT'),
  'anon não consulta pagamentos diretamente'
);
select extensions.ok(
  has_table_privilege('anon', 'public.planos', 'SELECT'),
  'anon consulta somente planos públicos sob RLS'
);
select extensions.ok(
  has_function_privilege('anon', 'public.obter_catalogo_site(bigint)', 'EXECUTE'),
  'anon executa catálogo público'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.listar_usuarios_administracao(bigint)', 'EXECUTE'),
  'anon não executa RPC administrativa'
);
select extensions.is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.prorettype <> 'trigger'::regtype
  ),
  0,
  'nenhuma RPC SECURITY DEFINER fica no schema exposto'
);
select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.vincular_cliente_site(uuid)',
    'EXECUTE'
  ),
  'cliente autenticado pode iniciar associação segura da própria conta'
);

select * from extensions.finish();
rollback;
