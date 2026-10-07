-- Dados ficticios para validacao manual da empresa de teste.
-- A carga so e executada quando a empresa 10 ainda se chama Murakami Beauty.
-- Em outros ambientes, esta migracao e deliberadamente um no-op.

do $$
declare
  v_empresa_id bigint;
  v_fuso text;
  v_cliente_ana bigint;
  v_cliente_carlos bigint;
  v_cliente_juliana bigint;
  v_cliente_rafael bigint;
  v_funcionaria_beatriz bigint;
  v_funcionario_diego bigint;
  v_funcionaria_larissa bigint;
  v_servico_1 bigint;
  v_servico_2 bigint;
  v_servico_3 bigint;
  v_duracao_1 integer;
  v_duracao_2 integer;
  v_duracao_3 integer;
  v_preco_1 numeric;
  v_preco_2 numeric;
  v_preco_3 numeric;
  v_data_1 date;
  v_data_2 date;
  v_data_3 date;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_segundo_inicio timestamptz;
  v_segundo_fim timestamptz;
  v_agendamento_id bigint;
  v_total_clientes integer;
  v_total_funcionarios integer;
  v_total_agendamentos integer;
begin
  select e.id, coalesce(e.fuso_horario, 'America/Sao_Paulo')
    into v_empresa_id, v_fuso
  from public.empresas e
  where e.id = 10
    and lower(btrim(e.fantasia)) = lower('Murakami Beauty');

  if not found then
    raise notice 'Carga demo ignorada: a empresa de teste Murakami Beauty (ID 10) nao foi encontrada.';
    return;
  end if;

  insert into public.clientes (
    id_empresa, nome, email, telefone_principal, data_nascimento,
    canal_preferido, observacoes
  )
  select
    v_empresa_id, 'Ana Silva (Teste)', 'ana.silva.demo@example.com',
    '(11) 90000-0001', date '1992-04-12', 'whatsapp',
    '[DADO FICTICIO] Cliente criado para testar cadastros e agenda.'
  where not exists (
    select 1 from public.clientes
    where id_empresa = v_empresa_id and email = 'ana.silva.demo@example.com'
  );

  insert into public.clientes (
    id_empresa, nome, email, telefone_principal, data_nascimento,
    canal_preferido, observacoes
  )
  select
    v_empresa_id, 'Carlos Mendes (Teste)', 'carlos.mendes.demo@example.com',
    '(11) 90000-0002', date '1987-09-23', 'telefone',
    '[DADO FICTICIO] Cliente criado para testar cadastros e agenda.'
  where not exists (
    select 1 from public.clientes
    where id_empresa = v_empresa_id and email = 'carlos.mendes.demo@example.com'
  );

  insert into public.clientes (
    id_empresa, nome, email, telefone_principal, data_nascimento,
    canal_preferido, observacoes
  )
  select
    v_empresa_id, 'Juliana Rocha (Teste)', 'juliana.rocha.demo@example.com',
    '(11) 90000-0003', date '1996-01-08', 'email',
    '[DADO FICTICIO] Cliente criado para testar cadastros e agenda.'
  where not exists (
    select 1 from public.clientes
    where id_empresa = v_empresa_id and email = 'juliana.rocha.demo@example.com'
  );

  insert into public.clientes (
    id_empresa, nome, email, telefone_principal, data_nascimento,
    canal_preferido, observacoes
  )
  select
    v_empresa_id, 'Rafael Almeida (Teste)', 'rafael.almeida.demo@example.com',
    '(11) 90000-0004', date '1990-07-17', 'whatsapp',
    '[DADO FICTICIO] Cliente criado para testar cadastros e agenda.'
  where not exists (
    select 1 from public.clientes
    where id_empresa = v_empresa_id and email = 'rafael.almeida.demo@example.com'
  );

  select id into strict v_cliente_ana
  from public.clientes
  where id_empresa = v_empresa_id and email = 'ana.silva.demo@example.com';

  select id into strict v_cliente_carlos
  from public.clientes
  where id_empresa = v_empresa_id and email = 'carlos.mendes.demo@example.com';

  select id into strict v_cliente_juliana
  from public.clientes
  where id_empresa = v_empresa_id and email = 'juliana.rocha.demo@example.com';

  select id into strict v_cliente_rafael
  from public.clientes
  where id_empresa = v_empresa_id and email = 'rafael.almeida.demo@example.com';

  insert into public.funcionarios (
    id_empresa, nome, email, telefone, cargo, cor_agenda,
    data_admissao, atende_clientes, observacoes
  )
  select
    v_empresa_id, 'Beatriz Costa (Teste)', 'beatriz.costa.demo@example.com',
    '(11) 91000-0001', 'Especialista', '#5B8DEF', current_date - 240,
    true, '[DADO FICTICIO] Profissional criado para testar a agenda.'
  where not exists (
    select 1 from public.funcionarios
    where id_empresa = v_empresa_id and email = 'beatriz.costa.demo@example.com'
  );

  insert into public.funcionarios (
    id_empresa, nome, email, telefone, cargo, cor_agenda,
    data_admissao, atende_clientes, observacoes
  )
  select
    v_empresa_id, 'Diego Martins (Teste)', 'diego.martins.demo@example.com',
    '(11) 91000-0002', 'Profissional', '#2FBF9B', current_date - 180,
    true, '[DADO FICTICIO] Profissional criado para testar a agenda.'
  where not exists (
    select 1 from public.funcionarios
    where id_empresa = v_empresa_id and email = 'diego.martins.demo@example.com'
  );

  insert into public.funcionarios (
    id_empresa, nome, email, telefone, cargo, cor_agenda,
    data_admissao, atende_clientes, observacoes
  )
  select
    v_empresa_id, 'Larissa Nunes (Teste)', 'larissa.nunes.demo@example.com',
    '(11) 91000-0003', 'Profissional', '#A66CE8', current_date - 120,
    true, '[DADO FICTICIO] Profissional criado para testar a agenda.'
  where not exists (
    select 1 from public.funcionarios
    where id_empresa = v_empresa_id and email = 'larissa.nunes.demo@example.com'
  );

  select id into strict v_funcionaria_beatriz
  from public.funcionarios
  where id_empresa = v_empresa_id and email = 'beatriz.costa.demo@example.com';

  select id into strict v_funcionario_diego
  from public.funcionarios
  where id_empresa = v_empresa_id and email = 'diego.martins.demo@example.com';

  select id into strict v_funcionaria_larissa
  from public.funcionarios
  where id_empresa = v_empresa_id and email = 'larissa.nunes.demo@example.com';

  -- Jornada de segunda a sabado, com intervalo de almoco.
  insert into public.funcionarios_horarios (
    id_empresa, id_funcionario, dia_semana, hora_inicio, hora_fim,
    intervalo_inicio, intervalo_fim, ativo
  )
  select
    v_empresa_id, f.id_funcionario, d.dia_semana,
    time '08:00', time '19:00', time '12:00', time '13:00', true
  from unnest(array[
    v_funcionaria_beatriz,
    v_funcionario_diego,
    v_funcionaria_larissa
  ]) as f(id_funcionario)
  cross join generate_series(1, 6) as d(dia_semana)
  where not exists (
    select 1
    from public.funcionarios_horarios h
    where h.id_empresa = v_empresa_id
      and h.id_funcionario = f.id_funcionario
      and h.dia_semana = d.dia_semana
  );

  -- Habilita os servicos ativos para os profissionais ficticios.
  insert into public.funcionarios_servicos (
    id_empresa, id_funcionario, id_servico, ativo
  )
  select v_empresa_id, f.id_funcionario, s.id, true
  from unnest(array[
    v_funcionaria_beatriz,
    v_funcionario_diego,
    v_funcionaria_larissa
  ]) as f(id_funcionario)
  join public.servicos s
    on s.id_empresa = v_empresa_id
   and s.ativo
  where not exists (
    select 1
    from public.funcionarios_servicos fs
    where fs.id_empresa = v_empresa_id
      and fs.id_funcionario = f.id_funcionario
      and fs.id_servico = s.id
  );

  -- Usa os tres servicos ativos mais curtos para manter os exemplos dentro da jornada.
  select id, duracao_minutos, preco
    into v_servico_1, v_duracao_1, v_preco_1
  from public.servicos
  where id_empresa = v_empresa_id
    and ativo
    and duracao_minutos between 5 and 120
  order by duracao_minutos, id
  limit 1;

  if not found then
    raise exception 'A carga demo precisa de ao menos um servico ativo com duracao entre 5 e 120 minutos.';
  end if;

  select id, duracao_minutos, preco
    into v_servico_2, v_duracao_2, v_preco_2
  from public.servicos
  where id_empresa = v_empresa_id
    and ativo
    and duracao_minutos between 5 and 120
    and id <> v_servico_1
  order by duracao_minutos, id
  limit 1;

  if not found then
    v_servico_2 := v_servico_1;
    v_duracao_2 := v_duracao_1;
    v_preco_2 := v_preco_1;
  end if;

  select id, duracao_minutos, preco
    into v_servico_3, v_duracao_3, v_preco_3
  from public.servicos
  where id_empresa = v_empresa_id
    and ativo
    and duracao_minutos between 5 and 120
    and id not in (v_servico_1, v_servico_2)
  order by duracao_minutos, id
  limit 1;

  if not found then
    v_servico_3 := v_servico_1;
    v_duracao_3 := v_duracao_1;
    v_preco_3 := v_preco_1;
  end if;

  -- Proximos tres dias de atendimento, sempre pulando o domingo.
  v_data_1 := current_date + 1;
  while extract(dow from v_data_1) = 0 loop
    v_data_1 := v_data_1 + 1;
  end loop;

  v_data_2 := v_data_1 + 1;
  while extract(dow from v_data_2) = 0 loop
    v_data_2 := v_data_2 + 1;
  end loop;

  v_data_3 := v_data_2 + 1;
  while extract(dow from v_data_3) = 0 loop
    v_data_3 := v_data_3 + 1;
  end loop;

  -- 1) Agendamento aguardando confirmacao.
  if not exists (
    select 1 from public.agendamentos
    where id_empresa = v_empresa_id
      and observacoes = '[DEMO AGENDA 01] Aguardando confirmacao.'
  ) then
    v_inicio := (v_data_1 + time '09:00') at time zone v_fuso;
    v_fim := v_inicio + make_interval(mins => v_duracao_1);

    perform public.salvar_agendamento(
      null, v_empresa_id, v_cliente_ana,
      '[DEMO AGENDA 01] Aguardando confirmacao.', 'nao_exigido', null,
      jsonb_build_array(jsonb_build_object(
        'id_servico', v_servico_1,
        'id_funcionario', v_funcionaria_beatriz,
        'inicio', v_inicio,
        'fim', v_fim,
        'duracao_minutos', v_duracao_1,
        'preco', v_preco_1,
        'ordem', 1,
        'observacoes', '[DADO FICTICIO] Item de agenda para teste.'
      ))
    );
  end if;

  -- 2) Agendamento confirmado com outro profissional.
  if not exists (
    select 1 from public.agendamentos
    where id_empresa = v_empresa_id
      and observacoes = '[DEMO AGENDA 02] Confirmado.'
  ) then
    v_inicio := (v_data_1 + time '14:00') at time zone v_fuso;
    v_fim := v_inicio + make_interval(mins => v_duracao_2);

    v_agendamento_id := public.salvar_agendamento(
      null, v_empresa_id, v_cliente_carlos,
      '[DEMO AGENDA 02] Confirmado.', 'nao_exigido', null,
      jsonb_build_array(jsonb_build_object(
        'id_servico', v_servico_2,
        'id_funcionario', v_funcionario_diego,
        'inicio', v_inicio,
        'fim', v_fim,
        'duracao_minutos', v_duracao_2,
        'preco', v_preco_2,
        'ordem', 1,
        'observacoes', '[DADO FICTICIO] Item de agenda para teste.'
      ))
    );

    update public.agendamentos
    set status = 'confirmado'
    where id_empresa = v_empresa_id and id = v_agendamento_id;
  end if;

  -- 3) Outro horario aguardando confirmacao, para testar filtros.
  if not exists (
    select 1 from public.agendamentos
    where id_empresa = v_empresa_id
      and observacoes = '[DEMO AGENDA 03] Aguardando confirmacao.'
  ) then
    v_inicio := (v_data_1 + time '16:30') at time zone v_fuso;
    v_fim := v_inicio + make_interval(mins => v_duracao_3);

    perform public.salvar_agendamento(
      null, v_empresa_id, v_cliente_juliana,
      '[DEMO AGENDA 03] Aguardando confirmacao.', 'nao_exigido', null,
      jsonb_build_array(jsonb_build_object(
        'id_servico', v_servico_3,
        'id_funcionario', v_funcionaria_larissa,
        'inicio', v_inicio,
        'fim', v_fim,
        'duracao_minutos', v_duracao_3,
        'preco', v_preco_3,
        'ordem', 1,
        'observacoes', '[DADO FICTICIO] Item de agenda para teste.'
      ))
    );
  end if;

  -- 4) Agendamento confirmado no dia seguinte.
  if not exists (
    select 1 from public.agendamentos
    where id_empresa = v_empresa_id
      and observacoes = '[DEMO AGENDA 04] Confirmado.'
  ) then
    v_inicio := (v_data_2 + time '10:00') at time zone v_fuso;
    v_fim := v_inicio + make_interval(mins => v_duracao_1);

    v_agendamento_id := public.salvar_agendamento(
      null, v_empresa_id, v_cliente_rafael,
      '[DEMO AGENDA 04] Confirmado.', 'nao_exigido', null,
      jsonb_build_array(jsonb_build_object(
        'id_servico', v_servico_1,
        'id_funcionario', v_funcionaria_beatriz,
        'inicio', v_inicio,
        'fim', v_fim,
        'duracao_minutos', v_duracao_1,
        'preco', v_preco_1,
        'ordem', 1,
        'observacoes', '[DADO FICTICIO] Item de agenda para teste.'
      ))
    );

    update public.agendamentos
    set status = 'confirmado'
    where id_empresa = v_empresa_id and id = v_agendamento_id;
  end if;

  -- 5) Agendamento com dois servicos sequenciais para testar o plano Completo.
  if not exists (
    select 1 from public.agendamentos
    where id_empresa = v_empresa_id
      and observacoes = '[DEMO AGENDA 05] Multisservico confirmado.'
  ) then
    v_inicio := (v_data_3 + time '14:00') at time zone v_fuso;
    v_fim := v_inicio + make_interval(mins => v_duracao_1);
    v_segundo_inicio := v_fim;
    v_segundo_fim := v_segundo_inicio + make_interval(mins => v_duracao_2);

    v_agendamento_id := public.salvar_agendamento(
      null, v_empresa_id, v_cliente_ana,
      '[DEMO AGENDA 05] Multisservico confirmado.', 'nao_exigido', null,
      jsonb_build_array(
        jsonb_build_object(
          'id_servico', v_servico_1,
          'id_funcionario', v_funcionario_diego,
          'inicio', v_inicio,
          'fim', v_fim,
          'duracao_minutos', v_duracao_1,
          'preco', v_preco_1,
          'ordem', 1,
          'observacoes', '[DADO FICTICIO] Primeiro item do multisservico.'
        ),
        jsonb_build_object(
          'id_servico', v_servico_2,
          'id_funcionario', v_funcionario_diego,
          'inicio', v_segundo_inicio,
          'fim', v_segundo_fim,
          'duracao_minutos', v_duracao_2,
          'preco', v_preco_2,
          'ordem', 2,
          'observacoes', '[DADO FICTICIO] Segundo item do multisservico.'
        )
      )
    );

    update public.agendamentos
    set status = 'confirmado'
    where id_empresa = v_empresa_id and id = v_agendamento_id;
  end if;

  select count(*) into v_total_clientes
  from public.clientes
  where id_empresa = v_empresa_id
    and email like '%.demo@example.com';

  select count(*) into v_total_funcionarios
  from public.funcionarios
  where id_empresa = v_empresa_id
    and email like '%.demo@example.com';

  select count(*) into v_total_agendamentos
  from public.agendamentos
  where id_empresa = v_empresa_id
    and observacoes like '[DEMO AGENDA %';

  raise notice 'Carga demo concluida: % clientes, % funcionarios e % agendamentos ficticios.',
    v_total_clientes, v_total_funcionarios, v_total_agendamentos;
end;
$$;
