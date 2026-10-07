-- Fase 13: cobrança de sinal via Mercado Pago (Checkout Transparente / Orders).
-- Toda mutação financeira fica restrita ao service_role. O navegador nunca
-- recebe as credenciais administrativas do Supabase ou do Mercado Pago.

alter table public.pagamentos
  add column if not exists provedor_status text,
  add column if not exists provedor_status_detalhe text,
  add column if not exists expira_em timestamptz,
  add column if not exists provedor_atualizado_em timestamptz;

alter table public.pagamentos
  drop constraint if exists pagamentos_status_check;
alter table public.pagamentos
  add constraint pagamentos_status_check
  check (status in ('pendente', 'processando', 'confirmado', 'falhou', 'cancelado', 'estornado'));

create index if not exists pagamentos_mp_pendentes_expiracao_idx
  on public.pagamentos (id_empresa, expira_em)
  where provedor = 'mercado_pago'
    and status in ('pendente', 'processando');

-- Garante uma forma Pix utilizável pelas empresas que ainda não possuem uma.
insert into public.formas_pagamento (
  id_empresa, nome, tipo, permite_parcelamento, max_parcelas,
  taxa_percentual, prazo_recebimento_dias, ativo
)
select e.id, 'PIX', 'pix', false, 1, 0, 0, true
from public.empresas e
where not exists (
  select 1
  from public.formas_pagamento f
  where f.id_empresa = e.id and f.tipo = 'pix'
);

create or replace function private.pagamento_mercado_pago_json(p_id_pagamento bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'payment_id', p.id,
    'booking_id', p.id_agendamento,
    'company_id', p.id_empresa,
    'customer_email', c.email,
    'amount', p.valor,
    'status', p.status,
    'provider_status', p.provedor_status,
    'provider_status_detail', p.provedor_status_detalhe,
    'external_id', p.identificador_externo,
    'idempotency_key', p.chave_idempotencia,
    'expires_at', p.expira_em
  )
  from public.pagamentos p
  join public.agendamentos a
    on a.id_empresa = p.id_empresa and a.id = p.id_agendamento
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  where p.id = p_id_pagamento
    and p.provedor = 'mercado_pago'
$$;

