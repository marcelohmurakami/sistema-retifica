alter table public.comandas
  add column if not exists condicao_pagamento text not null default 'a_receber';
alter table public.comandas
  drop constraint if exists comandas_condicao_pagamento_check;
alter table public.comandas
  add constraint comandas_condicao_pagamento_check
  check (condicao_pagamento in ('a_receber', 'parcial', 'pago'));
comment on column public.comandas.condicao_pagamento is
  'Condição escolhida para o fechamento. O estado financeiro efetivo é calculado pela conta vinculada.';
create or replace function public.salvar_comanda_com_pagamento(
  p_comanda_id bigint,
  p_id_empresa bigint,
  p_id_cliente bigint,
  p_id_funcionario_responsavel bigint,
  p_desconto numeric,
  p_acrescimo numeric,
  p_observacoes text,
  p_itens jsonb,
  p_condicao_pagamento text default 'a_receber'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comanda_id bigint;
begin
  if p_condicao_pagamento not in ('a_receber', 'pago') then
    raise exception 'Condição de pagamento inválida para uma comanda aberta.';
  end if;

  v_comanda_id := public.salvar_comanda(
    p_comanda_id,
    p_id_empresa,
    p_id_cliente,
    p_id_funcionario_responsavel,
    p_desconto,
    p_acrescimo,
    p_observacoes,
    p_itens
  );

  update public.comandas
     set condicao_pagamento = p_condicao_pagamento
   where id = v_comanda_id
     and id_empresa = p_id_empresa
     and status = 'aberta';

  if not found then
    raise exception 'A condição de pagamento só pode ser alterada em uma comanda aberta.';
  end if;

  return v_comanda_id;
end;
$$;
create or replace function public.fechar_comanda_com_pagamento(
  p_comanda_id bigint,
  p_id_empresa bigint,
  p_situacao_pagamento text,
  p_data_vencimento date default current_date,
  p_id_forma_pagamento bigint default null,
  p_id_sessao_caixa bigint default null,
  p_data_pagamento timestamptz default null,
  p_valor_pagamento numeric default null,
  p_referencia text default null,
  p_observacoes_pagamento text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_total numeric(14,2);
  v_valor_pagamento numeric(14,2);
  v_conta_id bigint;
  v_parcela_id bigint;
  v_pagamento_id bigint;
begin
  if p_situacao_pagamento not in ('a_receber', 'parcial', 'pago') then
    raise exception 'Situação de pagamento inválida.';
  end if;

  select c.status, round(coalesce(c.valor_total, 0), 2)
    into v_status, v_total
  from public.comandas c
  where c.id = p_comanda_id
    and c.id_empresa = p_id_empresa
  for update;

  if not found then
    raise exception 'Comanda não encontrada.';
  end if;
  if v_status <> 'aberta' then
    raise exception 'Apenas comandas abertas podem ser fechadas.';
  end if;

  if p_situacao_pagamento in ('a_receber', 'parcial')
     and p_data_vencimento is null then
    raise exception 'Informe o vencimento do saldo a receber.';
  end if;

  if p_situacao_pagamento <> 'a_receber' then
    if v_total <= 0 then
      raise exception 'Uma comanda sem valor não pode registrar pagamento.';
    end if;
    if p_id_forma_pagamento is null then
      raise exception 'Selecione a forma de pagamento.';
    end if;
  end if;

  if p_situacao_pagamento = 'pago' then
    v_valor_pagamento := v_total;
  elsif p_situacao_pagamento = 'parcial' then
    v_valor_pagamento := round(coalesce(p_valor_pagamento, 0), 2);
    if v_valor_pagamento <= 0 or v_valor_pagamento >= v_total then
      raise exception 'O pagamento parcial deve ser maior que zero e menor que o total da comanda.';
    end if;
  else
    v_valor_pagamento := null;
  end if;

  v_conta_id := public.fechar_comanda(
    p_comanda_id,
    p_id_empresa,
    case
      when p_situacao_pagamento = 'pago' then current_date
      else p_data_vencimento
    end
  );

  update public.comandas
     set condicao_pagamento = p_situacao_pagamento
   where id = p_comanda_id
     and id_empresa = p_id_empresa;

  if v_valor_pagamento is not null then
    select cp.id
      into v_parcela_id
    from public.contas_parcelas cp
    where cp.id_conta = v_conta_id
      and cp.id_empresa = p_id_empresa
      and cp.status <> 'cancelada'
    order by cp.numero_parcela
    limit 1
    for update;

    if not found then
      raise exception 'A parcela da comanda não foi encontrada.';
    end if;

    v_pagamento_id := public.registrar_pagamento_financeiro(
      p_id_empresa,
      'entrada',
      p_id_forma_pagamento,
      p_id_sessao_caixa,
      coalesce(p_data_pagamento, now()),
      v_valor_pagamento,
      p_referencia,
      p_observacoes_pagamento,
      jsonb_build_array(
        jsonb_build_object(
          'id_parcela', v_parcela_id,
          'valor', v_valor_pagamento
        )
      )
    );
  end if;

  return jsonb_build_object(
    'conta_id', v_conta_id,
    'pagamento_id', v_pagamento_id,
    'situacao_pagamento', p_situacao_pagamento,
    'valor_pago', coalesce(v_valor_pagamento, 0),
    'saldo', greatest(v_total - coalesce(v_valor_pagamento, 0), 0)
  );
end;
$$;
revoke all on function public.salvar_comanda_com_pagamento(bigint,bigint,bigint,bigint,numeric,numeric,text,jsonb,text) from public;
grant execute on function public.salvar_comanda_com_pagamento(bigint,bigint,bigint,bigint,numeric,numeric,text,jsonb,text) to authenticated;
revoke all on function public.fechar_comanda_com_pagamento(bigint,bigint,text,date,bigint,bigint,timestamptz,numeric,text,text) from public;
grant execute on function public.fechar_comanda_com_pagamento(bigint,bigint,text,date,bigint,bigint,timestamptz,numeric,text,text) to authenticated;
comment on function public.salvar_comanda_com_pagamento(bigint,bigint,bigint,bigint,numeric,numeric,text,jsonb,text) is
  'Cria ou edita uma comanda aberta e salva a condição escolhida para o futuro fechamento.';
comment on function public.fechar_comanda_com_pagamento(bigint,bigint,text,date,bigint,bigint,timestamptz,numeric,text,text) is
  'Fecha a comanda, gera a conta e registra de forma atômica um recebimento total ou parcial quando informado.';
