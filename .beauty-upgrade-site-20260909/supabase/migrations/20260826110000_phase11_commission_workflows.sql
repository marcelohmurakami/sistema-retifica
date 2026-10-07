-- Fase 11: regras, ajustes, pagamentos, estornos e relatórios de comissão.

alter table public.lancamentos_comissao
  alter column id_comanda drop not null;
alter table public.lancamentos_comissao
  drop constraint if exists lancamentos_comissao_origem_referencia_check;
alter table public.lancamentos_comissao
  add constraint lancamentos_comissao_origem_referencia_check check (
    (tipo_origem = 'comanda' and id_comanda is not null)
    or (
      tipo_origem = 'ajuste_manual'
      and id_comanda is null
      and id_comanda_item is null
      and id_regra is null
    )
  );
-- Mutações transacionais passam exclusivamente pelas RPCs atômicas abaixo.
drop policy if exists comissoes_regras_insert on public.comissoes_regras;
drop policy if exists comissoes_regras_update on public.comissoes_regras;
drop policy if exists lancamentos_comissao_insert on public.lancamentos_comissao;
drop policy if exists lancamentos_comissao_update on public.lancamentos_comissao;
drop policy if exists pagamentos_comissao_insert on public.pagamentos_comissao;
drop policy if exists pagamentos_comissao_update on public.pagamentos_comissao;
drop policy if exists pagamentos_comissao_itens_insert on public.pagamentos_comissao_itens;
drop policy if exists pagamentos_comissao_itens_update on public.pagamentos_comissao_itens;
create or replace function private.preparar_regra_comissao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.id_empresa is distinct from old.id_empresa then
    raise exception 'A empresa da regra não pode ser alterada.';
  end if;

  if new.id_funcionario is not null and not exists (
    select 1 from public.funcionarios f
    where f.id = new.id_funcionario and f.id_empresa = new.id_empresa
  ) then
    raise exception 'Funcionário inválido ou pertencente a outra empresa.';
  end if;

  if new.id_servico is not null and not exists (
    select 1 from public.servicos s
    where s.id = new.id_servico and s.id_empresa = new.id_empresa
  ) then
    raise exception 'Serviço inválido ou pertencente a outra empresa.';
  end if;

  if new.id_produto is not null and not exists (
    select 1 from public.produtos p
    where p.id = new.id_produto and p.id_empresa = new.id_empresa
  ) then
    raise exception 'Produto inválido ou pertencente a outra empresa.';
  end if;

  new.criado_por := coalesce(new.criado_por, auth.uid());
  new.updated_at := now();
  return new;