create or replace function public.obter_pagamento_mercado_pago(
  p_id_empresa bigint,
  p_id_agendamento bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento_id bigint;
begin
  select p.id into v_pagamento_id
  from public.pagamentos p
  where p.id_empresa = p_id_empresa
    and p.id_agendamento = p_id_agendamento
    and p.provedor = 'mercado_pago'
  order by
    (p.status in ('confirmado', 'pendente', 'processando')) desc,
    p.id desc
  limit 1;

  if v_pagamento_id is null then return null; end if;
  return private.pagamento_mercado_pago_json(v_pagamento_id);
end;
$$;

create or replace function public.preparar_pagamento_mercado_pago(
  p_id_empresa bigint,
  p_id_agendamento bigint,
  p_chave_idempotencia text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agendamento record;
  v_forma_pagamento_id bigint;
  v_pagamento_id bigint;
begin
  select a.*, c.email as cliente_email
    into v_agendamento
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  where a.id_empresa = p_id_empresa
    and a.id = p_id_agendamento
  for update of a;

  if not found then raise exception 'Agendamento não encontrado.'; end if;
  if v_agendamento.sinal_status = 'pago' then
    select p.id into v_pagamento_id
    from public.pagamentos p
    where p.id_empresa = p_id_empresa
      and p.id_agendamento = p_id_agendamento
      and p.provedor = 'mercado_pago'
      and p.status = 'confirmado'
    order by p.id desc limit 1;
    if v_pagamento_id is not null then
      return private.pagamento_mercado_pago_json(v_pagamento_id);
    end if;
    raise exception 'O sinal deste agendamento já foi pago.';
  end if;
  if v_agendamento.status <> 'aguardando_pagamento'
     or v_agendamento.sinal_status <> 'pendente'
     or coalesce(v_agendamento.sinal_valor, 0) <= 0 then
    raise exception 'Este agendamento não possui um sinal pendente.';
  end if;
  if v_agendamento.inicio <= now() then
    raise exception 'Não é possível pagar um agendamento que já começou.';
  end if;

  select p.id into v_pagamento_id
  from public.pagamentos p
  where p.id_empresa = p_id_empresa
    and p.id_agendamento = p_id_agendamento
    and p.provedor = 'mercado_pago'
    and p.status in ('pendente', 'processando', 'confirmado')
  order by p.id desc
  limit 1
  for update;

  if v_pagamento_id is not null then
    return private.pagamento_mercado_pago_json(v_pagamento_id);
  end if;

  if p_chave_idempotencia is null
     or p_chave_idempotencia !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'Chave de idempotência inválida.';
  end if;
  if nullif(btrim(v_agendamento.cliente_email), '') is null then
    raise exception 'Informe um e-mail válido antes de gerar o pagamento.';
  end if;

  select f.id into v_forma_pagamento_id
  from public.formas_pagamento f
  where f.id_empresa = p_id_empresa and f.tipo = 'pix' and f.ativo
  order by (lower(f.nome) = 'pix') desc, f.id
  limit 1;
  if v_forma_pagamento_id is null then
    raise exception 'A forma de pagamento Pix está desativada para esta empresa.';
  end if;

  insert into public.pagamentos (
    id_empresa, tipo, id_forma_pagamento, data_pagamento,
    valor, valor_alocado, status, referencia, observacoes,
    id_agendamento, provedor, chave_idempotencia,
    provedor_status, provedor_status_detalhe, expira_em,
    provedor_atualizado_em
  ) values (
    p_id_empresa, 'entrada', v_forma_pagamento_id, now(),
    v_agendamento.sinal_valor, 0, 'pendente',
    'Sinal do agendamento MK' || lpad(p_id_agendamento::text, 6, '0'),
    'Cobrança Pix criada pelo site público.',
    p_id_agendamento, 'mercado_pago', p_chave_idempotencia,
    'created', 'created', now() + interval '30 minutes', now()
  ) returning id into v_pagamento_id;

  update public.agendamentos
  set pagamento_status = 'pendente', updated_at = now()
  where id_empresa = p_id_empresa and id = p_id_agendamento;

  return private.pagamento_mercado_pago_json(v_pagamento_id);
end;
$$;

create or replace function public.registrar_order_mercado_pago(
  p_id_empresa bigint,
  p_id_pagamento bigint,
  p_order_id text,
  p_status text,
  p_status_detail text,
  p_expira_em timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento record;
begin
  if nullif(btrim(p_order_id), '') is null then
    raise exception 'Identificador da order inválido.';
  end if;

  select p.* into v_pagamento
  from public.pagamentos p
  where p.id_empresa = p_id_empresa
    and p.id = p_id_pagamento
    and p.provedor = 'mercado_pago'
  for update;
  if not found then raise exception 'Pagamento não encontrado.'; end if;
  if v_pagamento.identificador_externo is not null
     and v_pagamento.identificador_externo <> p_order_id then
    raise exception 'Este pagamento já está associado a outra order.';
  end if;

  update public.pagamentos
  set identificador_externo = p_order_id,
      provedor_status = p_status,
      provedor_status_detalhe = p_status_detail,
      expira_em = coalesce(p_expira_em, expira_em),
      provedor_atualizado_em = now(),
      updated_at = now()
  where id = p_id_pagamento and id_empresa = p_id_empresa;

  update public.agendamentos
  set pagamento_externo_id = p_order_id, updated_at = now()
  where id_empresa = p_id_empresa and id = v_pagamento.id_agendamento;

  return private.pagamento_mercado_pago_json(p_id_pagamento);
end;
$$;

create or replace function public.aplicar_order_mercado_pago(
  p_order_id text,
  p_status text,
  p_status_detail text,
  p_transaction_status text,
  p_transaction_status_detail text,
  p_paid_amount numeric,
  p_paid_at timestamptz
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
begin
  select p.* into v_pagamento
  from public.pagamentos p
  where p.provedor = 'mercado_pago'
    and p.identificador_externo = p_order_id
  order by p.id desc
  limit 1
  for update;
  if not found then return null; end if;

  if p_status = 'processed' and p_status_detail = 'accredited' then
    if abs(coalesce(p_paid_amount, 0) - v_pagamento.valor) > 0.01 then
      update public.pagamentos
      set status = 'falhou',
          provedor_status = v_status_provedor,
          provedor_status_detalhe = 'valor_divergente',
          provedor_atualizado_em = now(), updated_at = now()
      where id = v_pagamento.id;
      update public.agendamentos
      set pagamento_status = 'falhou', updated_at = now()
      where id_empresa = v_pagamento.id_empresa
        and id = v_pagamento.id_agendamento;
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
        status = case
          when status = 'aguardando_pagamento' then 'confirmado'
          else status
        end,
        confirmado_em = case
          when status = 'aguardando_pagamento' then coalesce(confirmado_em, p_paid_at, now())
          else confirmado_em
        end,
        updated_at = now()
    where id_empresa = v_pagamento.id_empresa
      and id = v_pagamento.id_agendamento;
  elsif p_status = 'refunded' or p_status_detail = 'refunded' then
    update public.pagamentos
    set status = 'estornado', provedor_status = v_status_provedor,
        provedor_status_detalhe = v_detalhe_provedor,
        estornado_em = coalesce(estornado_em, now()),
        motivo_estorno = coalesce(motivo_estorno, 'Estorno informado pelo Mercado Pago.'),
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id;
    update public.agendamentos
    set sinal_status = 'estornado', pagamento_status = 'estornado', updated_at = now()
    where id_empresa = v_pagamento.id_empresa
      and id = v_pagamento.id_agendamento;
  elsif p_status in ('expired', 'canceled', 'failed') then
    update public.pagamentos
    set status = case when p_status = 'failed' then 'falhou' else 'cancelado' end,
        provedor_status = v_status_provedor,
        provedor_status_detalhe = v_detalhe_provedor,
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id and status <> 'confirmado';
    update public.agendamentos
    set status = case when status = 'aguardando_pagamento' then 'cancelado' else status end,
        pagamento_status = case when p_status = 'failed' then 'falhou' else 'cancelado' end,
        cancelado_em = case when status = 'aguardando_pagamento' then coalesce(cancelado_em, now()) else cancelado_em end,
        motivo_cancelamento = case
          when status = 'aguardando_pagamento' then coalesce(motivo_cancelamento, 'Pagamento do sinal não concluído.')
          else motivo_cancelamento
        end,
        updated_at = now()
    where id_empresa = v_pagamento.id_empresa
      and id = v_pagamento.id_agendamento
      and pagamento_status <> 'pago';
  else
    update public.pagamentos
    set status = case
          when status = 'confirmado' then status
          when p_status = 'processing' then 'processando'
          else 'pendente'
        end,
        provedor_status = v_status_provedor,
        provedor_status_detalhe = v_detalhe_provedor,
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id;
    update public.agendamentos
    set pagamento_status = case
          when pagamento_status = 'pago' then pagamento_status
          when p_status = 'processing' then 'processando'
          else 'pendente'
        end,
        updated_at = now()
    where id_empresa = v_pagamento.id_empresa
      and id = v_pagamento.id_agendamento;
  end if;

  return private.pagamento_mercado_pago_json(v_pagamento.id);
end;
$$;

create or replace function public.expirar_pagamentos_mercado_pago(
  p_id_empresa bigint default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quantidade integer;
begin
  with expirados as (
    update public.pagamentos p
    set status = 'cancelado',
        provedor_status = coalesce(p.provedor_status, 'expired'),
        provedor_status_detalhe = 'local_expiration',
        provedor_atualizado_em = now(), updated_at = now()
    where p.provedor = 'mercado_pago'
      and p.status in ('pendente', 'processando')
      and p.expira_em <= now()
      and (p_id_empresa is null or p.id_empresa = p_id_empresa)
    returning p.id_empresa, p.id_agendamento
  )
  update public.agendamentos a
  set status = 'cancelado', pagamento_status = 'cancelado',
      cancelado_em = coalesce(a.cancelado_em, now()),
      motivo_cancelamento = coalesce(a.motivo_cancelamento, 'Prazo para pagamento do sinal expirado.'),
      updated_at = now()
  from expirados e
  where a.id_empresa = e.id_empresa
    and a.id = e.id_agendamento
    and a.status = 'aguardando_pagamento';

  get diagnostics v_quantidade = row_count;
  return v_quantidade;
end;
$$;

revoke all on function private.pagamento_mercado_pago_json(bigint) from public;
revoke all on function public.obter_pagamento_mercado_pago(bigint, bigint) from public, anon, authenticated;
revoke all on function public.preparar_pagamento_mercado_pago(bigint, bigint, text) from public, anon, authenticated;
revoke all on function public.registrar_order_mercado_pago(bigint, bigint, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.aplicar_order_mercado_pago(text, text, text, text, text, numeric, timestamptz) from public, anon, authenticated;
revoke all on function public.expirar_pagamentos_mercado_pago(bigint) from public, anon, authenticated;

grant execute on function public.obter_pagamento_mercado_pago(bigint, bigint) to service_role;
grant execute on function public.preparar_pagamento_mercado_pago(bigint, bigint, text) to service_role;
grant execute on function public.registrar_order_mercado_pago(bigint, bigint, text, text, text, timestamptz) to service_role;
grant execute on function public.aplicar_order_mercado_pago(text, text, text, text, text, numeric, timestamptz) to service_role;
grant execute on function public.expirar_pagamentos_mercado_pago(bigint) to service_role;

comment on function public.preparar_pagamento_mercado_pago(bigint, bigint, text)
  is 'Cria ou reutiliza uma intenção idempotente de sinal. Uso exclusivo do servidor.';
comment on function public.aplicar_order_mercado_pago(text, text, text, text, text, numeric, timestamptz)
  is 'Aplica de forma idempotente o estado consultado na API do Mercado Pago.';
