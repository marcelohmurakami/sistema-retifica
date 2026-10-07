-- Cenario operacional ficticio para testes de volume, simultaneidade e multisservico.
-- A carga e idempotente e restrita a empresa de desenvolvimento Murakami Beauty (ID 10).

do $$
declare
  v_empresa_id bigint;
  v_fuso text;
  v_clientes bigint[];
  v_funcionarios bigint[];
  v_funcionario_emails text[] := array[
    'beatriz.costa.demo@example.com',
    'camila.prado.operacao@example.com',
    'diego.martins.demo@example.com',
    'fernanda.reis.operacao@example.com',
    'larissa.nunes.demo@example.com',
    'marcos.vieira.operacao@example.com'
  ];
  v_origens text[] := array['sistema', 'site', 'aplicativo', 'link_publico', 'importacao'];
  v_data date;
  v_data_ausencia date;
  v_dia integer;
  v_indice_funcionario integer;
  v_indice_cliente integer;
  v_contador integer := 0;
  v_funcionario_id bigint;
  v_funcionario_2_id bigint;
  v_cliente_id bigint;
  v_servico_id bigint;
  v_servico_2_id bigint;
  v_duracao integer;
  v_duracao_2 integer;
  v_preco numeric;
  v_preco_2 numeric;
  v_preco_total numeric;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_inicio_2 timestamptz;
  v_fim_2 timestamptz;
  v_agendamento_id bigint;
  v_observacoes text;
  v_origem text;
  v_sinal_status text;
  v_sinal_valor numeric;
  v_status_destino text;
