begin;

create extension if not exists pgtap with schema extensions;

select plan(19);

select has_function(
  'public',
  'salvar_ordem_servico',
  array['jsonb', 'jsonb', 'integer'],
  'RPC de criação e edição de OS existe'
);

select has_function(
  'public',
  'excluir_ordem_servico',
  array['integer'],
  'RPC de exclusão de OS existe'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'empresas'
      and policyname = 'ALL EMPRESAS'
  ),
  'política global de empresas foi removida'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'usuarios_empresas'
      and policyname = 'ALL USUARIOSEMPRESAS'
  ),
  'política global de vínculos foi removida'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'Estoque'
      and policyname = 'Estoque select usuarios da empresa'
      and qual <> 'true'
  ),
  'estoque está isolado por empresa'
);

select ok(
  (
    select 'security_invoker=true' = any(coalesce(c.reloptions, array[]::text[]))
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'auditoria_com_usuario'
  ),
  'view de auditoria respeita RLS'
);

select ok(
  (
    select 'security_invoker=true' = any(coalesce(c.reloptions, array[]::text[]))
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'vw_contas_pagar'
  ),
  'view financeira respeita RLS'
);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'teste@example.com',
  '',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

insert into public.empresas (id, nome)
values
  ('22222222-2222-2222-2222-222222222222', 'Empresa do teste'),
  ('33333333-3333-3333-3333-333333333333', 'Outra empresa');

insert into public.usuarios_empresas (
  user_id,
  empresa_id,
  nome,
  role,
  ativo
)
values (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Usuário Teste',
  'admin',
  true
);

insert into public."Clientes" (cliente, empresa_id)
values ('Cliente Teste', '22222222-2222-2222-2222-222222222222');

insert into public."Estoque" (nome, valor, "qtdEstoque", empresa_id)
values
  ('Peça Teste', 100, 10, '22222222-2222-2222-2222-222222222222'),
  ('Peça de Outra Empresa', 999, 5, '33333333-3333-3333-3333-333333333333');

insert into public."Servicos" (servico, valor, tipo, empresa_id)
values (
  'Serviço Teste',
  500,
  'servico',
  '22222222-2222-2222-2222-222222222222'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);

select lives_ok(
  $test$
    select public.salvar_ordem_servico(
      jsonb_build_object(
        'idCliente', (select id from public."Clientes" where cliente = 'Cliente Teste'),
        'dataServico', '2026-07-23',
        'dataVencimento', '2026-07-30',
        'formaPagamento', 'Pix',
        'veículo', 'Veículo Teste',
        'motor', 'Motor Teste',
        'obs', '',
        'servicosRealizados', 'Serviço Teste',
        'pecasTrocadas', 'Peça Teste'
      ),
      jsonb_build_array(
        jsonb_build_object(
          'servicoId', (
            select id from public."Servicos" where servico = 'Serviço Teste'
          ),
          'produtoEstoqueId', null,
          'descricao', 'Serviço Teste',
          'valor', 500,
          'quantidade', 1,
          'tipo', 'servico',
          'manual', false
        ),
        jsonb_build_object(
          'servicoId', null,
          'produtoEstoqueId', (
            select id from public."Estoque" where nome = 'Peça Teste'
          ),
          'descricao', 'Peça Teste',
          'valor', 100,
          'quantidade', 2,
          'tipo', 'peca',
          'manual', false
        )
      ),
      null
    )
  $test$,
  'cria OS e movimenta estoque em uma transação'
);

select is(
  (select "qtdEstoque"::integer from public."Estoque" where nome = 'Peça Teste'),
  8,
  'criação baixa a quantidade do estoque'
);

select is(
  (
    select "valorServico"::integer
    from public."OrdensDeServiço"
    where motor = 'Motor Teste'
  ),
  700,
  'total da OS é calculado no banco'
);

select is(
  (
    select count(*)::integer
    from public."itensOS"
    where id_os = (
      select id from public."OrdensDeServiço" where motor = 'Motor Teste'
    )
  ),
  2,
  'itens são gravados junto com a OS'
);

select is(
  (select count(*)::integer from public."Estoque"),
  1,
  'usuário não enxerga estoque de outra empresa'
);

select is(
  (select count(*)::integer from public.usuarios_empresas),
  1,
  'usuário enxerga apenas o próprio vínculo'
);

select lives_ok(
  $test$
    select public.salvar_ordem_servico(
      jsonb_build_object(
        'idCliente', (select id from public."Clientes" where cliente = 'Cliente Teste'),
        'dataServico', '2026-07-23',
        'dataVencimento', '2026-07-30',
        'formaPagamento', 'Pix',
        'veículo', 'Veículo Teste',
        'motor', 'Motor Teste',
        'obs', 'Editada',
        'servicosRealizados', 'Serviço Teste',
        'pecasTrocadas', 'Peça Teste'
      ),
      jsonb_build_array(
        jsonb_build_object(
          'servicoId', (
            select id from public."Servicos" where servico = 'Serviço Teste'
          ),
          'produtoEstoqueId', null,
          'descricao', 'Serviço Teste',
          'valor', 500,
          'quantidade', 1,
          'tipo', 'servico',
          'manual', false
        ),
        jsonb_build_object(
          'servicoId', null,
          'produtoEstoqueId', (
            select id from public."Estoque" where nome = 'Peça Teste'
          ),
          'descricao', 'Peça Teste',
          'valor', 100,
          'quantidade', 3,
          'tipo', 'peca',
          'manual', false
        )
      ),
      (select id from public."OrdensDeServiço" where motor = 'Motor Teste')
    )
  $test$,
  'edita OS e aplica somente a diferença no estoque'
);

select is(
  (select "qtdEstoque"::integer from public."Estoque" where nome = 'Peça Teste'),
  7,
  'edição ajusta estoque pela diferença'
);

select is(
  (
    select "valorServico"::integer
    from public."OrdensDeServiço"
    where motor = 'Motor Teste'
  ),
  800,
  'edição recalcula o total no banco'
);

select lives_ok(
  $test$
    select public.excluir_ordem_servico(
      (select id from public."OrdensDeServiço" where motor = 'Motor Teste')
    )
  $test$,
  'exclui OS e restaura estoque na mesma transação'
);

select is(
  (select "qtdEstoque"::integer from public."Estoque" where nome = 'Peça Teste'),
  10,
  'exclusão devolve as peças ao estoque'
);

select is(
  (select count(*)::integer from public."OrdensDeServiço"),
  0,
  'OS foi excluída'
);

select * from finish();

rollback;