end;
$$;
create or replace function public.salvar_regra_comissao(
  p_regra_id bigint,
  p_id_empresa bigint,
  p_id_funcionario bigint,
  p_tipo_item text,
  p_id_servico bigint,
  p_id_produto bigint,
  p_tipo_calculo text,
  p_percentual numeric,
  p_valor_fixo numeric,
  p_base_calculo text,
  p_momento_liberacao text,
  p_vigente_de date,
  p_vigente_ate date,
  p_prioridade integer,
  p_ativo boolean
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_servico bigint;
  v_produto bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para gerenciar regras de comissão.';
  end if;

  if p_tipo_item not in ('todos', 'servico', 'produto') then
    raise exception 'Tipo de item da regra inválido.';
  end if;
  if p_tipo_calculo not in ('percentual', 'valor_fixo') then
    raise exception 'Tipo de cálculo inválido.';
  end if;
  if p_tipo_calculo = 'percentual' and coalesce(p_percentual, 0) not between 0.0001 and 100 then
    raise exception 'O percentual deve ser maior que zero e menor ou igual a 100.';
  end if;
  if p_tipo_calculo = 'valor_fixo' and coalesce(p_valor_fixo, 0) <= 0 then
    raise exception 'O valor fixo deve ser maior que zero.';
  end if;
  if p_base_calculo not in ('bruto', 'liquido_desconto') then
    raise exception 'Base de cálculo inválida.';
  end if;
  if p_momento_liberacao not in ('fechamento_comanda', 'pagamento_cliente') then
    raise exception 'Momento de liberação inválido.';
  end if;
  if p_vigente_de is null then
    raise exception 'Informe o início da vigência.';
  end if;
  if p_vigente_ate is not null and p_vigente_ate < p_vigente_de then
    raise exception 'O fim da vigência deve ser posterior ao início.';
  end if;

  if p_id_funcionario is not null and not exists (
    select 1 from public.funcionarios f
    where f.id = p_id_funcionario and f.id_empresa = p_id_empresa
  ) then
    raise exception 'Funcionário inválido ou pertencente a outra empresa.';
  end if;

  v_servico := case when p_tipo_item = 'servico' then p_id_servico end;
  v_produto := case when p_tipo_item = 'produto' then p_id_produto end;

  if v_servico is not null and not exists (
    select 1 from public.servicos s
    where s.id = v_servico and s.id_empresa = p_id_empresa
  ) then
    raise exception 'Serviço inválido ou pertencente a outra empresa.';
  end if;
  if v_produto is not null and not exists (
    select 1 from public.produtos p
    where p.id = v_produto and p.id_empresa = p_id_empresa
  ) then
    raise exception 'Produto inválido ou pertencente a outra empresa.';
  end if;

  if p_regra_id is null then
    begin
      insert into public.comissoes_regras (
        id_empresa, id_funcionario, id_servico, id_produto, tipo_item,
        tipo_calculo, percentual, valor_fixo, base_calculo,
        momento_liberacao, vigente_de, vigente_ate, prioridade, ativo, criado_por
      ) values (
        p_id_empresa, p_id_funcionario, v_servico, v_produto, p_tipo_item,
        p_tipo_calculo,
        case when p_tipo_calculo = 'percentual' then p_percentual end,
        case when p_tipo_calculo = 'valor_fixo' then p_valor_fixo end,
        p_base_calculo, p_momento_liberacao, p_vigente_de, p_vigente_ate,
        coalesce(p_prioridade, 0), coalesce(p_ativo, true), auth.uid()
      ) returning id into v_id;
    exception when unique_violation then
      raise exception 'Já existe uma regra com o mesmo escopo e início de vigência.';
    end;
  else
    perform 1 from public.comissoes_regras r
    where r.id = p_regra_id and r.id_empresa = p_id_empresa
    for update;
    if not found then raise exception 'Regra de comissão não encontrada.'; end if;

    begin
      update public.comissoes_regras
         set id_funcionario = p_id_funcionario,
             id_servico = v_servico,
             id_produto = v_produto,
             tipo_item = p_tipo_item,
             tipo_calculo = p_tipo_calculo,
             percentual = case when p_tipo_calculo = 'percentual' then p_percentual end,
             valor_fixo = case when p_tipo_calculo = 'valor_fixo' then p_valor_fixo end,
             base_calculo = p_base_calculo,
             momento_liberacao = p_momento_liberacao,
             vigente_de = p_vigente_de,
             vigente_ate = p_vigente_ate,
             prioridade = coalesce(p_prioridade, 0),
             ativo = coalesce(p_ativo, true)
       where id = p_regra_id and id_empresa = p_id_empresa;
    exception when unique_violation then
      raise exception 'Já existe uma regra com o mesmo escopo e início de vigência.';
    end;
    v_id := p_regra_id;
  end if;

  return v_id;
end;
$$;
create or replace function public.criar_ajuste_comissao(
  p_id_empresa bigint,
  p_id_funcionario bigint,
  p_descricao text,
  p_valor numeric,
  p_competencia date
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para criar ajustes de comissão.';
  end if;
  if not exists (
    select 1 from public.funcionarios f
    where f.id = p_id_funcionario and f.id_empresa = p_id_empresa
  ) then
    raise exception 'Funcionário inválido ou pertencente a outra empresa.';
  end if;
  if nullif(btrim(p_descricao), '') is null then
    raise exception 'Informe o motivo do ajuste.';
  end if;
  if coalesce(p_valor, 0) <= 0 then
    raise exception 'O valor do ajuste deve ser maior que zero.';
  end if;

  insert into public.lancamentos_comissao (
    id_empresa, id_funcionario, id_regra, id_comanda, id_comanda_item,
    tipo_origem, tipo_item, descricao_snapshot, desconto_rateado,
    base_calculo, tipo_calculo, percentual_snapshot, valor_fixo_snapshot,
    valor_comissao, valor_pago, status, competencia, momento_liberacao,
    liberada_em
  ) values (
    p_id_empresa, p_id_funcionario, null, null, null,
    'ajuste_manual', 'outro', btrim(p_descricao), 0,
    p_valor, 'valor_fixo', null, p_valor,
    p_valor, 0, 'liberada', coalesce(p_competencia, current_date),
    'fechamento_comanda', now()
  ) returning id into v_id;

  return v_id;
end;
$$;
create or replace function public.estornar_lancamento_comissao(
  p_id_empresa bigint,
  p_lancamento_id bigint,
  p_motivo text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lancamento record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para estornar comissões.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;

  select lc.* into v_lancamento
  from public.lancamentos_comissao lc
  where lc.id = p_lancamento_id and lc.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Lançamento de comissão não encontrado.'; end if;
  if v_lancamento.status = 'estornada' then return 'estornada'; end if;
  if v_lancamento.valor_pago > 0 or v_lancamento.status in ('parcial', 'paga') then
    raise exception 'Estorne primeiro os pagamentos vinculados a esta comissão.';
  end if;

  update public.lancamentos_comissao
     set status = 'estornada', estornada_em = now(), motivo_estorno = btrim(p_motivo)
   where id = p_lancamento_id and id_empresa = p_id_empresa;

  return 'estornada';
end;
$$;
create or replace function public.registrar_pagamento_comissao(
  p_id_empresa bigint,
  p_id_funcionario bigint,
  p_id_forma_pagamento bigint,
  p_id_sessao_caixa bigint,
  p_pago_em timestamptz,
  p_periodo_inicio date,
  p_periodo_fim date,
  p_observacoes text,
  p_itens jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_item jsonb;
  v_lancamento_id bigint;
  v_valor numeric(14,2);
  v_forma_tipo text;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para pagar comissões.';
  end if;
  if not exists (
    select 1 from public.funcionarios f
    where f.id = p_id_funcionario and f.id_empresa = p_id_empresa
  ) then
    raise exception 'Funcionário inválido ou pertencente a outra empresa.';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Selecione ao menos uma comissão para pagar.';
  end if;
  if p_periodo_inicio is not null and p_periodo_fim is not null
     and p_periodo_fim < p_periodo_inicio then
    raise exception 'O fim do período deve ser posterior ao início.';
  end if;
  if coalesce(p_pago_em, now()) > now() then
    raise exception 'A data do pagamento não pode estar no futuro.';
  end if;

  select fp.tipo into v_forma_tipo
  from public.formas_pagamento fp
  where fp.id = p_id_forma_pagamento
    and fp.id_empresa = p_id_empresa
    and fp.ativo;
  if not found then raise exception 'Forma de pagamento inválida ou inativa.'; end if;

  if p_id_sessao_caixa is not null then
    if v_forma_tipo <> 'dinheiro' then
      raise exception 'Somente pagamentos em dinheiro movimentam o caixa físico.';
    end if;
    if not exists (
      select 1 from public.sessoes_caixa s
      where s.id = p_id_sessao_caixa
        and s.id_empresa = p_id_empresa
        and s.status = 'aberta'
    ) then
      raise exception 'Sessão de caixa inválida ou fechada.';
    end if;
  end if;

  insert into public.pagamentos_comissao (
    id_empresa, id_funcionario, valor_total, status,
    periodo_inicio, periodo_fim, observacoes, criado_por
  ) values (
    p_id_empresa, p_id_funcionario, 0, 'rascunho',
    p_periodo_inicio, p_periodo_fim, nullif(btrim(p_observacoes), ''), auth.uid()
  ) returning id into v_id;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_lancamento_id := nullif(v_item->>'id_lancamento_comissao', '')::bigint;
    v_valor := nullif(v_item->>'valor', '')::numeric;
    if v_lancamento_id is null or coalesce(v_valor, 0) <= 0 then
      raise exception 'Revise as comissões e os valores do pagamento.';
    end if;

    insert into public.pagamentos_comissao_itens (
      id_empresa, id_pagamento_comissao, id_lancamento_comissao, valor
    ) values (p_id_empresa, v_id, v_lancamento_id, v_valor);
  end loop;

  update public.pagamentos_comissao
     set id_forma_pagamento = p_id_forma_pagamento,
         id_sessao_caixa = p_id_sessao_caixa,
         pago_em = coalesce(p_pago_em, now()),
         status = 'confirmado'
   where id = v_id and id_empresa = p_id_empresa;

  return v_id;
exception when unique_violation then
  raise exception 'Uma mesma comissão não pode aparecer duas vezes no pagamento.';
end;
$$;
create or replace function public.estornar_pagamento_comissao(
  p_id_empresa bigint,
  p_pagamento_comissao_id bigint,
  p_motivo text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para estornar pagamentos de comissão.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;

  select pc.* into v_pagamento
  from public.pagamentos_comissao pc
  where pc.id = p_pagamento_comissao_id and pc.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Pagamento de comissão não encontrado.'; end if;
  if v_pagamento.status = 'cancelado' then return 'cancelado'; end if;
  if v_pagamento.status <> 'confirmado' then
    raise exception 'Somente pagamentos confirmados podem ser estornados.';
  end if;

  update public.pagamentos_comissao
     set status = 'cancelado',
         cancelado_em = now(),
         motivo_cancelamento = btrim(p_motivo)
   where id = p_pagamento_comissao_id and id_empresa = p_id_empresa;

  return 'cancelado';
end;
$$;
-- Impede que o financeiro quebre a conciliação de um pagamento de comissão.
create or replace function public.estornar_pagamento_financeiro(
  p_pagamento_id bigint,
  p_id_empresa bigint,
  p_motivo text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento record;
begin
  select p.* into v_pagamento
  from public.pagamentos p
  where p.id = p_pagamento_id and p.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Pagamento não encontrado.'; end if;
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      v_pagamento.tipo = 'entrada'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para estornar este pagamento.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;
  if v_pagamento.status = 'estornado' then return 'estornado'; end if;
  if v_pagamento.status <> 'confirmado' then
    raise exception 'Somente pagamentos confirmados podem ser estornados.';
  end if;
  if exists (
    select 1 from public.pagamentos_comissao pc
    where pc.id_pagamento = p_pagamento_id
      and pc.id_empresa = p_id_empresa
      and pc.status = 'confirmado'
  ) then
    raise exception 'Este pagamento pertence a uma comissão. Faça o estorno pelo módulo Comissões.';
  end if;

  update public.pagamentos
     set status = 'estornado', estornado_em = now(),
         estornado_por = auth.uid(), motivo_estorno = btrim(p_motivo)
   where id = p_pagamento_id and id_empresa = p_id_empresa;

  return 'estornado';
end;
$$;
create or replace function public.relatorio_comissoes_funcionario(
  p_id_empresa bigint,
  p_data_inicio date,
  p_data_fim date
)
returns table (
  id_funcionario bigint,
  funcionario_nome text,
  comissoes_geradas numeric,
  comissoes_previstas numeric,
  comissoes_liberadas numeric,
  comissoes_pagas numeric,
  comissoes_estornadas numeric,
  ajustes_manuais numeric,
  saldo_a_pagar numeric
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para consultar este relatório.';
  end if;
  if p_data_inicio is null or p_data_fim is null or p_data_fim < p_data_inicio then
    raise exception 'Período do relatório inválido.';
  end if;

  return query
  with lancamentos as (
    select
      lc.id_funcionario,
      coalesce(sum(lc.valor_comissao) filter (
        where lc.status <> 'estornada'
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as geradas,
      coalesce(sum(lc.valor_comissao - lc.valor_pago) filter (
        where lc.status = 'prevista'
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as previstas,
      coalesce(sum(lc.valor_comissao - lc.valor_pago) filter (
        where lc.status in ('liberada', 'parcial')
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as liberadas,
      coalesce(sum(lc.valor_comissao) filter (
        where lc.status = 'estornada'
          and lc.estornada_em::date between p_data_inicio and p_data_fim
      ), 0) as estornadas,
      coalesce(sum(lc.valor_comissao) filter (
        where lc.tipo_origem = 'ajuste_manual'
          and lc.status <> 'estornada'
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as ajustes,
      coalesce(sum(lc.valor_comissao - lc.valor_pago) filter (
        where lc.status in ('liberada', 'parcial')
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as saldo
    from public.lancamentos_comissao lc
    where lc.id_empresa = p_id_empresa
    group by lc.id_funcionario
  ), pagos as (
    select
      pc.id_funcionario,
      coalesce(sum(pci.valor), 0) as total
    from public.pagamentos_comissao pc
    join public.pagamentos_comissao_itens pci
      on pci.id_pagamento_comissao = pc.id
     and pci.id_empresa = pc.id_empresa
    where pc.id_empresa = p_id_empresa
      and pc.status = 'confirmado'
      and pc.pago_em::date between p_data_inicio and p_data_fim
    group by pc.id_funcionario
  )
  select
    f.id,
    f.nome::text,
    coalesce(l.geradas, 0),
    coalesce(l.previstas, 0),
    coalesce(l.liberadas, 0),
    coalesce(p.total, 0),
    coalesce(l.estornadas, 0),
    coalesce(l.ajustes, 0),
    coalesce(l.saldo, 0)
  from public.funcionarios f
  left join lancamentos l on l.id_funcionario = f.id
  left join pagos p on p.id_funcionario = f.id
  where f.id_empresa = p_id_empresa
    and (l.id_funcionario is not null or p.id_funcionario is not null)
  order by f.nome;
end;
$$;
revoke all on function public.salvar_regra_comissao(bigint,bigint,bigint,text,bigint,bigint,text,numeric,numeric,text,text,date,date,integer,boolean) from public;
grant execute on function public.salvar_regra_comissao(bigint,bigint,bigint,text,bigint,bigint,text,numeric,numeric,text,text,date,date,integer,boolean) to authenticated;
revoke all on function public.criar_ajuste_comissao(bigint,bigint,text,numeric,date) from public;
grant execute on function public.criar_ajuste_comissao(bigint,bigint,text,numeric,date) to authenticated;
revoke all on function public.estornar_lancamento_comissao(bigint,bigint,text) from public;
grant execute on function public.estornar_lancamento_comissao(bigint,bigint,text) to authenticated;
revoke all on function public.registrar_pagamento_comissao(bigint,bigint,bigint,bigint,timestamptz,date,date,text,jsonb) from public;
grant execute on function public.registrar_pagamento_comissao(bigint,bigint,bigint,bigint,timestamptz,date,date,text,jsonb) to authenticated;
revoke all on function public.estornar_pagamento_comissao(bigint,bigint,text) from public;
grant execute on function public.estornar_pagamento_comissao(bigint,bigint,text) to authenticated;
revoke all on function public.relatorio_comissoes_funcionario(bigint,date,date) from public;
grant execute on function public.relatorio_comissoes_funcionario(bigint,date,date) to authenticated;
comment on function public.salvar_regra_comissao(bigint,bigint,bigint,text,bigint,bigint,text,numeric,numeric,text,text,date,date,integer,boolean)
  is 'Cria ou atualiza uma regra de comissão com validação de escopo.';
comment on function public.criar_ajuste_comissao(bigint,bigint,text,numeric,date)
  is 'Cria um crédito manual de comissão liberado e auditável.';
comment on function public.registrar_pagamento_comissao(bigint,bigint,bigint,bigint,timestamptz,date,date,text,jsonb)
  is 'Paga lançamentos de comissão atomicamente e integra a saída ao financeiro.';
comment on function public.relatorio_comissoes_funcionario(bigint,date,date)
  is 'Resume comissões por funcionário no período informado.';
