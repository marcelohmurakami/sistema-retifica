-- Dados ficticios para demonstrar ocupacao real da agenda entre 03 e 12/09/2026.
-- Para cada profissional e dia com jornada, tenta reservar um horario pela
-- manha e outro pela tarde. A propria RPC de disponibilidade escolhe apenas
-- slots livres e respeita unidade, pausas, ausencias, bloqueios e intervalos.

do $$
declare
  v_empresa_id bigint := 10;
  v_unidade_id bigint;
  v_data date;
  v_profissional record;
  v_servico_id bigint;
  v_cliente_id bigint;
  v_total_clientes integer;
  v_indice_cliente integer := 0;
  v_horario_alvo time;
  v_slot jsonb;
  v_agendamento_id bigint;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_duracao integer;
  v_preco numeric(10,2);
  v_inseridos integer := 0;
  v_marcador text := '[DADO FICTICIO][AGENDA 03-12/09/2026]';
begin
  if not exists (
    select 1 from public.empresas e
    where e.id = v_empresa_id and e.status = 'ativo'
  ) then
    raise exception 'Empresa ficticia Murakami Beauty (ID 10) nao encontrada.';
  end if;

  if exists (
    select 1 from public.agendamentos a
    where a.id_empresa = v_empresa_id
      and a.observacoes like v_marcador || '%'
  ) then
    raise notice 'Carga ficticia de 03 a 12/09/2026 ja aplicada; nenhuma linha duplicada.';
    return;
  end if;

  select u.id into v_unidade_id
  from public.unidades u
  where u.id_empresa = v_empresa_id and u.ativo
  order by u.principal desc, u.id
  limit 1;

  if v_unidade_id is null then
    raise exception 'A empresa nao possui unidade ativa.';
  end if;

  select count(*) into v_total_clientes
  from public.clientes c
  where c.id_empresa = v_empresa_id and c.ativo;

  if v_total_clientes = 0 then
    raise exception 'A empresa nao possui clientes ficticios ativos para compor a agenda.';
  end if;

  for v_data in
    select dia::date
    from generate_series(date '2026-09-03', date '2026-09-12', interval '1 day') dia
  loop
    for v_profissional in
      select f.id, f.nome
      from public.funcionarios f
      where f.id_empresa = v_empresa_id
        and f.ativo
        and f.atende_clientes
      order by f.id
    loop
      select s.id into v_servico_id
      from public.servicos s
      left join public.funcionarios_servicos fs
        on fs.id_empresa = s.id_empresa
       and fs.id_servico = s.id
       and fs.id_funcionario = v_profissional.id
       and fs.ativo
      where s.id_empresa = v_empresa_id
        and s.ativo
        and s.permite_agendamento_online
        and (
          not exists (
            select 1
            from public.funcionarios_servicos configuracao
            where configuracao.id_empresa = v_empresa_id
              and configuracao.id_funcionario = v_profissional.id
          )
          or fs.id is not null
        )
      order by s.id
      limit 1;

      if v_servico_id is null then
        continue;
      end if;

      foreach v_horario_alvo in array array[time '10:00', time '15:00']
      loop
        v_slot := null;

        select slot.value into v_slot
        from jsonb_array_elements(private.obter_disponibilidade_site(
          v_empresa_id,
          v_unidade_id,
          v_data,
          v_servico_id,
          v_profissional.id
        )) slot(value)
        where (slot.value->>'horario')::time >= v_horario_alvo
        order by (slot.value->>'inicio')::timestamptz
        limit 1;

        if v_slot is null then
          continue;
        end if;

        select c.id into v_cliente_id
        from public.clientes c
        where c.id_empresa = v_empresa_id and c.ativo
        order by c.id
        offset (v_indice_cliente % v_total_clientes)
        limit 1;

        v_indice_cliente := v_indice_cliente + 1;
        v_inicio := (v_slot->>'inicio')::timestamptz;
        v_fim := (v_slot->>'fim')::timestamptz;
        v_duracao := (v_slot->>'duracao_minutos')::integer;
        v_preco := (v_slot->>'preco')::numeric;

        insert into public.agendamentos (
          id_empresa, id_unidade, id_cliente, inicio, fim,
          observacoes, sinal_status, sinal_valor, pagamento_status,
          status, origem, criado_por, site_notification_preferences
        ) values (
          v_empresa_id, v_unidade_id, v_cliente_id, v_inicio, v_fim,
          v_marcador || ' Reserva demonstrativa distribuida automaticamente.',
          'nao_exigido', null, 'nao_exigido', 'confirmado', 'sistema', null,
          jsonb_build_object('whatsapp', true, 'email', true)
        ) returning id into v_agendamento_id;

        insert into public.agendamentos_servicos (
          id_empresa, id_agendamento, id_servico, id_funcionario,
          inicio, fim, duracao_minutos, preco, ordem, status, observacoes
        ) values (
          v_empresa_id, v_agendamento_id, v_servico_id, v_profissional.id,
          v_inicio, v_fim, v_duracao, v_preco, 1, 'reservado',
          v_marcador || ' Horario ocupado para demonstracao.'
        );

        v_inseridos := v_inseridos + 1;
      end loop;
    end loop;
  end loop;

  if v_inseridos = 0 then
    raise exception 'Nenhum horario livre foi encontrado para a carga ficticia.';
  end if;

  raise notice 'Carga ficticia concluida: % agendamentos criados.', v_inseridos;
end;
$$;
