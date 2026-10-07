begin;

do $$
declare
  v_empresa bigint;
  v_unidade bigint;
  v_servico bigint;
  v_data date;
  v_slot jsonb;
  v_novo_slot jsonb;
  v_booking jsonb;
  v_token uuid;
  v_novo_token uuid;
  v_agendamento bigint;
  v_link text;
  v_link_token text;
  v_consumido jsonb;
  v_confirmado_em timestamptz;
  v_confirmacoes integer;
  v_forma_pagamento bigint;
  v_pagamento bigint;
  v_estorno bigint;
  v_bloqueado boolean := false;
begin
  select sp.id_empresa into v_empresa
  from public.sites_publicos sp where sp.slug = 'murakami-beauty';
  select u.id into v_unidade from public.unidades u
  where u.id_empresa = v_empresa and u.ativo
  order by u.principal desc, u.id limit 1;
  select s.id into v_servico from public.servicos s
  where s.id_empresa = v_empresa and s.ativo and s.permite_agendamento_online
    and not s.exige_sinal
  order by s.id limit 1;

  for v_data in select current_date + i from generate_series(3, 20) i loop
    select slot into v_slot
    from jsonb_array_elements(private.obter_disponibilidade_site(
      v_empresa, v_unidade, v_data, v_servico, null
    )) slot limit 1;
    exit when v_slot is not null;
  end loop;
  if v_slot is null then raise exception 'TESTE: nenhum horario inicial disponivel.'; end if;

  v_booking := private.criar_agendamento_site(
    v_empresa, v_unidade, 'Cliente Teste Fluxo', '11988887777',
    'fluxo.confirmacao@example.com', v_servico,
    (v_slot->>'id_funcionario')::bigint, (v_slot->>'inicio')::timestamptz,
    '[TESTE TRANSACIONAL FASE 13.11]', true, true, gen_random_uuid()
  );
  v_token := (v_booking->>'token')::uuid;
  v_agendamento := (v_booking->>'id')::bigint;

  if v_token is null or v_agendamento is null then
    raise exception 'TESTE: reserva nao retornou identificadores.';
  end if;
  if not exists (
    select 1 from public.fila_mensagens m
    where m.id_empresa = v_empresa and m.dados_template->>'agendamento_id' = v_agendamento::text
      and m.dados_template->>'tipo' = 'confirmacao_agendamento' and m.status = 'pendente'
  ) then raise exception 'TESTE: confirmacao inicial nao foi enfileirada.'; end if;

  select m.dados_template->>'link_relativo' into v_link
  from public.fila_mensagens m
  where m.id_empresa = v_empresa and m.dados_template->>'agendamento_id' = v_agendamento::text
    and m.dados_template->>'tipo' = 'confirmacao_agendamento'
  order by m.id desc limit 1;
  v_link_token := split_part(v_link, 'token=', 2);
  v_consumido := public.consumir_token_link_agendamento(v_link_token);
  if (v_consumido->>'booking_token')::uuid <> v_token then
    raise exception 'TESTE: link seguro nao resolveu a reserva correta.';
  end if;

  perform private.alterar_agendamento_site(v_token, 'confirmar', null);
  select a.confirmado_em into v_confirmado_em from public.agendamentos a
  where a.id_empresa = v_empresa and a.id = v_agendamento;
  perform private.alterar_agendamento_site(v_token, 'confirmar', null);
  if (select a.confirmado_em from public.agendamentos a
      where a.id_empresa = v_empresa and a.id = v_agendamento) <> v_confirmado_em then
    raise exception 'TESTE: confirmacao duplicada alterou a data original.';
  end if;
  select count(*) into v_confirmacoes from public.historico_agendamentos h
  where h.id_empresa = v_empresa and h.id_agendamento = v_agendamento
    and h.acao = 'confirmado';
  if v_confirmacoes <> 1 then
    raise exception 'TESTE: confirmacao idempotente gerou historico duplicado.';
  end if;
  if not exists (
    select 1 from public.agendamentos a where a.id = v_agendamento
      and a.confirmacao_origem = 'link_cliente' and a.confirmado_em is not null
  ) then raise exception 'TESTE: origem/data da confirmacao nao registradas.'; end if;

  for v_data in select current_date + i from generate_series(3, 20) i loop
    select slot into v_novo_slot
    from jsonb_array_elements(private.obter_disponibilidade_site(
      v_empresa, v_unidade, v_data, v_servico, null
    )) slot
    where (slot->>'inicio')::timestamptz <> (v_slot->>'inicio')::timestamptz
    limit 1;
    exit when v_novo_slot is not null;
  end loop;
  if v_novo_slot is null then raise exception 'TESTE: nenhum segundo horario disponivel.'; end if;

  update public.agendamentos
  set sinal_status = 'pendente', sinal_valor = 1, pagamento_status = 'pendente'
  where id_empresa = v_empresa and id = v_agendamento;
  begin
    perform private.reagendar_agendamento_site(
      v_token, (v_novo_slot->>'id_funcionario')::bigint,
      (v_novo_slot->>'inicio')::timestamptz
    );
  exception when sqlstate '55000' then
    v_bloqueado := true;
  end;
  if not v_bloqueado then
    raise exception 'TESTE: reagendamento foi permitido com sinal pendente.';
  end if;
  if not exists (
    select 1 from public.agendamentos a
    where a.id_empresa = v_empresa and a.id = v_agendamento
      and a.inicio = (v_slot->>'inicio')::timestamptz
  ) then raise exception 'TESTE: tentativa bloqueada alterou o horario original.'; end if;
  update public.agendamentos
  set sinal_status = 'nao_exigido', sinal_valor = null,
      pagamento_status = 'nao_exigido'
  where id_empresa = v_empresa and id = v_agendamento;
  v_bloqueado := false;

  v_booking := private.reagendar_agendamento_site(
    v_token, (v_novo_slot->>'id_funcionario')::bigint,
    (v_novo_slot->>'inicio')::timestamptz
  );
  v_novo_token := (v_booking->>'token')::uuid;
  if v_novo_token is null or v_novo_token = v_token then
    raise exception 'TESTE: reagendamento nao rotacionou o token interno.';
  end if;
  if private.obter_agendamento_site(v_token) is not null then
    raise exception 'TESTE: token antigo continuou valido apos reagendamento.';
  end if;
  if not exists (
    select 1 from jsonb_array_elements(private.obter_disponibilidade_site(
      v_empresa, v_unidade,
      ((v_slot->>'inicio')::timestamptz at time zone 'America/Sao_Paulo')::date,
      v_servico, (v_slot->>'id_funcionario')::bigint
    )) s where (s->>'inicio')::timestamptz = (v_slot->>'inicio')::timestamptz
  ) then raise exception 'TESTE: horario antigo nao foi liberado.'; end if;
  if exists (
    select 1 from jsonb_array_elements(private.obter_disponibilidade_site(
      v_empresa, v_unidade,
      ((v_novo_slot->>'inicio')::timestamptz at time zone 'America/Sao_Paulo')::date,
      v_servico, (v_novo_slot->>'id_funcionario')::bigint
    )) s where (s->>'inicio')::timestamptz = (v_novo_slot->>'inicio')::timestamptz
  ) then raise exception 'TESTE: novo horario nao ficou reservado.'; end if;
  if not exists (
    select 1 from public.fila_mensagens m
    where m.id_empresa = v_empresa and m.dados_template->>'agendamento_id' = v_agendamento::text
      and m.dados_template->>'tipo' = 'reagendamento' and m.status = 'pendente'
  ) then raise exception 'TESTE: nova confirmacao nao foi enfileirada.'; end if;

  select f.id into v_forma_pagamento from public.formas_pagamento f
  where f.id_empresa = v_empresa and f.tipo = 'pix' and f.ativo
  order by f.id limit 1;
  update public.agendamentos
  set sinal_status = 'pago', sinal_valor = 1, sinal_pago_em = now(),
      pagamento_status = 'pago'
  where id_empresa = v_empresa and id = v_agendamento;
  insert into public.pagamentos (
    id_empresa, tipo, id_forma_pagamento, data_pagamento,
    valor, valor_alocado, status, referencia, observacoes,
    id_agendamento, provedor, identificador_externo, chave_idempotencia
  ) values (
    v_empresa, 'entrada', v_forma_pagamento, now(),
    1, 0, 'confirmado', 'TESTE FASE 13.11', 'Pagamento ficticio transacional.',
    v_agendamento, 'mercado_pago', 'ORD_TEST_REFUND_' || v_agendamento::text,
    'refund-test-' || gen_random_uuid()::text
  ) returning id into v_pagamento;

  insert into public.fila_mensagens (
    id_empresa, id_cliente, canal, destinatario, assunto, conteudo,
    dados_template, status, prioridade, agendada_para,
    tentativas, max_tentativas, chave_idempotencia
  ) select a.id_empresa, a.id_cliente, 'email', 'fluxo.confirmacao@example.com',
    'Lembrete teste', 'Lembrete pendente do teste.',
    jsonb_build_object('tipo','lembrete_agendamento','agendamento_id',a.id),
    'pendente', 10, now() + interval '1 day', 0, 5,
    'teste-lembrete-' || a.id::text
  from public.agendamentos a where a.id = v_agendamento;

  perform private.alterar_agendamento_site(v_novo_token, 'cancelar', 'Mudanca de planos no teste.');
  perform private.alterar_agendamento_site(v_novo_token, 'cancelar', 'Repeticao idempotente.');
  if not exists (
    select 1 from public.agendamentos a where a.id = v_agendamento
      and a.status = 'cancelado' and a.cancelamento_origem = 'link_cliente'
      and a.cancelado_por_cliente = a.id_cliente
      and a.motivo_cancelamento = 'Mudanca de planos no teste.'
  ) then raise exception 'TESTE: cancelamento/responsavel/motivo incorretos.'; end if;
  select r.id into v_estorno from public.solicitacoes_estorno_agendamento r
  where r.id_empresa = v_empresa and r.id_agendamento = v_agendamento
    and r.id_pagamento = v_pagamento and r.valor = 1 and r.status = 'pendente';
  if v_estorno is null then
    raise exception 'TESTE: politica nao criou solicitacao de estorno idempotente.';
  end if;
  perform private.alterar_agendamento_site(v_novo_token, 'cancelar', 'Terceira repeticao.');
  if (select count(*) from public.solicitacoes_estorno_agendamento r
      where r.id_empresa = v_empresa and r.id_pagamento = v_pagamento) <> 1 then
    raise exception 'TESTE: cancelamento repetido duplicou o estorno.';
  end if;
  perform 1 from public.reivindicar_estornos_agendamento(1, v_agendamento)
  where request_id = v_estorno;
  if not found then raise exception 'TESTE: processador nao reivindicou o estorno.'; end if;
  perform public.concluir_estorno_agendamento(v_estorno, 'processed', 'refunded');
  perform public.concluir_estorno_agendamento(v_estorno, 'processed', 'refunded');
  if not exists (
    select 1 from public.solicitacoes_estorno_agendamento r
    join public.pagamentos p on p.id_empresa = r.id_empresa and p.id = r.id_pagamento
    join public.agendamentos a on a.id_empresa = r.id_empresa and a.id = r.id_agendamento
    where r.id = v_estorno and r.status = 'confirmado'
      and p.status = 'estornado' and a.sinal_status = 'estornado'
      and a.pagamento_status = 'estornado'
  ) then raise exception 'TESTE: conclusao do estorno nao sincronizou os estados.'; end if;
  if exists (
    select 1 from public.fila_mensagens m
    where m.id_empresa = v_empresa and m.dados_template->>'agendamento_id' = v_agendamento::text
      and m.dados_template->>'tipo' = 'lembrete_agendamento' and m.status <> 'cancelada'
  ) then raise exception 'TESTE: lembrete pendente nao foi cancelado.'; end if;
  if not exists (
    select 1 from jsonb_array_elements(private.obter_disponibilidade_site(
      v_empresa, v_unidade,
      ((v_novo_slot->>'inicio')::timestamptz at time zone 'America/Sao_Paulo')::date,
      v_servico, (v_novo_slot->>'id_funcionario')::bigint
    )) s where (s->>'inicio')::timestamptz = (v_novo_slot->>'inicio')::timestamptz
  ) then raise exception 'TESTE: cancelamento nao liberou o horario.'; end if;

  v_booking := private.emitir_token_link_agendamento(
    v_empresa, v_agendamento, 'gerenciar', interval '5 minutes'
  );
  v_link_token := v_booking->>'token';
  update public.tokens_links_agendamento set max_usos = 1
  where token_hash = encode(extensions.digest(v_link_token, 'sha256'), 'hex');
  perform public.consumir_token_link_agendamento(v_link_token);
  begin
    perform public.consumir_token_link_agendamento(v_link_token);
  exception when others then
    v_bloqueado := true;
  end;
  if not v_bloqueado then raise exception 'TESTE: limite de uso do link nao foi aplicado.'; end if;

  if has_function_privilege('anon', 'public.consumir_token_link_agendamento(text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.consumir_token_link_agendamento(text)', 'EXECUTE') then
    raise exception 'TESTE: permissoes do consumidor de link estao incorretas.';
  end if;
  if has_function_privilege('anon', 'public.reivindicar_estornos_agendamento(integer,bigint)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.reivindicar_estornos_agendamento(integer,bigint)', 'EXECUTE') then
    raise exception 'TESTE: permissoes do processador de estorno estao incorretas.';
  end if;

  raise notice 'TESTE FASE 13.11: todos os cenarios transacionais passaram.';
end;
$$;

rollback;