begin
  select e.id, coalesce(e.fuso_horario, 'America/Sao_Paulo')
    into v_empresa_id, v_fuso
  from public.empresas e
  where e.id = 10
    and lower(btrim(e.fantasia)) = lower('Murakami Beauty');

  if not found then
    raise notice 'Cenario operacional ignorado: empresa Murakami Beauty (ID 10) nao encontrada.';
    return;
  end if;

  -- Amplia a carteira para vinte clientes ficticios no total.
  insert into public.clientes (
    id_empresa, nome, email, telefone_principal, data_nascimento,
    canal_preferido, observacoes
  )
  select
    v_empresa_id,
    dados.nome,
    dados.email,
    dados.telefone,
    dados.nascimento,
    dados.canal,
    '[DADO FICTICIO] Cliente do cenario operacional para testes de volume e recorrencia.'
  from (
    values
      ('Mariana Lopes (Teste)', 'mariana.lopes.operacao@example.com', '(11) 92000-0001', date '1993-03-18', 'whatsapp'),
      ('Paulo Henrique (Teste)', 'paulo.henrique.operacao@example.com', '(11) 92000-0002', date '1984-11-06', 'telefone'),
      ('Sofia Ramos (Teste)', 'sofia.ramos.operacao@example.com', '(11) 92000-0003', date '1998-05-27', 'email'),
      ('Lucas Fernandes (Teste)', 'lucas.fernandes.operacao@example.com', '(11) 92000-0004', date '1991-08-14', 'whatsapp'),
      ('Renata Alves (Teste)', 'renata.alves.operacao@example.com', '(11) 92000-0005', date '1989-02-09', 'sms'),
      ('Thiago Ribeiro (Teste)', 'thiago.ribeiro.operacao@example.com', '(11) 92000-0006', date '1986-12-21', 'whatsapp'),
      ('Camila Barros (Teste)', 'camila.barros.operacao@example.com', '(11) 92000-0007', date '1995-06-03', 'email'),
      ('Eduardo Moreira (Teste)', 'eduardo.moreira.operacao@example.com', '(11) 92000-0008', date '1982-10-29', 'telefone'),
      ('Patricia Gomes (Teste)', 'patricia.gomes.operacao@example.com', '(11) 92000-0009', date '1997-04-16', 'whatsapp'),
      ('Felipe Santos (Teste)', 'felipe.santos.operacao@example.com', '(11) 92000-0010', date '1990-01-31', 'nenhum'),
      ('Aline Carvalho (Teste)', 'aline.carvalho.operacao@example.com', '(11) 92000-0011', date '1994-09-12', 'whatsapp'),
      ('Gustavo Freitas (Teste)', 'gustavo.freitas.operacao@example.com', '(11) 92000-0012', date '1988-07-25', 'email'),
      ('Isabela Castro (Teste)', 'isabela.castro.operacao@example.com', '(11) 92000-0013', date '1999-02-11', 'whatsapp'),
      ('Rodrigo Moraes (Teste)', 'rodrigo.moraes.operacao@example.com', '(11) 92000-0014', date '1985-05-08', 'telefone'),
      ('Bianca Teixeira (Teste)', 'bianca.teixeira.operacao@example.com', '(11) 92000-0015', date '1996-11-19', 'sms'),
      ('Daniel Oliveira (Teste)', 'daniel.oliveira.operacao@example.com', '(11) 92000-0016', date '1992-06-30', 'whatsapp')
  ) as dados(nome, email, telefone, nascimento, canal)
  where not exists (
    select 1
    from public.clientes c
    where c.id_empresa = v_empresa_id
      and c.email = dados.email
  );

  -- Tres profissionais adicionais para formar uma equipe de seis pessoas.
  insert into public.funcionarios (
    id_empresa, nome, email, telefone, cargo, cor_agenda,
    data_admissao, atende_clientes, observacoes
  )
  select
    v_empresa_id,
    dados.nome,
    dados.email,
    dados.telefone,
    dados.cargo,
    dados.cor,
    dados.admissao,
    true,
    '[DADO FICTICIO] Profissional do cenario operacional para testes de agenda cheia.'
  from (
    values
      ('Camila Prado (Teste)', 'camila.prado.operacao@example.com', '(11) 93000-0001', 'Nail designer', '#F07FA8', current_date - 310),
      ('Fernanda Reis (Teste)', 'fernanda.reis.operacao@example.com', '(11) 93000-0002', 'Maquiadora', '#E09B45', current_date - 265),
      ('Marcos Vieira (Teste)', 'marcos.vieira.operacao@example.com', '(11) 93000-0003', 'Cabeleireiro', '#5AA6A6', current_date - 420)
  ) as dados(nome, email, telefone, cargo, cor, admissao)
  where not exists (
    select 1
    from public.funcionarios f
    where f.id_empresa = v_empresa_id
      and f.email = dados.email
  );

  select array_agg(f.id order by array_position(v_funcionario_emails, f.email))
    into v_funcionarios
  from public.funcionarios f
  where f.id_empresa = v_empresa_id
    and f.email = any(v_funcionario_emails)
    and f.ativo
    and f.atende_clientes;

  if coalesce(array_length(v_funcionarios, 1), 0) <> 6 then
    raise exception 'O cenario operacional precisa dos seis profissionais ficticios ativos.';
  end if;

  select array_agg(c.id order by c.id)
    into v_clientes
  from public.clientes c
  where c.id_empresa = v_empresa_id
    and c.observacoes like '[DADO FICTICIO]%';

  if coalesce(array_length(v_clientes, 1), 0) < 20 then
    raise exception 'O cenario operacional precisa de pelo menos vinte clientes ficticios.';
  end if;

  -- Jornada completa de segunda a sabado para todos os profissionais da simulacao.
  insert into public.funcionarios_horarios (
    id_empresa, id_funcionario, dia_semana, hora_inicio, hora_fim,
    intervalo_inicio, intervalo_fim, ativo
  )
  select
    v_empresa_id,
    f.id_funcionario,
    d.dia_semana,
    time '08:00',
    time '19:00',
    time '12:00',
    time '13:00',
    true
  from unnest(v_funcionarios) as f(id_funcionario)
  cross join generate_series(1, 6) as d(dia_semana)
  where not exists (
    select 1
    from public.funcionarios_horarios h
    where h.id_empresa = v_empresa_id
      and h.id_funcionario = f.id_funcionario
      and h.dia_semana = d.dia_semana
  );

  -- Habilita o catalogo ativo para a equipe ficticia.
  insert into public.funcionarios_servicos (
    id_empresa, id_funcionario, id_servico, ativo
  )
  select v_empresa_id, f.id_funcionario, s.id, true
  from unnest(v_funcionarios) as f(id_funcionario)
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

  -- Personalizacoes reais por profissional para validar snapshots de preco e duracao.
  update public.funcionarios_servicos fs
  set duracao_personalizada = 45,
      valor_personalizado = 50.00,
      updated_at = now()
  from public.funcionarios f, public.servicos s
  where fs.id_empresa = v_empresa_id
    and f.id = fs.id_funcionario
    and f.id_empresa = fs.id_empresa
    and s.id = fs.id_servico
    and s.id_empresa = fs.id_empresa
    and f.email = 'camila.prado.operacao@example.com'
    and lower(s.nome) = lower('Manicure');

  update public.funcionarios_servicos fs
  set duracao_personalizada = 75,
      valor_personalizado = 170.00,
      updated_at = now()
  from public.funcionarios f, public.servicos s
  where fs.id_empresa = v_empresa_id
    and f.id = fs.id_funcionario
    and f.id_empresa = fs.id_empresa
    and s.id = fs.id_servico
    and s.id_empresa = fs.id_empresa
    and f.email = 'fernanda.reis.operacao@example.com'
    and lower(s.nome) = lower('Maquiagem social');

  update public.funcionarios_servicos fs
  set duracao_personalizada = 50,
      valor_personalizado = 85.00,
      updated_at = now()
  from public.funcionarios f, public.servicos s
  where fs.id_empresa = v_empresa_id
    and f.id = fs.id_funcionario
    and f.id_empresa = fs.id_empresa
    and s.id = fs.id_servico
    and s.id_empresa = fs.id_empresa
    and f.email = 'marcos.vieira.operacao@example.com'
    and lower(s.nome) = lower('Corte feminino');

  -- Consentimentos variados deixam o cadastro de clientes mais proximo do uso real.
  insert into public.consentimentos_comunicacao (
    id_empresa, id_cliente, canal, finalidade, consentiu,
    origem, registrado_em, revogado_em, observacoes
  )
  select
    v_empresa_id,
    c.id_cliente,
    'whatsapp',
    'lembrete',
    true,
    'carga_demo',
    now(),
    null,
    '[DADO FICTICIO] Consentimento para lembretes da agenda.'
  from unnest(v_clientes) with ordinality as c(id_cliente, ordem)
  on conflict (id_empresa, id_cliente, canal, finalidade) do nothing;

  insert into public.consentimentos_comunicacao (
    id_empresa, id_cliente, canal, finalidade, consentiu,
    origem, registrado_em, revogado_em, observacoes
  )
  select
    v_empresa_id,
    c.id_cliente,
    'email',
    'marketing',
    c.ordem <= 10,
    'carga_demo',
    now(),
    case when c.ordem <= 10 then null else now() end,
    '[DADO FICTICIO] Preferencia de marketing para testar consentimento e revogacao.'
  from unnest(v_clientes) with ordinality as c(id_cliente, ordem)
  where c.ordem <= 15
  on conflict (id_empresa, id_cliente, canal, finalidade) do nothing;

  -- Inicia depois dos cinco agendamentos menores ja existentes.
  select coalesce(max((a.inicio at time zone v_fuso)::date), current_date)
    into v_data
  from public.agendamentos a
  where a.id_empresa = v_empresa_id
    and a.observacoes like '[DEMO AGENDA %';

  v_data := v_data + 1;
  while extract(dow from v_data) = 0 loop
    v_data := v_data + 1;
  end loop;

  -- Dez dias de operacao: seis atendimentos por dia, com tres profissionais simultaneos
  -- pela manha e tres simultaneos a tarde.
  for v_dia in 1..10 loop
    if v_dia > 1 then
      v_data := v_data + 1;
      while extract(dow from v_data) = 0 loop
        v_data := v_data + 1;
      end loop;
    end if;

    for v_indice_funcionario in 1..6 loop
      v_contador := v_contador + 1;
      v_funcionario_id := v_funcionarios[v_indice_funcionario];
      v_indice_cliente := mod(v_contador * 3 + v_dia, array_length(v_clientes, 1)) + 1;
      v_cliente_id := v_clientes[v_indice_cliente];

      select
        s.id,
        coalesce(fs.duracao_personalizada, s.duracao_minutos),
        coalesce(fs.valor_personalizado, s.preco)
        into v_servico_id, v_duracao, v_preco
      from public.funcionarios_servicos fs
      join public.servicos s
        on s.id_empresa = fs.id_empresa
       and s.id = fs.id_servico
      where fs.id_empresa = v_empresa_id
        and fs.id_funcionario = v_funcionario_id
        and fs.ativo
        and s.ativo
        and coalesce(fs.duracao_personalizada, s.duracao_minutos) between 20 and 90
      order by md5(v_contador::text || '-' || s.id::text)
      limit 1;

      if not found then
        raise exception 'Profissional % nao possui servico curto ativo para a simulacao.', v_funcionario_id;
      end if;

      if v_indice_funcionario <= 3 then
        v_inicio := (v_data + time '09:00') at time zone v_fuso;
      else
        v_inicio := (v_data + time '14:00') at time zone v_fuso;
      end if;
      v_fim := v_inicio + make_interval(mins => v_duracao);

      v_observacoes := format(
        '[DEMO OPERACAO %s-%s] Atendimento simulado em agenda cheia.',
        lpad(v_dia::text, 2, '0'),
        lpad(v_indice_funcionario::text, 2, '0')
      );

      if not exists (
        select 1
        from public.agendamentos a
        where a.id_empresa = v_empresa_id
          and a.observacoes = v_observacoes
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
            'id_funcionario', v_funcionario_id,
            'inicio', v_inicio,
            'fim', v_fim,
            'duracao_minutos', v_duracao,
            'preco', v_preco,
            'ordem', 1,
            'observacoes', '[DADO FICTICIO] Servico da simulacao operacional.'
          ))
        );

        v_origem := v_origens[mod(v_contador - 1, array_length(v_origens, 1)) + 1];
        v_status_destino := case
          when mod(v_contador, 10) = 0 then 'cancelado'
          when mod(v_contador, 10) between 1 and 6 then 'confirmado'
          else 'aguardando_confirmacao'
        end;

        if v_preco > 0 and mod(v_contador, 4) = 0 and v_status_destino <> 'cancelado' then
          v_sinal_status := 'pago';
          v_sinal_valor := greatest(round(v_preco * 0.30, 2), 10.00);
        elsif v_preco > 0 and mod(v_contador, 4) = 1 and v_status_destino <> 'cancelado' then
          v_sinal_status := 'pendente';
          v_sinal_valor := greatest(round(v_preco * 0.30, 2), 10.00);
        else
          v_sinal_status := 'nao_exigido';
          v_sinal_valor := null;
        end if;

        if v_status_destino = 'cancelado' then
          update public.agendamentos
          set origem = v_origem,
              status = 'cancelado',
              motivo_cancelamento = 'Cliente solicitou outro horario (cenario ficticio).'
          where id_empresa = v_empresa_id and id = v_agendamento_id;
        elsif v_status_destino = 'confirmado' then
          update public.agendamentos
          set origem = v_origem,
              status = 'confirmado',
              sinal_status = v_sinal_status,
              sinal_valor = v_sinal_valor
          where id_empresa = v_empresa_id and id = v_agendamento_id;
        else
          update public.agendamentos
          set origem = v_origem,
              sinal_status = v_sinal_status,
              sinal_valor = v_sinal_valor
          where id_empresa = v_empresa_id and id = v_agendamento_id;
        end if;
      end if;
    end loop;

    -- Um agendamento adicional por dia com dois servicos e troca de profissional.
    v_contador := v_contador + 1;
    v_funcionario_id := v_funcionarios[mod(v_dia - 1, 6) + 1];
    v_funcionario_2_id := v_funcionarios[mod(v_dia, 6) + 1];
    v_indice_cliente := mod(v_dia * 7, array_length(v_clientes, 1)) + 1;
    v_cliente_id := v_clientes[v_indice_cliente];

    select
      s.id,
      coalesce(fs.duracao_personalizada, s.duracao_minutos),
      coalesce(fs.valor_personalizado, s.preco)
      into v_servico_id, v_duracao, v_preco
    from public.funcionarios_servicos fs
    join public.servicos s
      on s.id_empresa = fs.id_empresa
     and s.id = fs.id_servico
    where fs.id_empresa = v_empresa_id
      and fs.id_funcionario = v_funcionario_id
      and fs.ativo
      and s.ativo
      and coalesce(fs.duracao_personalizada, s.duracao_minutos) between 20 and 45
    order by s.id
    limit 1;

    if not found then
      raise exception 'Primeiro profissional % nao possui servico de ate 45 minutos.', v_funcionario_id;
    end if;

    select
      s.id,
      coalesce(fs.duracao_personalizada, s.duracao_minutos),
      coalesce(fs.valor_personalizado, s.preco)
      into v_servico_2_id, v_duracao_2, v_preco_2
    from public.funcionarios_servicos fs
    join public.servicos s
      on s.id_empresa = fs.id_empresa
     and s.id = fs.id_servico
    where fs.id_empresa = v_empresa_id
      and fs.id_funcionario = v_funcionario_2_id
      and fs.ativo
      and s.ativo
      and coalesce(fs.duracao_personalizada, s.duracao_minutos) between 20 and 45
      and s.id <> v_servico_id
    order by s.id
    limit 1;

    if not found then
      raise exception 'Segundo profissional % nao possui outro servico de ate 45 minutos.', v_funcionario_2_id;
    end if;

    v_inicio := (v_data + time '17:00') at time zone v_fuso;
    v_fim := v_inicio + make_interval(mins => v_duracao);
    v_inicio_2 := v_fim;
    v_fim_2 := v_inicio_2 + make_interval(mins => v_duracao_2);
    v_preco_total := v_preco + v_preco_2;
    v_observacoes := format(
      '[DEMO MULTI %s] Dois servicos com profissionais diferentes.',
      lpad(v_dia::text, 2, '0')
    );

    if not exists (
      select 1
      from public.agendamentos a
      where a.id_empresa = v_empresa_id
        and a.observacoes = v_observacoes
    ) then
      v_agendamento_id := public.salvar_agendamento(
        null,
        v_empresa_id,
        v_cliente_id,
        v_observacoes,
        'nao_exigido',
        null,
        jsonb_build_array(
          jsonb_build_object(
            'id_servico', v_servico_id,
            'id_funcionario', v_funcionario_id,
            'inicio', v_inicio,
            'fim', v_fim,
            'duracao_minutos', v_duracao,
            'preco', v_preco,
            'ordem', 1,
            'observacoes', '[DADO FICTICIO] Primeiro servico, profissional inicial.'
          ),
          jsonb_build_object(
            'id_servico', v_servico_2_id,
            'id_funcionario', v_funcionario_2_id,
            'inicio', v_inicio_2,
            'fim', v_fim_2,
            'duracao_minutos', v_duracao_2,
            'preco', v_preco_2,
            'ordem', 2,
            'observacoes', '[DADO FICTICIO] Segundo servico, troca de profissional.'
          )
        )
      );

      v_origem := v_origens[mod(v_dia - 1, array_length(v_origens, 1)) + 1];
      if mod(v_dia, 5) = 0 then
        update public.agendamentos
        set origem = v_origem,
            status = 'cancelado',
            motivo_cancelamento = 'Alteracao de planos do cliente (cenario ficticio).'
        where id_empresa = v_empresa_id and id = v_agendamento_id;
      else
        v_sinal_status := case when mod(v_dia, 2) = 0 and v_preco_total > 0 then 'pago' else 'pendente' end;
        v_sinal_valor := greatest(round(v_preco_total * 0.25, 2), 10.00);

        update public.agendamentos
        set origem = v_origem,
            status = 'confirmado',
            sinal_status = v_sinal_status,
            sinal_valor = v_sinal_valor
        where id_empresa = v_empresa_id and id = v_agendamento_id;
      end if;
    end if;
  end loop;

  -- Ausencia futura sem conflito para testar o bloqueio de disponibilidade no formulario.
  v_data_ausencia := v_data + 2;
  while extract(dow from v_data_ausencia) = 0 loop
    v_data_ausencia := v_data_ausencia + 1;
  end loop;

  if not exists (
    select 1
    from public.funcionarios_ausencias a
    where a.id_empresa = v_empresa_id
      and a.id_funcionario = v_funcionarios[5]
      and a.motivo = '[DADO FICTICIO] Compromisso pessoal para teste de indisponibilidade.'
  ) then
    insert into public.funcionarios_ausencias (
      id_empresa, id_funcionario, tipo, inicio, fim,
      dia_inteiro, motivo, status
    ) values (
      v_empresa_id,
      v_funcionarios[5],
      'folga',
      (v_data_ausencia + time '13:00') at time zone v_fuso,
      (v_data_ausencia + time '19:00') at time zone v_fuso,
      false,
      '[DADO FICTICIO] Compromisso pessoal para teste de indisponibilidade.',
      'aprovado'
    );
  end if;

  raise notice 'Cenario operacional concluido: 20+ clientes, 6 profissionais e 70 novos agendamentos planejados.';
end;
$$;
