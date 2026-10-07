-- Lota a agenda de domingo, 30/08/2026, para validar a visao diaria e os
-- filtros simultaneos de profissionais. A carga e idempotente e restrita
-- a empresa ficticia de desenvolvimento Murakami Beauty (ID 10).

do $$
declare
  v_empresa_id bigint;
  v_fuso text;
  v_data constant date := date '2026-08-30';
  v_clientes bigint[];
  v_total_profissionais integer;
  v_total_intervalos_ocupados integer;
  v_criados integer := 0;
  v_profissional record;
  v_indice_intervalo integer;
  v_cliente_id bigint;
  v_servico_id bigint;
  v_preco numeric;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_observacoes text;
  v_agendamento_id bigint;
begin
  select e.id, coalesce(e.fuso_horario, 'America/Sao_Paulo')
    into v_empresa_id, v_fuso
  from public.empresas e
  where e.id = 10
    and lower(btrim(e.fantasia)) = lower('Murakami Beauty');

  if not found then
    raise notice 'Agenda lotada ignorada: empresa Murakami Beauty (ID 10) nao encontrada.';
    return;
  end if;

  select array_agg(c.id order by c.id)
    into v_clientes
  from public.clientes c
  where c.id_empresa = v_empresa_id
    and c.ativo;

  if coalesce(array_length(v_clientes, 1), 0) < 6 then
    raise exception 'A carga de agenda lotada precisa de pelo menos seis clientes ativos.';
  end if;

  select count(*)
    into v_total_profissionais
  from public.funcionarios f
  where f.id_empresa = v_empresa_id
    and f.ativo
    and f.atende_clientes;

  if v_total_profissionais = 0 then
    raise exception 'A carga de agenda lotada precisa de profissionais ativos.';
  end if;

  -- 30/08/2026 e domingo. Esta jornada excepcional faz o dia aparecer como
  -- expediente regular na interface, das 08:00 as 19:00 e sem intervalo.
  insert into public.funcionarios_horarios (
    id_empresa, id_funcionario, dia_semana, hora_inicio, hora_fim,
    intervalo_inicio, intervalo_fim, ativo
  )
  select
    v_empresa_id, f.id, 0, time '08:00', time '19:00', null, null, true
  from public.funcionarios f
  where f.id_empresa = v_empresa_id
    and f.ativo
    and f.atende_clientes
  on conflict (id_empresa, id_funcionario, dia_semana, hora_inicio, hora_fim)
  do update set
    intervalo_inicio = null,
    intervalo_fim = null,
    ativo = true;

  for v_profissional in
    select
      f.id,
      f.nome,
      row_number() over (order by f.nome, f.id)::integer as ordem
    from public.funcionarios f
    where f.id_empresa = v_empresa_id
      and f.ativo
      and f.atende_clientes
    order by f.nome, f.id
  loop
    select
      s.id,
      coalesce(fs.valor_personalizado, s.preco)
      into v_servico_id, v_preco
    from public.funcionarios_servicos fs
    join public.servicos s
      on s.id_empresa = fs.id_empresa
     and s.id = fs.id_servico
    where fs.id_empresa = v_empresa_id
      and fs.id_funcionario = v_profissional.id
      and fs.ativo
      and s.ativo
      and coalesce(fs.duracao_personalizada, s.duracao_minutos) = 30
    order by s.preco desc, s.id
    limit 1;

    if not found then
      raise exception 'O profissional % precisa de um servico ativo com 30 minutos.', v_profissional.nome;
    end if;

    -- Vinte e dois intervalos de meia hora cobrem continuamente 08:00-19:00.
    for v_indice_intervalo in 0..21 loop
      v_inicio := (
        v_data + time '08:00' + make_interval(mins => v_indice_intervalo * 30)
      ) at time zone v_fuso;
      v_fim := v_inicio + interval '30 minutes';
      v_cliente_id := v_clientes[
        mod(
          v_indice_intervalo * v_total_profissionais + v_profissional.ordem - 1,
          array_length(v_clientes, 1)
        ) + 1
      ];
      v_observacoes := format(
        '[DEMO LOTACAO 2026-08-30 F%s H%s] Agenda cheia para teste de filtros.',
        v_profissional.id,
        to_char(v_inicio at time zone v_fuso, 'HH24MI')
      );

      -- Preserva qualquer atendimento que eventualmente ja ocupe o intervalo.
      if not exists (
        select 1
        from public.agendamentos_servicos ags
        where ags.id_empresa = v_empresa_id
          and ags.id_funcionario = v_profissional.id
          and ags.status <> 'cancelado'
          and tstzrange(ags.inicio, ags.fim, '[)') && tstzrange(v_inicio, v_fim, '[)')
      ) then
        v_agendamento_id := public.salvar_agendamento(
          null,
          v_empresa_id,
          v_cliente_id,
          v_observacoes,
          'nao_exigido',
          null,
          jsonb_build_array(jsonb_build_object(
            'id_servico', v_servico_id,
            'id_funcionario', v_profissional.id,
            'inicio', v_inicio,
            'fim', v_fim,
            'duracao_minutos', 30,
            'preco', v_preco,
            'ordem', 1,
            'observacoes', '[DADO FICTICIO] Intervalo da agenda lotada de 30/08/2026.'
          ))
        );

        update public.agendamentos
        set status = 'confirmado',
            origem = case mod(v_indice_intervalo + v_profissional.ordem, 3)
              when 0 then 'site'
              when 1 then 'aplicativo'
              else 'sistema'
            end
        where id_empresa = v_empresa_id
          and id = v_agendamento_id;

        v_criados := v_criados + 1;
      end if;
    end loop;
  end loop;

  -- A migration falha integralmente se algum dos 22 intervalos de qualquer
  -- profissional continuar livre; assim nunca deixa uma carga pela metade.
  select count(*)
    into v_total_intervalos_ocupados
  from public.funcionarios f
  cross join generate_series(0, 21) as slot(indice)
  where f.id_empresa = v_empresa_id
    and f.ativo
    and f.atende_clientes
    and exists (
      select 1
      from public.agendamentos_servicos ags
      where ags.id_empresa = v_empresa_id
        and ags.id_funcionario = f.id
        and ags.status <> 'cancelado'
        and tstzrange(ags.inicio, ags.fim, '[)') && tstzrange(
          (v_data + time '08:00' + make_interval(mins => slot.indice * 30)) at time zone v_fuso,
          (v_data + time '08:30' + make_interval(mins => slot.indice * 30)) at time zone v_fuso,
          '[)'
        )
    );

  if v_total_intervalos_ocupados <> v_total_profissionais * 22 then
    raise exception
      'Carga incompleta: % de % intervalos profissionais foram ocupados.',
      v_total_intervalos_ocupados,
      v_total_profissionais * 22;
  end if;

  raise notice
    'Agenda de 30/08/2026 lotada: % profissionais, % intervalos ocupados, % agendamentos novos.',
    v_total_profissionais,
    v_total_intervalos_ocupados,
    v_criados;
end;
$$;
