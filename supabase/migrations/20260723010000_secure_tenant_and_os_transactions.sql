-- Corrige o isolamento entre empresas e move a gravação de OS/estoque para
-- transações atômicas executadas no PostgreSQL.

drop policy if exists "ALL EMPRESAS" on public.empresas;
drop policy if exists "ALL USUARIOSEMPRESAS" on public.usuarios_empresas;
drop policy if exists "Estoque select usuarios da empresa" on public."Estoque";

create policy "usuarios_empresas select proprio vinculo"
on public.usuarios_empresas
for select
to authenticated
using (user_id = auth.uid());

create policy "Estoque select usuarios da empresa"
on public."Estoque"
for select
to authenticated
using (
  empresa_id in (
    select ue.empresa_id
    from public.usuarios_empresas as ue
    where ue.user_id = auth.uid()
      and ue.ativo = true
  )
);

-- Views devem respeitar as políticas RLS do usuário que executa a consulta.
alter view public.auditoria_com_usuario set (security_invoker = true);
alter view public.vw_contas_pagar set (security_invoker = true);

revoke all on public.auditoria_com_usuario from anon;
revoke all on public.vw_contas_pagar from anon;
grant select on public.auditoria_com_usuario to authenticated;
grant select on public.vw_contas_pagar to authenticated;

-- Índices usados em praticamente todas as políticas e consultas multiempresa.
create index if not exists clientes_empresa_id_idx
  on public."Clientes" (empresa_id);
create index if not exists estoque_empresa_id_idx
  on public."Estoque" (empresa_id);
create index if not exists orcamentos_empresa_id_idx
  on public."Orcamentos" (empresa_id);
create index if not exists ordens_servico_empresa_id_idx
  on public."OrdensDeServiço" (empresa_id);
create index if not exists ordens_servico_cliente_idx
  on public."OrdensDeServiço" ("idCliente");
create index if not exists servicos_empresa_id_idx
  on public."Servicos" (empresa_id);
create index if not exists itens_os_empresa_id_idx
  on public."itensOS" (empresa_id);
create index if not exists itens_os_id_os_idx
  on public."itensOS" (id_os);
create index if not exists itens_os_produto_idx
  on public."itensOS" (produto_estoque_id);
create index if not exists usuarios_empresas_user_ativo_idx
  on public.usuarios_empresas (user_id, ativo);
create index if not exists usuarios_empresas_empresa_idx
  on public.usuarios_empresas (empresa_id);

create or replace function public.auditar_alteracoes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dados_anteriores jsonb;
  v_dados_novos jsonb;
  v_empresa_id uuid;
  v_entidade_id text;
