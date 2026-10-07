-- Endurece a conciliação do Pix Mercado Pago.
-- Um pagamento só é confirmado quando order E transaction estão acreditadas.

alter table public.pagamentos drop constraint if exists pagamentos_status_check;
alter table public.pagamentos add constraint pagamentos_status_check
  check (status in ('pendente', 'processando', 'confirmado', 'falhou', 'cancelado', 'estornado', 'em_disputa'));

alter table public.agendamentos drop constraint if exists agendamentos_pagamento_status_check;
alter table public.agendamentos add constraint agendamentos_pagamento_status_check
  check (pagamento_status in ('nao_exigido', 'pendente', 'processando', 'pago', 'falhou', 'estornado', 'cancelado', 'em_disputa'));

drop index if exists public.pagamentos_mp_pendentes_expiracao_idx;
create index pagamentos_mp_pendentes_expiracao_idx
  on public.pagamentos (id_empresa, expira_em)
  where provedor = 'mercado_pago'
    and status in ('pendente', 'processando', 'em_disputa');

create or replace function public.aplicar_order_mercado_pago(
  p_order_id text, p_status text, p_status_detail text,
  p_transaction_status text, p_transaction_status_detail text,
  p_paid_amount numeric, p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento record;
  v_status_provedor text := coalesce(p_transaction_status, p_status);
  v_detalhe_provedor text := coalesce(p_transaction_status_detail, p_status_detail);
  v_pago boolean :=
    p_status = 'processed' and p_status_detail = 'accredited'
    and p_transaction_status = 'processed'
    and p_transaction_status_detail = 'accredited';
  v_estornado boolean :=
    p_status = 'refunded' or p_status_detail = 'refunded'
    or p_transaction_status = 'refunded'
    or p_transaction_status_detail = 'refunded'
    or ((p_status = 'charged_back' or p_transaction_status = 'charged_back')
      and coalesce(p_transaction_status_detail, p_status_detail) = 'reimbursed');
  v_disputa boolean :=
    p_status = 'charged_back' or p_transaction_status = 'charged_back'
    or p_status_detail = 'partially_refunded'
    or p_transaction_status_detail = 'partially_refunded';
  v_terminal_sem_pagamento boolean :=
    p_status in ('expired', 'canceled', 'failed')
    or p_transaction_status in ('expired', 'canceled', 'failed');
begin
  select p.* into v_pagamento
  from public.pagamentos p
  where p.provedor = 'mercado_pago' and p.identificador_externo = p_order_id
  order by p.id desc limit 1 for update;
  if not found then return null; end if;

  -- Estorno é terminal no financeiro local; notificação antiga não o reativa.
  if v_pagamento.status = 'estornado' and not v_estornado then
    return private.pagamento_mercado_pago_json(v_pagamento.id);
  end if;

  if v_estornado then
    update public.pagamentos
    set status = 'estornado', provedor_status = v_status_provedor,
        provedor_status_detalhe = v_detalhe_provedor,
        estornado_em = coalesce(estornado_em, now()),
        motivo_estorno = coalesce(motivo_estorno, 'Estorno informado pelo Mercado Pago.'),
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id;
    update public.agendamentos
    set sinal_status = 'estornado', pagamento_status = 'estornado', updated_at = now()
    where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento;

  elsif v_disputa then
    update public.pagamentos
    set status = 'em_disputa', provedor_status = v_status_provedor,
        provedor_status_detalhe = v_detalhe_provedor,
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id;
    update public.agendamentos
    set pagamento_status = 'em_disputa', updated_at = now()
    where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento;

  elsif v_pago then
    if round(coalesce(p_paid_amount, 0), 2) <> round(v_pagamento.valor, 2) then
      -- Dinheiro recebido com valor inesperado exige conciliação humana.
      update public.pagamentos
      set status = 'em_disputa', provedor_status = v_status_provedor,
          provedor_status_detalhe = 'valor_divergente',
          provedor_atualizado_em = now(), updated_at = now()
      where id = v_pagamento.id;
      update public.agendamentos set pagamento_status = 'em_disputa', updated_at = now()
      where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento;
      return private.pagamento_mercado_pago_json(v_pagamento.id);
    end if;

    update public.pagamentos
    set status = 'confirmado', data_pagamento = coalesce(p_paid_at, now()),
        provedor_status = v_status_provedor,
        provedor_status_detalhe = v_detalhe_provedor,
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id;
    update public.agendamentos
    set sinal_status = 'pago', pagamento_status = 'pago',
        pagamento_externo_id = p_order_id,
        sinal_pago_em = coalesce(sinal_pago_em, p_paid_at, now()),
        status = case when status = 'aguardando_pagamento' then 'confirmado' else status end,
        confirmado_em = case when status = 'aguardando_pagamento'
          then coalesce(confirmado_em, p_paid_at, now()) else confirmado_em end,
        updated_at = now()
    where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento;

  elsif v_terminal_sem_pagamento then
    update public.pagamentos
    set status = case when coalesce(p_transaction_status, p_status) = 'failed'
          then 'falhou' else 'cancelado' end,
        provedor_status = v_status_provedor,
        provedor_status_detalhe = v_detalhe_provedor,
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id
      and status not in ('confirmado', 'estornado', 'em_disputa');
    update public.agendamentos
    set status = case when status = 'aguardando_pagamento' then 'cancelado' else status end,
        pagamento_status = case when coalesce(p_transaction_status, p_status) = 'failed'
          then 'falhou' else 'cancelado' end,
        cancelado_em = case when status = 'aguardando_pagamento'
          then coalesce(cancelado_em, now()) else cancelado_em end,
        motivo_cancelamento = case when status = 'aguardando_pagamento'
          then coalesce(motivo_cancelamento, 'Pagamento do sinal não concluído.')
          else motivo_cancelamento end,
        updated_at = now()
    where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento
      and pagamento_status not in ('pago', 'estornado', 'em_disputa');

  else
    update public.pagamentos
    set status = case
          when status in ('confirmado', 'estornado', 'em_disputa') then status
          when p_status = 'processing' or p_transaction_status = 'processing'
            then 'processando' else 'pendente' end,
        provedor_status = v_status_provedor,
        provedor_status_detalhe = v_detalhe_provedor,
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id;
    update public.agendamentos
    set pagamento_status = case
          when pagamento_status in ('pago', 'estornado', 'em_disputa') then pagamento_status
          when p_status = 'processing' or p_transaction_status = 'processing'
            then 'processando' else 'pendente' end,
        updated_at = now()
    where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento;
  end if;

  return private.pagamento_mercado_pago_json(v_pagamento.id);
end;
$$;

create or replace function public.aplicar_order_mercado_pago_v2(
  p_order_id text, p_external_reference text,
  p_status text, p_status_detail text,
  p_transaction_status text, p_transaction_status_detail text,
  p_paid_amount numeric, p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento record;
begin
  select p.id, p.id_empresa, p.id_agendamento into v_pagamento
  from public.pagamentos p
  where p.provedor = 'mercado_pago' and p.identificador_externo = p_order_id
  order by p.id desc limit 1 for update;
  if not found then return null; end if;

  if p_external_reference is distinct from v_pagamento.id_agendamento::text then
    update public.pagamentos
    set status = 'em_disputa',
        provedor_status = coalesce(p_transaction_status, p_status),
        provedor_status_detalhe = 'referencia_divergente',
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id;
    update public.agendamentos set pagamento_status = 'em_disputa', updated_at = now()
    where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento;
    return private.pagamento_mercado_pago_json(v_pagamento.id);
  end if;

  return public.aplicar_order_mercado_pago(
    p_order_id, p_status, p_status_detail,
    p_transaction_status, p_transaction_status_detail,
    p_paid_amount, p_paid_at
  );
end;
$$;

-- Orders externas só expiram após consulta/webhook autoritativo. Isso evita
-- cancelar um Pix aprovado durante atraso de notificação.
create or replace function public.expirar_pagamentos_mercado_pago(p_id_empresa bigint default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_quantidade integer;
begin
  with expirados as (
    update public.pagamentos p
    set status = 'cancelado', provedor_status = coalesce(p.provedor_status, 'expired'),
        provedor_status_detalhe = coalesce(p.provedor_status_detalhe, 'local_expiration'),
        provedor_atualizado_em = now(), updated_at = now()
    where p.provedor = 'mercado_pago'
      and p.status in ('pendente', 'processando') and p.expira_em <= now()
      and (p_id_empresa is null or p.id_empresa = p_id_empresa)
      and (p.identificador_externo is null or p.provedor_status in ('expired', 'canceled', 'failed'))
    returning p.id_empresa, p.id_agendamento
  )
  update public.agendamentos a
  set status = 'cancelado', pagamento_status = 'cancelado',
      cancelado_em = coalesce(a.cancelado_em, now()),
      motivo_cancelamento = coalesce(a.motivo_cancelamento, 'Prazo para pagamento do sinal expirado.'),
      updated_at = now()
  from expirados e
  where a.id_empresa = e.id_empresa and a.id = e.id_agendamento
    and a.status = 'aguardando_pagamento';
  get diagnostics v_quantidade = row_count;
  return v_quantidade;
end;
$$;

create or replace function public.listar_pagamentos_mercado_pago_pendentes(p_limite integer default 50)
returns table (payment_id bigint, company_id bigint, booking_id bigint, external_id text, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.id_empresa, p.id_agendamento, p.identificador_externo, p.expira_em
  from public.pagamentos p
  where p.provedor = 'mercado_pago'
    and p.status in ('pendente', 'processando', 'em_disputa')
  order by p.provedor_atualizado_em asc nulls first, p.id asc
  limit least(greatest(coalesce(p_limite, 50), 1), 100)
$$;

revoke all on function public.aplicar_order_mercado_pago_v2(text, text, text, text, text, text, numeric, timestamptz) from public, anon, authenticated;
revoke all on function public.listar_pagamentos_mercado_pago_pendentes(integer) from public, anon, authenticated;
grant execute on function public.aplicar_order_mercado_pago_v2(text, text, text, text, text, text, numeric, timestamptz) to service_role;
grant execute on function public.listar_pagamentos_mercado_pago_pendentes(integer) to service_role;

comment on function public.aplicar_order_mercado_pago_v2(text, text, text, text, text, text, numeric, timestamptz)
  is 'Valida referência externa e aplica estado autoritativo da order/transação. Uso exclusivo do servidor.';
comment on function public.listar_pagamentos_mercado_pago_pendentes(integer)
  is 'Fila restrita ao servidor para conciliação periódica com a API do Mercado Pago.';
