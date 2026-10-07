-- Testes transacionais da migration 20260908120000. Tudo é revertido no final.
begin;

do $$
declare
  v_origem record;
  v_agendamento bigint;
  v_pagamento bigint;
  v_resultado jsonb;
  v_quantidade integer;
begin
  select p.id_empresa, p.id_forma_pagamento, p.valor, a.id_unidade, a.id_cliente
    into v_origem
  from public.pagamentos p
  join public.agendamentos a
    on a.id_empresa = p.id_empresa and a.id = p.id_agendamento
  where p.provedor = 'mercado_pago'
  order by p.id desc limit 1;
  if not found then
    raise exception 'TESTE: nao existe pagamento Mercado Pago de referencia.';
  end if;

  insert into public.agendamentos (
    id_empresa, id_unidade, id_cliente, inicio, fim, observacoes,
    sinal_status, sinal_valor, pagamento_status, status, origem,
    site_access_token, site_booking_key, site_notification_preferences,
    cancelado_em, motivo_cancelamento
  ) values (
    v_origem.id_empresa, v_origem.id_unidade, v_origem.id_cliente,
    now() + interval '30 days', now() + interval '30 days 1 hour',
    '[TESTE PIX TARDIO FASE 13.11]', 'pendente', v_origem.valor,
    'cancelado', 'cancelado', 'sistema', gen_random_uuid(), gen_random_uuid(),
    '{"whatsapp":false,"email":false}'::jsonb, now(), 'Cancelado antes da acreditacao.'
  ) returning id into v_agendamento;

  insert into public.pagamentos (
    id_empresa, tipo, id_forma_pagamento, data_pagamento,
    valor, valor_alocado, status, referencia, observacoes,
    id_agendamento, provedor, identificador_externo, chave_idempotencia,
    provedor_status, provedor_status_detalhe, expira_em, provedor_atualizado_em
  ) values (
    v_origem.id_empresa, 'entrada', v_origem.id_forma_pagamento, now(),
    v_origem.valor, 0, 'processando', 'TESTE PIX TARDIO',
    'Pagamento ficticio transacional.', v_agendamento, 'mercado_pago',
    'ORDER_LATE_' || v_agendamento::text, gen_random_uuid()::text,
    'processing', 'in_process', now() - interval '1 minute', now()
  ) returning id into v_pagamento;

  select public.aplicar_order_mercado_pago_v2(
    'ORDER_LATE_' || v_agendamento::text, v_agendamento::text,
    'processed', 'accredited', 'processed', 'accredited',
    v_origem.valor, now()
  ) into v_resultado;

  if v_resultado->>'status' <> 'confirmado' then
    raise exception 'TESTE: Pix tardio acreditado nao foi reconhecido.';
  end if;
  if (select status from public.agendamentos where id = v_agendamento) <> 'cancelado' then
    raise exception 'TESTE: Pix tardio reativou agendamento cancelado.';
  end if;
  select count(*) into v_quantidade
  from public.solicitacoes_estorno_agendamento r
  where r.id_empresa = v_origem.id_empresa and r.id_pagamento = v_pagamento
    and r.status = 'pendente' and r.valor = v_origem.valor;
  if v_quantidade <> 1 then
    raise exception 'TESTE: Pix tardio nao gerou um unico estorno integral.';
  end if;

  perform public.aplicar_order_mercado_pago_v2(
    'ORDER_LATE_' || v_agendamento::text, v_agendamento::text,
    'processed', 'accredited', 'processed', 'accredited',
    v_origem.valor, now()
  );
  select count(*) into v_quantidade
  from public.solicitacoes_estorno_agendamento r
  where r.id_empresa = v_origem.id_empresa and r.id_pagamento = v_pagamento;
  if v_quantidade <> 1 then
    raise exception 'TESTE: replay do Pix tardio duplicou o estorno.';
  end if;

  if has_function_privilege('anon', 'public.aplicar_order_mercado_pago_v2(text,text,text,text,text,text,numeric,timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.aplicar_order_mercado_pago_v2(text,text,text,text,text,text,numeric,timestamptz)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.aplicar_order_mercado_pago_v2(text,text,text,text,text,text,numeric,timestamptz)', 'EXECUTE') then
    raise exception 'TESTE: permissoes financeiras ficaram incorretas.';
  end if;

  raise notice 'TESTE PIX TARDIO: todos os cenarios passaram.';
end;
$$;

rollback;
