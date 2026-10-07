-- Impede ações incompatíveis com sinal pendente, normaliza a área do cliente
-- e garante estorno automático se um Pix for acreditado após o cancelamento.

create or replace function public.obter_area_cliente_site(p_id_empresa bigint)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_resultado jsonb;
  v_agendamentos jsonb := '[]'::jsonb;
  v_agendamento jsonb;
begin
  v_resultado := private.obter_area_cliente_site(p_id_empresa);
  if v_resultado is null then return null; end if;

  for v_agendamento in
    select item.value
    from jsonb_array_elements(coalesce(v_resultado->'agendamentos', '[]'::jsonb)) item(value)
  loop
    v_agendamentos := v_agendamentos || jsonb_build_array(
      v_agendamento || jsonb_build_object(
        'pode_reagendar',
        coalesce((v_agendamento->>'pode_reagendar')::boolean, false)
          and coalesce(v_agendamento->>'sinal_status', '') <> 'pendente'
          and coalesce(v_agendamento->>'status', '') <> 'aguardando_pagamento'
      )
    );
  end loop;

  return jsonb_set(v_resultado, '{agendamentos}', v_agendamentos, true);
end;
$$;

create or replace function private.reagendar_agendamento_core(
  p_id_empresa bigint,
  p_id_agendamento bigint,
  p_id_funcionario bigint,
  p_inicio timestamptz,
  p_origem text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agendamento public.agendamentos%rowtype;
  v_item public.agendamentos_servicos%rowtype;
  v_fuso text;
  v_disponivel boolean;
  v_fim timestamptz;
  v_antecedencia integer := 1440;
  v_novo_token uuid := gen_random_uuid();
  v_primeiro bigint;
  v_segundo bigint;
begin
  select * into v_agendamento from public.agendamentos a
  where a.id_empresa = p_id_empresa and a.id = p_id_agendamento for update;
  if not found then raise exception 'Agendamento nao encontrado.'; end if;
  if v_agendamento.status in ('cancelado', 'finalizado', 'no_show', 'em_atendimento') then
    raise exception 'Este agendamento nao pode mais ser reagendado.';
  end if;
  if v_agendamento.status = 'aguardando_pagamento'
     or v_agendamento.sinal_status = 'pendente' then
    raise exception using errcode = '55000',
      message = 'O reagendamento fica disponivel somente apos a confirmacao do sinal.';
  end if;

  select coalesce(p.antecedencia_reagendamento_minutos, 1440) into v_antecedencia
  from public.politicas_cancelamento p
  where p.id_empresa = p_id_empresa and p.ativo
    and current_date between p.vigente_desde and coalesce(p.vigente_ate, 'infinity'::date)
    and (p.id_unidade = v_agendamento.id_unidade or p.id_unidade is null)
  order by (p.id_unidade = v_agendamento.id_unidade) desc,
    p.vigente_desde desc, p.id desc limit 1;
  if v_agendamento.inicio <= now() + make_interval(mins => coalesce(v_antecedencia, 1440)) then
    raise exception 'O prazo para reagendamento online desta reserva ja terminou.';
  end if;

  select * into v_item from public.agendamentos_servicos item
  where item.id_empresa = p_id_empresa and item.id_agendamento = p_id_agendamento
    and item.status <> 'cancelado'
  order by item.ordem, item.id limit 1 for update;
  if not found then raise exception 'Servico do agendamento nao encontrado.'; end if;

  v_primeiro := least(v_item.id_funcionario, p_id_funcionario);
  v_segundo := greatest(v_item.id_funcionario, p_id_funcionario);
  perform pg_advisory_xact_lock(hashtextextended(p_id_empresa::text || ':' || v_primeiro::text, 0));
  if v_segundo <> v_primeiro then
    perform pg_advisory_xact_lock(hashtextextended(p_id_empresa::text || ':' || v_segundo::text, 0));
  end if;

  update public.agendamentos_servicos set status = 'cancelado', updated_at = now()
  where id_empresa = v_item.id_empresa and id = v_item.id;

  select coalesce(u.fuso_horario, e.fuso_horario, 'America/Sao_Paulo') into v_fuso
  from public.unidades u join public.empresas e on e.id = u.id_empresa
  where u.id_empresa = p_id_empresa and u.id = v_agendamento.id_unidade;

  select exists (
    select 1 from jsonb_array_elements(private.obter_disponibilidade_site(
      p_id_empresa, v_agendamento.id_unidade,
      (p_inicio at time zone v_fuso)::date,
      v_item.id_servico, p_id_funcionario
    )) slot
    where (slot->>'id_funcionario')::bigint = p_id_funcionario
      and (slot->>'inicio')::timestamptz = p_inicio
  ) into v_disponivel;
  if not v_disponivel then
    raise exception using errcode = '23P01',
      message = 'Este horario nao esta mais disponivel. Escolha outro horario.';
  end if;

  v_fim := p_inicio + make_interval(mins => v_item.duracao_minutos);
  perform private.cancelar_mensagens_agendamento(p_id_empresa, p_id_agendamento);

  update public.agendamentos
  set inicio = p_inicio, fim = v_fim,
      site_access_token = v_novo_token,
      site_access_token_expires_at = now() + interval '90 days',
      site_access_token_use_count = 0,
      updated_at = now()
  where id_empresa = p_id_empresa and id = p_id_agendamento;

  update public.agendamentos_servicos
  set id_funcionario = p_id_funcionario, inicio = p_inicio, fim = v_fim,
      status = 'reservado', updated_at = now()
  where id_empresa = v_item.id_empresa and id = v_item.id;

  update public.tokens_links_agendamento set revogado_em = now()
  where id_empresa = p_id_empresa and id_agendamento = p_id_agendamento
    and revogado_em is null;
  perform private.enfileirar_mensagem_agendamento(
    p_id_empresa, p_id_agendamento, 'reagendamento', true
  );
  return v_novo_token;
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
  v_resultado jsonb;
  v_status_agendamento text;
begin
  select p.id, p.id_empresa, p.id_agendamento, p.valor into v_pagamento
  from public.pagamentos p
  where p.provedor = 'mercado_pago' and p.identificador_externo = p_order_id
  order by p.id desc limit 1 for update;
  if not found then return null; end if;

  if nullif(btrim(p_external_reference), '') is null
     or p_external_reference <> v_pagamento.id_agendamento::text then
    update public.pagamentos
    set status = 'em_disputa', provedor_status = coalesce(p_status, 'unknown'),
        provedor_status_detalhe = 'referencia_divergente',
        provedor_atualizado_em = now(), updated_at = now()
    where id = v_pagamento.id;
    update public.agendamentos set pagamento_status = 'em_disputa', updated_at = now()
    where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento;
    return private.pagamento_mercado_pago_json(v_pagamento.id);
  end if;

  v_resultado := public.aplicar_order_mercado_pago(
    p_order_id, p_status, p_status_detail,
    p_transaction_status, p_transaction_status_detail,
    p_paid_amount, p_paid_at
  );

  select a.status into v_status_agendamento
  from public.agendamentos a
  where a.id_empresa = v_pagamento.id_empresa and a.id = v_pagamento.id_agendamento;

  if v_status_agendamento = 'cancelado'
     and v_resultado->>'status' = 'confirmado' then
    insert into public.solicitacoes_estorno_agendamento (
      id_empresa, id_agendamento, id_pagamento, valor,
      status, motivo, chave_idempotencia
    ) values (
      v_pagamento.id_empresa, v_pagamento.id_agendamento, v_pagamento.id,
      v_pagamento.valor, 'pendente',
      'Pix acreditado depois que o agendamento ja estava cancelado.',
      md5('mp-late-payment-refund:' || v_pagamento.id::text)::uuid
    ) on conflict do nothing;
  end if;

  return v_resultado;
end;
$$;

comment on function public.obter_area_cliente_site(bigint) is
  'Retorna a area autenticada com acoes coerentes com prazo e estado do sinal.';
comment on function private.reagendar_agendamento_core(bigint,bigint,bigint,timestamptz,text) is
  'Reagenda atomicamente e bloqueia reservas com sinal ainda pendente.';
comment on function public.aplicar_order_mercado_pago_v2(text,text,text,text,text,text,numeric,timestamptz) is
  'Aplica estado autoritativo e agenda estorno integral para Pix tardio em reserva cancelada.';
