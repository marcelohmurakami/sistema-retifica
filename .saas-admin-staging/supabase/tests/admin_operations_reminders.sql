-- Testes transacionais da integração painel/site. Nenhum dado permanece no banco.
begin;

do $$
declare
  v_empresa bigint;
  v_unidade bigint;
  v_usuario uuid;
  v_cliente bigint;
  v_servico bigint;
  v_data date;
  v_slot jsonb;
  v_agendamento bigint;
  v_resultado jsonb;
  v_bloqueado boolean := false;
  v_confirmacoes integer;
begin
  select sp.id_empresa into v_empresa
  from public.sites_publicos sp where sp.slug = 'murakami-beauty';
  select ue.user_id into v_usuario
  from public.usuarios_empresas ue
  where ue.empresa_id = v_empresa and ue.tipo in ('dono', 'gerente') and ue.status = 'ativo'
  order by (ue.tipo = 'dono') desc, ue.id limit 1;
  if v_empresa is null or v_usuario is null then
    raise exception 'TESTE ADMIN: empresa ou usuário gestor não encontrado.';
  end if;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_usuario, 'role', 'authenticated'
  )::text, true);

  select u.id into v_unidade from public.unidades u
  where u.id_empresa = v_empresa and u.ativo
  order by u.principal desc, u.id limit 1;
  select c.id into v_cliente from public.clientes c
  where c.id_empresa = v_empresa and c.ativo and nullif(c.email, '') is not null
  order by c.id limit 1;
  select s.id into v_servico from public.servicos s
  where s.id_empresa = v_empresa and s.ativo and s.permite_agendamento_online and not s.exige_sinal
  order by s.id limit 1;

  for v_data in select current_date + i from generate_series(3, 25) i loop
    select slot into v_slot from jsonb_array_elements(private.obter_disponibilidade_site(
      v_empresa, v_unidade, v_data, v_servico, null
    )) slot limit 1;
    exit when v_slot is not null;
  end loop;
  if v_slot is null then raise exception 'TESTE ADMIN: nenhum horário disponível.'; end if;

  perform public.salvar_configuracao_lembretes_administracao(
    v_empresa, true, true, true, array[2880, 1440], 4
  );
  v_agendamento := public.salvar_agendamento_administracao(
    null, v_empresa, v_cliente, '[TESTE ADMIN FASE 13]', 'nao_exigido', null,
    jsonb_build_array(jsonb_build_object(
      'id_servico', v_servico,
      'id_funcionario', (v_slot->>'id_funcionario')::bigint,
      'inicio', (v_slot->>'inicio')::timestamptz,
      'fim', (v_slot->>'fim')::timestamptz,
      'duracao_minutos', (v_slot->>'duracao_minutos')::integer,
      'preco', (v_slot->>'preco')::numeric,
      'ordem', 1,
      'observacoes', ''
    ))
  );
  if v_agendamento is null then raise exception 'TESTE ADMIN: agendamento manual não foi criado.'; end if;
  if not exists (
    select 1 from public.fila_mensagens m
    where m.id_empresa = v_empresa and m.dados_template->>'agendamento_id' = v_agendamento::text
      and m.dados_template->>'tipo' = 'confirmacao_agendamento' and m.status = 'pendente'
  ) then raise exception 'TESTE ADMIN: confirmação inicial não foi enfileirada.'; end if;
  if not exists (
    select 1 from public.fila_mensagens m
    where m.id_empresa = v_empresa and m.dados_template->>'agendamento_id' = v_agendamento::text
      and m.dados_template->>'tipo' = 'lembrete_agendamento' and m.status = 'pendente'
  ) then raise exception 'TESTE ADMIN: lembretes não foram programados.'; end if;

  v_resultado := public.reenviar_confirmacao_agendamento_administracao(v_empresa, v_agendamento);
  if coalesce((v_resultado->>'queued')::integer, 0) < 1 then
    raise exception 'TESTE ADMIN: reenvio não criou nenhuma mensagem.';
  end if;
  begin
    perform public.reenviar_confirmacao_agendamento_administracao(v_empresa, v_agendamento);
  exception when others then
    v_bloqueado := true;
  end;
  if not v_bloqueado then raise exception 'TESTE ADMIN: proteção contra reenvio duplicado falhou.'; end if;

  perform public.alterar_agendamento_administracao(v_empresa, v_agendamento, 'confirmado', null);
  perform public.alterar_agendamento_administracao(v_empresa, v_agendamento, 'confirmado', null);
  select count(*) into v_confirmacoes from public.historico_agendamentos h
  where h.id_empresa = v_empresa and h.id_agendamento = v_agendamento and h.acao = 'confirmado';
  if v_confirmacoes <> 1 then raise exception 'TESTE ADMIN: confirmação idempotente duplicou o histórico.'; end if;

  perform public.alterar_agendamento_administracao(
    v_empresa, v_agendamento, 'cancelado', 'Cancelamento administrativo de teste.'
  );
  if not exists (
    select 1 from public.agendamentos a
    where a.id_empresa = v_empresa and a.id = v_agendamento and a.status = 'cancelado'
      and a.cancelamento_origem = 'painel_administrativo'
      and a.cancelado_por_usuario = v_usuario
  ) then raise exception 'TESTE ADMIN: cancelamento não registrou origem/responsável.'; end if;
  if exists (
    select 1 from public.fila_mensagens m
    where m.id_empresa = v_empresa and m.dados_template->>'agendamento_id' = v_agendamento::text
      and m.dados_template->>'tipo' = 'lembrete_agendamento' and m.status <> 'cancelada'
  ) then raise exception 'TESTE ADMIN: cancelamento deixou lembrete ativo.'; end if;
  if not exists (
    select 1 from public.fila_mensagens m
    where m.id_empresa = v_empresa and m.dados_template->>'agendamento_id' = v_agendamento::text
      and m.dados_template->>'tipo' = 'cancelamento' and m.status = 'pendente'
  ) then raise exception 'TESTE ADMIN: aviso de cancelamento não foi enfileirado.'; end if;

  if has_function_privilege('anon', 'public.alterar_agendamento_administracao(bigint,bigint,text,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.alterar_agendamento_administracao(bigint,bigint,text,text)', 'EXECUTE') then
    raise exception 'TESTE ADMIN: permissões do RPC administrativo estão incorretas.';
  end if;
  raise notice 'TESTE ADMIN: operações, reenvio, lembretes e segurança passaram.';
end;
$$;

rollback;
