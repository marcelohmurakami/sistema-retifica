-- Testes transacionais: execute no SQL Editor depois da migration 20260904180000.
-- Todas as alterações abaixo são revertidas no final.
begin;

do $$
declare
  v_origem record;
  v_agendamento_id bigint;
  v_pagamento record;
  v_preparado jsonb;
  v_preparado_repetido jsonb;
  v_resultado jsonb;
  v_expirados integer;
begin
  select p.id_empresa, p.id_forma_pagamento, p.valor,
         a.id_unidade, a.id_cliente
    into v_origem
  from public.pagamentos p
  join public.agendamentos a
    on a.id_empresa = p.id_empresa and a.id = p.id_agendamento
  where p.provedor = 'mercado_pago'
  order by p.id desc
  limit 1;
  if not found then
    raise exception 'TESTE: não existe pagamento sandbox do Mercado Pago para validar.';
  end if;

  insert into public.agendamentos (
    id_empresa, id_unidade, id_cliente, inicio, fim, observacoes,
    sinal_status, sinal_valor, pagamento_status, status, origem,
    site_access_token, site_booking_key, site_notification_preferences
  ) values (
    v_origem.id_empresa, v_origem.id_unidade, v_origem.id_cliente,
    now() + interval '30 days', now() + interval '30 days 1 hour',
    '[TESTE TRANSACIONAL] Reserva temporária Mercado Pago.',
    'pendente', v_origem.valor, 'processando', 'aguardando_pagamento', 'sistema',
    gen_random_uuid(), gen_random_uuid(), '{"whatsapp":false,"email":false}'::jsonb
  ) returning id into v_agendamento_id;

  select public.preparar_pagamento_mercado_pago(
    v_origem.id_empresa, v_agendamento_id, gen_random_uuid()::text
  ) into v_preparado;
  select public.preparar_pagamento_mercado_pago(
    v_origem.id_empresa, v_agendamento_id, gen_random_uuid()::text
  ) into v_preparado_repetido;
  if v_preparado ->> 'payment_id' <> v_preparado_repetido ->> 'payment_id'
     or v_preparado ->> 'idempotency_key' <> v_preparado_repetido ->> 'idempotency_key' then
    raise exception 'TESTE: preparação repetida criou outra intenção de pagamento.';
  end if;

  update public.pagamentos
  set status = 'processando', identificador_externo = 'test-audit-' || gen_random_uuid()::text,
      provedor_status = 'created', provedor_status_detalhe = 'created',
      expira_em = now() - interval '1 minute', provedor_atualizado_em = now()
  where id = (v_preparado ->> 'payment_id')::bigint
  returning * into v_pagamento;

  -- Uma order externa pendente nunca é cancelada só pelo relógio local.
  select public.expirar_pagamentos_mercado_pago(v_pagamento.id_empresa) into v_expirados;
  if v_expirados <> 0 or (select status from public.pagamentos where id = v_pagamento.id) = 'cancelado' then
    raise exception 'TESTE: expiração local cancelou uma order externa não conciliada.';
  end if;

  -- Order processada sem transaction acreditada não confirma dinheiro.
  select public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, v_pagamento.id_agendamento::text,
    'processed', 'accredited', 'processing', 'in_process',
    v_pagamento.valor, now()
  ) into v_resultado;
  if v_resultado ->> 'status' = 'confirmado' then
    raise exception 'TESTE: pagamento confirmou sem transaction accredited.';
  end if;

  -- Valor pago divergente vai para análise e não confirma o agendamento.
  select public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, v_pagamento.id_agendamento::text,
    'processed', 'accredited', 'processed', 'accredited',
    v_pagamento.valor + 1, now()
  ) into v_resultado;
  if v_resultado ->> 'status' <> 'em_disputa'
     or (select status from public.agendamentos where id = v_pagamento.id_agendamento) = 'confirmado' then
    raise exception 'TESTE: divergência de valor não foi isolada corretamente.';
  end if;

  update public.pagamentos set status = 'processando' where id = v_pagamento.id;
  update public.agendamentos set pagamento_status = 'processando'
  where id_empresa = v_pagamento.id_empresa and id = v_pagamento.id_agendamento;

  -- Referência de outro agendamento também exige análise.
  select public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, '999999999',
    'processed', 'accredited', 'processed', 'accredited',
    v_pagamento.valor, now()
  ) into v_resultado;
  if v_resultado ->> 'provider_status_detail' <> 'referencia_divergente'
     or v_resultado ->> 'status' <> 'em_disputa' then
    raise exception 'TESTE: referência externa divergente não foi bloqueada.';
  end if;

  -- Pagamento exato confirma; repetir o mesmo evento é idempotente.
  select public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, v_pagamento.id_agendamento::text,
    'processed', 'accredited', 'processed', 'accredited',
    v_pagamento.valor, now()
  ) into v_resultado;
  if v_resultado ->> 'status' <> 'confirmado'
     or (select pagamento_status from public.agendamentos where id = v_pagamento.id_agendamento) <> 'pago' then
    raise exception 'TESTE: confirmação exata não concluiu o sinal.';
  end if;
  perform public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, v_pagamento.id_agendamento::text,
    'processed', 'accredited', 'processed', 'accredited',
    v_pagamento.valor, now()
  );
  if (select status from public.pagamentos where id = v_pagamento.id) <> 'confirmado' then
    raise exception 'TESTE: replay alterou pagamento confirmado.';
  end if;

  -- Estado antigo não rebaixa confirmação.
  perform public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, v_pagamento.id_agendamento::text,
    'created', 'created', 'created', 'created', 0, null
  );
  if (select status from public.pagamentos where id = v_pagamento.id) <> 'confirmado' then
    raise exception 'TESTE: evento antigo rebaixou pagamento confirmado.';
  end if;

  -- Estorno parcial/chargeback entra em análise; estorno integral é terminal.
  perform public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, v_pagamento.id_agendamento::text,
    'processed', 'partially_refunded', 'processed', 'accredited',
    v_pagamento.valor, now()
  );
  if (select status from public.pagamentos where id = v_pagamento.id) <> 'em_disputa' then
    raise exception 'TESTE: estorno parcial não entrou em análise.';
  end if;
  perform public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, v_pagamento.id_agendamento::text,
    'refunded', 'refunded', 'refunded', 'refunded', 0, null
  );
  if (select status from public.pagamentos where id = v_pagamento.id) <> 'estornado'
     or (select pagamento_status from public.agendamentos where id = v_pagamento.id_agendamento) <> 'estornado' then
    raise exception 'TESTE: estorno integral não foi aplicado.';
  end if;

  -- Nem mesmo replay acreditado reativa um estorno terminal.
  perform public.aplicar_order_mercado_pago_v2(
    v_pagamento.identificador_externo, v_pagamento.id_agendamento::text,
    'processed', 'accredited', 'processed', 'accredited',
    v_pagamento.valor, now()
  );
  if (select status from public.pagamentos where id = v_pagamento.id) <> 'estornado' then
    raise exception 'TESTE: evento antigo reativou pagamento estornado.';
  end if;

  if has_function_privilege('anon', 'public.aplicar_order_mercado_pago_v2(text,text,text,text,text,text,numeric,timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.aplicar_order_mercado_pago_v2(text,text,text,text,text,text,numeric,timestamptz)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.aplicar_order_mercado_pago_v2(text,text,text,text,text,text,numeric,timestamptz)', 'EXECUTE') then
    raise exception 'TESTE: permissões da conciliação estão incorretas.';
  end if;

  raise notice 'TESTE MERCADO PAGO: todos os cenários transacionais passaram.';
end;
$$;

rollback;