begin
  if tg_op <> 'INSERT' then
    v_dados_anteriores := to_jsonb(old);
  end if;

  if tg_op <> 'DELETE' then
    v_dados_novos := to_jsonb(new);
  end if;

  v_empresa_id := coalesce(
    nullif(v_dados_novos ->> 'empresa_id', '')::uuid,
    nullif(v_dados_anteriores ->> 'empresa_id', '')::uuid,
    case
      when tg_table_name = 'empresas'
        then nullif(
          coalesce(v_dados_novos ->> 'id', v_dados_anteriores ->> 'id'),
          ''
        )::uuid
      else null
    end
  );

  v_entidade_id := coalesce(
    v_dados_novos ->> 'id',
    v_dados_anteriores ->> 'id'
  );

  insert into public."Auditoria" (
    empresa_id,
    usuario_id,
    entidade,
    entidade_id,
    acao,
    dados_anteriores,
    dados_novos
  )
  values (
    v_empresa_id,
    auth.uid(),
    tg_table_name,
    v_entidade_id,
    case tg_op
      when 'INSERT' then 'criou'
      when 'UPDATE' then 'editou'
      when 'DELETE' then 'deletou'
    end,
    v_dados_anteriores,
    v_dados_novos
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.salvar_ordem_servico(
  p_os jsonb,
  p_itens jsonb,
  p_os_id integer
)
returns public."OrdensDeServiço"
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_empresa_id uuid;
  v_os public."OrdensDeServiço"%rowtype;
  v_item jsonb;
  v_cliente_id integer;
  v_produto_id bigint;
  v_servico_id bigint;
  v_quantidade integer;
  v_quantidade_antiga integer;
  v_quantidade_nova integer;
  v_estoque_atual integer;
  v_descricao text;
  v_valor numeric;
  v_total numeric := 0;
begin
  select ue.empresa_id
    into v_empresa_id
  from public.usuarios_empresas as ue
  where ue.user_id = auth.uid()
    and ue.ativo = true
    and ue.role in ('admin', 'financeiro_master')
  order by ue.created_at
  limit 1;

  if v_empresa_id is null then
    raise exception using
      errcode = '42501',
      message = 'Usuário sem permissão para alterar ordens de serviço.';
  end if;

  if p_os is null or jsonb_typeof(p_os) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'Dados da ordem de serviço inválidos.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'A lista de itens da ordem de serviço é inválida.';
  end if;

  v_cliente_id := nullif(p_os ->> 'idCliente', '')::integer;

  if v_cliente_id is null or not exists (
    select 1
    from public."Clientes" as c
    where c.id = v_cliente_id
      and c.empresa_id = v_empresa_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'Cliente não encontrado para esta empresa.';
  end if;

  -- Valida o formato antes de bloquear ou alterar qualquer linha.
  for v_item in
    select value from jsonb_array_elements(p_itens)
  loop
    v_quantidade := nullif(v_item ->> 'quantidade', '')::integer;

    if v_quantidade is null or v_quantidade <= 0 then
      raise exception using
        errcode = '22023',
        message = 'Todos os itens precisam ter quantidade maior que zero.';
    end if;

    if coalesce(v_item ->> 'tipo', '') not in ('servico', 'peca') then
      raise exception using
        errcode = '22023',
        message = 'Tipo de item inválido.';
    end if;
  end loop;

  if p_os_id is not null then
    select os.*
      into v_os
    from public."OrdensDeServiço" as os
    where os.id = p_os_id
      and os.empresa_id = v_empresa_id
    for update;

    if not found then
      raise exception using
        errcode = 'P0002',
        message = 'Ordem de serviço não encontrada.';
    end if;
  end if;

  -- Calcula a diferença entre peças antigas e novas e bloqueia cada produto.
  for v_produto_id in
    select produto_id
    from (
      select distinct ios.produto_estoque_id as produto_id
      from public."itensOS" as ios
      where p_os_id is not null
        and ios.id_os = p_os_id
        and ios.empresa_id = v_empresa_id
        and ios.produto_estoque_id is not null

      union

      select distinct nullif(item ->> 'produtoEstoqueId', '')::bigint
      from jsonb_array_elements(p_itens) as item
      where nullif(item ->> 'produtoEstoqueId', '') is not null
    ) as produtos
    where produto_id is not null
  loop
    select coalesce(e."qtdEstoque", 0)
      into v_estoque_atual
    from public."Estoque" as e
    where e.id = v_produto_id
      and e.empresa_id = v_empresa_id
    for update;

    if not found then
      raise exception using
        errcode = '23503',
        message = format('Produto de estoque %s não encontrado.', v_produto_id);
    end if;

    select coalesce(sum(ios.quantidade), 0)::integer
      into v_quantidade_antiga
    from public."itensOS" as ios
    where p_os_id is not null
      and ios.id_os = p_os_id
      and ios.empresa_id = v_empresa_id
      and ios.produto_estoque_id = v_produto_id;

    select coalesce(sum((item ->> 'quantidade')::integer), 0)::integer
      into v_quantidade_nova
    from jsonb_array_elements(p_itens) as item
    where nullif(item ->> 'produtoEstoqueId', '')::bigint = v_produto_id;

    if v_estoque_atual + v_quantidade_antiga - v_quantidade_nova < 0 then
      raise exception using
        errcode = '23514',
        message = format('Estoque insuficiente para o produto %s.', v_produto_id);
    end if;

    update public."Estoque"
    set "qtdEstoque" = v_estoque_atual + v_quantidade_antiga - v_quantidade_nova
    where id = v_produto_id
      and empresa_id = v_empresa_id;
  end loop;

  if p_os_id is null then
    insert into public."OrdensDeServiço" (
      "dataServico",
      "idCliente",
      "formaPagamento",
      "veículo",
      motor,
      obs,
      "dataVencimento",
      "valorServico",
      "servicosRealizados",
      "pecasTrocadas",
      empresa_id
    )
    values (
      coalesce(nullif(p_os ->> 'dataServico', '')::timestamptz, now()),
      v_cliente_id,
      nullif(p_os ->> 'formaPagamento', ''),
      nullif(p_os ->> 'veículo', ''),
      nullif(p_os ->> 'motor', ''),
      nullif(p_os ->> 'obs', ''),
      nullif(p_os ->> 'dataVencimento', '')::date,
      0,
      coalesce(p_os ->> 'servicosRealizados', ''),
      coalesce(p_os ->> 'pecasTrocadas', ''),
      v_empresa_id
    )
    returning * into v_os;
  else
    update public."OrdensDeServiço"
    set
      "dataServico" = coalesce(
        nullif(p_os ->> 'dataServico', '')::timestamptz,
        "dataServico"
      ),
      "idCliente" = v_cliente_id,
      "formaPagamento" = nullif(p_os ->> 'formaPagamento', ''),
      "veículo" = nullif(p_os ->> 'veículo', ''),
      motor = nullif(p_os ->> 'motor', ''),
      obs = nullif(p_os ->> 'obs', ''),
      "dataVencimento" = nullif(p_os ->> 'dataVencimento', '')::date,
      "servicosRealizados" = coalesce(p_os ->> 'servicosRealizados', ''),
      "pecasTrocadas" = coalesce(p_os ->> 'pecasTrocadas', '')
    where id = p_os_id
      and empresa_id = v_empresa_id
    returning * into v_os;

    delete from public."itensOS"
    where id_os = p_os_id
      and empresa_id = v_empresa_id;
  end if;

  for v_item in
    select value from jsonb_array_elements(p_itens)
  loop
    v_quantidade := (v_item ->> 'quantidade')::integer;
    v_produto_id := nullif(v_item ->> 'produtoEstoqueId', '')::bigint;
    v_servico_id := nullif(v_item ->> 'servicoId', '')::bigint;
    v_descricao := null;
    v_valor := null;

    if v_produto_id is not null then
      select e.nome, e.valor
        into v_descricao, v_valor
      from public."Estoque" as e
      where e.id = v_produto_id
        and e.empresa_id = v_empresa_id;
    elsif v_servico_id is not null then
      select s.servico, s.valor
        into v_descricao, v_valor
      from public."Servicos" as s
      where s.id = v_servico_id
        and s.empresa_id = v_empresa_id;
    else
      v_descricao := nullif(btrim(v_item ->> 'descricao'), '');
      v_valor := nullif(v_item ->> 'valor', '')::numeric;
    end if;

    if v_descricao is null or v_valor is null or v_valor < 0 then
      raise exception using
        errcode = '22023',
        message = 'Descrição ou valor inválido em um dos itens.';
    end if;

    insert into public."itensOS" (
      id_os,
      id_servico,
      produto_estoque_id,
      quantidade,
      valor_unitario,
      descricao,
      tipo,
      manual,
      empresa_id
    )
    values (
      v_os.id,
      v_servico_id,
      v_produto_id,
      v_quantidade,
      v_valor,
      v_descricao,
      v_item ->> 'tipo',
      coalesce((v_item ->> 'manual')::boolean, false),
      v_empresa_id
    );

    v_total := v_total + (v_valor * v_quantidade);
  end loop;

  update public."OrdensDeServiço"
  set "valorServico" = v_total
  where id = v_os.id
    and empresa_id = v_empresa_id
  returning * into v_os;

  return v_os;
end;
$$;

create or replace function public.excluir_ordem_servico(p_os_id integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_empresa_id uuid;
  v_produto record;
begin
  select ue.empresa_id
    into v_empresa_id
  from public.usuarios_empresas as ue
  where ue.user_id = auth.uid()
    and ue.ativo = true
    and ue.role in ('admin', 'financeiro_master')
  order by ue.created_at
  limit 1;

  if v_empresa_id is null then
    raise exception using
      errcode = '42501',
      message = 'Usuário sem permissão para excluir ordens de serviço.';
  end if;

  perform 1
  from public."OrdensDeServiço" as os
  where os.id = p_os_id
    and os.empresa_id = v_empresa_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Ordem de serviço não encontrada.';
  end if;

  for v_produto in
    select ios.produto_estoque_id as id, sum(ios.quantidade)::integer as quantidade
    from public."itensOS" as ios
    where ios.id_os = p_os_id
      and ios.empresa_id = v_empresa_id
      and ios.produto_estoque_id is not null
    group by ios.produto_estoque_id
  loop
    perform 1
    from public."Estoque" as e
    where e.id = v_produto.id
      and e.empresa_id = v_empresa_id
    for update;

    if not found then
      raise exception using
        errcode = '23503',
        message = format('Produto de estoque %s não encontrado.', v_produto.id);
    end if;

    update public."Estoque"
    set "qtdEstoque" = coalesce("qtdEstoque", 0) + v_produto.quantidade
    where id = v_produto.id
      and empresa_id = v_empresa_id;
  end loop;

  delete from public."OrdensDeServiço"
  where id = p_os_id
    and empresa_id = v_empresa_id;

  return true;
end;
$$;

revoke all on function public.salvar_ordem_servico(jsonb, jsonb, integer)
  from public, anon;
revoke all on function public.excluir_ordem_servico(integer)
  from public, anon;
grant execute on function public.salvar_ordem_servico(jsonb, jsonb, integer)
  to authenticated;
grant execute on function public.excluir_ordem_servico(integer)
  to authenticated;

-- RPCs de relatório não devem ser expostas a sessões anônimas.
revoke execute on function public.get_top_clientes_faturamento(uuid, date)
  from public, anon;
revoke execute on function public.get_top_clientes_quantidade_os(uuid, date)
  from public, anon;
revoke execute on function public.get_top_pecas_faturamento(uuid, date)
  from public, anon;
revoke execute on function public.get_top_servicos_faturamento(uuid, date)
  from public, anon;
revoke execute on function public.get_top_servicos_quantidade(uuid, date)
  from public, anon;
