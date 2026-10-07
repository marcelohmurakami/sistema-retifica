-- Fase 13: API publica segura para sites exclusivos por empresa.
-- O papel anonimo nao recebe SELECT/INSERT/UPDATE nas tabelas; acessa apenas
-- estas RPCs security definer, que retornam campos explicitamente publicos.

alter table public.agendamentos
  add column if not exists site_access_token uuid,
  add column if not exists site_booking_key uuid,
  add column if not exists site_notification_preferences jsonb;

create unique index if not exists agendamentos_site_access_token_unique
  on public.agendamentos (site_access_token)
  where site_access_token is not null;

create unique index if not exists agendamentos_site_booking_key_unique
  on public.agendamentos (id_empresa, site_booking_key)
  where site_booking_key is not null;

create or replace function public.obter_catalogo_site(p_id_empresa bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'empresa', jsonb_build_object(
      'id', e.id,
      'nome', e.fantasia,
      'fuso_horario', coalesce(e.fuso_horario, 'America/Sao_Paulo')
    ),
    'servicos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'nome', s.nome,
        'descricao', s.descricao,
        'preco', s.preco,
        'duracao_minutos', s.duracao_minutos,
        'intervalo_minutos', s.intervalo_minutos,
        'exige_sinal', s.exige_sinal,
        'sinal_tipo', s.sinal_tipo,
        'sinal_valor', s.sinal_valor
      ) order by s.nome)
      from public.servicos s
      where s.id_empresa = e.id
        and s.ativo
        and s.permite_agendamento_online
    ), '[]'::jsonb),
    'profissionais', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'nome', regexp_replace(f.nome, '[[:space:]]*\(Teste\)[[:space:]]*$', '', 'i'),
        'cargo', coalesce(f.cargo, 'Profissional'),
        'cor_agenda', f.cor_agenda,
        'servicos', coalesce((
          select jsonb_agg(s.id order by s.nome)
          from public.servicos s
          left join public.funcionarios_servicos fs
            on fs.id_empresa = f.id_empresa
           and fs.id_funcionario = f.id
           and fs.id_servico = s.id
           and fs.ativo
          where s.id_empresa = f.id_empresa
            and s.ativo
            and s.permite_agendamento_online
            and (
              not exists (
                select 1
                from public.funcionarios_servicos configuracao
                where configuracao.id_empresa = f.id_empresa
                  and configuracao.id_funcionario = f.id
              )
              or fs.id is not null
            )
        ), '[]'::jsonb)
      ) order by f.nome)
      from public.funcionarios f
      where f.id_empresa = e.id
        and f.ativo
        and f.atende_clientes
    ), '[]'::jsonb)
  )
  from public.empresas e
  where e.id = p_id_empresa
    and e.status = 'ativo';
$$;

create or replace function public.obter_disponibilidade_site(
  p_id_empresa bigint,
  p_data date,
  p_id_servico bigint,
  p_id_funcionario bigint default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_fuso text;
  v_hoje date;
  v_resultado jsonb;
begin
  select coalesce(e.fuso_horario, 'America/Sao_Paulo')
    into v_fuso
  from public.empresas e
  where e.id = p_id_empresa
    and e.status = 'ativo';

  if not found then
    raise exception 'Empresa indisponível para agendamento online.';
  end if;

  v_hoje := (now() at time zone v_fuso)::date;
  if p_data < v_hoje or p_data > v_hoje + 60 then
    raise exception 'Escolha uma data entre hoje e os próximos 60 dias.';
  end if;

  with servico as (
    select s.*
    from public.servicos s
    where s.id_empresa = p_id_empresa
      and s.id = p_id_servico
      and s.ativo
      and s.permite_agendamento_online
  ), elegiveis as (
    select
      f.id as id_funcionario,
      regexp_replace(f.nome, '[[:space:]]*\(Teste\)[[:space:]]*$', '', 'i') as nome_funcionario,
      coalesce(fs.duracao_personalizada, s.duracao_minutos) as duracao_minutos,
      coalesce(fs.valor_personalizado, s.preco) as preco,
      greatest(coalesce(cfg.duracao_slot_minutos, 30), 5) as passo_minutos
    from servico s
    join public.funcionarios f
      on f.id_empresa = s.id_empresa
     and f.ativo
     and f.atende_clientes
    left join public.funcionarios_servicos fs
      on fs.id_empresa = f.id_empresa
     and fs.id_funcionario = f.id
     and fs.id_servico = s.id
     and fs.ativo
    left join public.configuracoes_empresas cfg
      on cfg.id_empresa = f.id_empresa
    where (p_id_funcionario is null or f.id = p_id_funcionario)
      and (
        not exists (
          select 1
          from public.funcionarios_servicos configuracao
          where configuracao.id_empresa = f.id_empresa
            and configuracao.id_funcionario = f.id
        )
        or fs.id is not null
      )
  ), candidatos_locais as (
    select
      e.id_funcionario,
      e.nome_funcionario,
      e.duracao_minutos,
      e.preco,
      h.intervalo_inicio,
      h.intervalo_fim,
      slot.inicio_local,
      slot.inicio_local + make_interval(mins => e.duracao_minutos) as fim_local
    from elegiveis e
    join public.funcionarios_horarios h
      on h.id_empresa = p_id_empresa
     and h.id_funcionario = e.id_funcionario
     and h.ativo
     and h.dia_semana = extract(dow from p_data)::integer
    cross join lateral generate_series(
      (p_data + h.hora_inicio)::timestamp,
      (p_data + h.hora_fim)::timestamp - make_interval(mins => e.duracao_minutos),
      make_interval(mins => e.passo_minutos)
    ) as slot(inicio_local)
  ), candidatos as (
    select
      c.*,
      c.inicio_local at time zone v_fuso as inicio,
      c.fim_local at time zone v_fuso as fim
    from candidatos_locais c
    where not (
      c.intervalo_inicio is not null
      and c.intervalo_fim is not null
      and c.inicio_local < (p_data + c.intervalo_fim)::timestamp
      and c.fim_local > (p_data + c.intervalo_inicio)::timestamp
    )
  ), disponiveis as (
    select c.*
    from candidatos c
    where c.inicio >= now() + interval '2 hours'
      and not exists (
        select 1
        from public.agendamentos_servicos item
        where item.id_empresa = p_id_empresa
          and item.id_funcionario = c.id_funcionario
          and item.status not in ('cancelado', 'concluido', 'no_show')
          and item.inicio < c.fim
          and item.fim > c.inicio
      )
      and not exists (
        select 1
        from public.funcionarios_ausencias ausencia
        where ausencia.id_empresa = p_id_empresa
          and ausencia.id_funcionario = c.id_funcionario
          and ausencia.status = 'aprovado'
          and ausencia.inicio < c.fim
          and ausencia.fim > c.inicio
      )
      and not exists (
        select 1
        from public.bloqueios_agenda bloqueio
        where bloqueio.id_empresa = p_id_empresa
          and bloqueio.status = 'ativo'
          and (bloqueio.id_funcionario is null or bloqueio.id_funcionario = c.id_funcionario)
          and bloqueio.inicio < c.fim
          and bloqueio.fim > c.inicio
      )
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id_funcionario', d.id_funcionario,
    'nome_funcionario', d.nome_funcionario,
    'inicio', d.inicio,
    'fim', d.fim,
    'horario', to_char(d.inicio_local, 'HH24:MI'),
    'duracao_minutos', d.duracao_minutos,
    'preco', d.preco
  ) order by d.inicio, d.nome_funcionario), '[]'::jsonb)
    into v_resultado
  from disponiveis d;

  return v_resultado;
end;
$$;

create or replace function public.obter_agendamento_site(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'token', a.site_access_token,
    'codigo', 'MK' || lpad(a.id::text, 6, '0'),
    'status', a.status,
    'inicio', a.inicio,
    'fim', a.fim,
    'sinal_status', a.sinal_status,
    'sinal_valor', a.sinal_valor,
    'cliente', jsonb_build_object(
      'nome', c.nome,
      'email', c.email,
      'telefone', c.telefone_principal
    ),
    'empresa', jsonb_build_object(
      'id', e.id,
      'nome', e.fantasia,
      'fuso_horario', coalesce(e.fuso_horario, 'America/Sao_Paulo')
    ),
    'servico', jsonb_build_object(
      'id', s.id,
      'nome', s.nome,
      'duracao_minutos', item.duracao_minutos,
      'preco', item.preco
    ),
    'profissional', jsonb_build_object(
      'id', f.id,
      'nome', regexp_replace(f.nome, '[[:space:]]*\(Teste\)[[:space:]]*$', '', 'i'),
      'cargo', coalesce(f.cargo, 'Profissional')
    ),
    'lembretes', coalesce(a.site_notification_preferences, '{}'::jsonb)
  )
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  join public.empresas e
    on e.id = a.id_empresa
  join lateral (
    select i.*
    from public.agendamentos_servicos i
    where i.id_empresa = a.id_empresa
      and i.id_agendamento = a.id
      and i.status <> 'cancelado'
    order by i.ordem, i.id
    limit 1
  ) item on true
  join public.servicos s
    on s.id_empresa = item.id_empresa and s.id = item.id_servico
  join public.funcionarios f
    on f.id_empresa = item.id_empresa and f.id = item.id_funcionario
  where a.site_access_token = p_token;
$$;

create or replace function public.criar_agendamento_site(
  p_id_empresa bigint,
  p_nome text,
  p_telefone text,
  p_email text,
  p_id_servico bigint,
  p_id_funcionario bigint,
  p_inicio timestamptz,
  p_observacoes text default null,
  p_lembrete_whatsapp boolean default true,
  p_lembrete_email boolean default true,
  p_chave_idempotencia uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_telefone text := regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_cliente_id bigint;
  v_agendamento_id bigint;
  v_token uuid;
  v_duracao integer;
  v_preco numeric(10,2);
  v_exige_sinal boolean;
  v_sinal_tipo text;
  v_sinal_config numeric;
  v_sinal numeric(10,2);
  v_fim timestamptz;
  v_disponivel boolean;
begin
  if p_chave_idempotencia is null then
    raise exception 'Identificador da solicitação ausente.';
  end if;

  select a.id, a.site_access_token
    into v_agendamento_id, v_token
  from public.agendamentos a
  where a.id_empresa = p_id_empresa
    and a.site_booking_key = p_chave_idempotencia;

  if found then
    return public.obter_agendamento_site(v_token);
  end if;

  if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
    raise exception 'Informe um nome válido.';
  end if;
  if char_length(v_telefone) < 10 or char_length(v_telefone) > 13 then
    raise exception 'Informe um WhatsApp válido com DDD.';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Informe um e-mail válido.';
  end if;
  if char_length(coalesce(p_observacoes, '')) > 1000 then
    raise exception 'As observações podem ter no máximo 1000 caracteres.';
  end if;

  if (
    select count(*)
    from public.agendamentos a
    join public.clientes c
      on c.id_empresa = a.id_empresa and c.id = a.id_cliente
    where a.id_empresa = p_id_empresa
      and a.site_booking_key is not null
      and a.created_at >= now() - interval '1 hour'
      and regexp_replace(coalesce(c.telefone_e164, c.telefone_principal, ''), '[^0-9]', '', 'g') = v_telefone
  ) >= 3 then
    raise exception 'Muitas solicitações recentes para este telefone. Aguarde antes de tentar novamente.';
  end if;

  select
    coalesce(fs.duracao_personalizada, s.duracao_minutos),
    coalesce(fs.valor_personalizado, s.preco),
    s.exige_sinal,
    s.sinal_tipo,
    s.sinal_valor
    into v_duracao, v_preco, v_exige_sinal, v_sinal_tipo, v_sinal_config
  from public.servicos s
  join public.funcionarios f
    on f.id_empresa = s.id_empresa
   and f.id = p_id_funcionario
   and f.ativo
   and f.atende_clientes
  left join public.funcionarios_servicos fs
    on fs.id_empresa = s.id_empresa
   and fs.id_servico = s.id
   and fs.id_funcionario = f.id
   and fs.ativo
  where s.id_empresa = p_id_empresa
    and s.id = p_id_servico
    and s.ativo
    and s.permite_agendamento_online
    and (
      not exists (
        select 1
        from public.funcionarios_servicos configuracao
        where configuracao.id_empresa = f.id_empresa
          and configuracao.id_funcionario = f.id
      )
      or fs.id is not null
    );

  if not found then
    raise exception 'Serviço ou profissional indisponível para agendamento online.';
  end if;

  select exists (
    select 1
    from jsonb_array_elements(public.obter_disponibilidade_site(
      p_id_empresa,
      (p_inicio at time zone coalesce((select e.fuso_horario from public.empresas e where e.id = p_id_empresa), 'America/Sao_Paulo'))::date,
      p_id_servico,
      p_id_funcionario
    )) slot
    where (slot->>'id_funcionario')::bigint = p_id_funcionario
      and (slot->>'inicio')::timestamptz = p_inicio
  ) into v_disponivel;

  if not v_disponivel then
    raise exception 'Este horário não está mais disponível. Escolha outro horário.';
  end if;

  select c.id into v_cliente_id
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and regexp_replace(coalesce(c.telefone_e164, c.telefone_principal, ''), '[^0-9]', '', 'g') = v_telefone
  order by c.ativo desc, c.id
  limit 1;

  if v_cliente_id is null then
    insert into public.clientes (
      id_empresa, nome, telefone_principal, telefone_e164, email,
      canal_preferido, observacoes
    ) values (
      p_id_empresa, v_nome, p_telefone, '+' || v_telefone, v_email,
      case when p_lembrete_whatsapp then 'whatsapp' when p_lembrete_email then 'email' else null end,
      '[SITE] Cadastro criado pelo agendamento público.'
    ) returning id into v_cliente_id;
  end if;

  v_fim := p_inicio + make_interval(mins => v_duracao);
  v_sinal := case
    when not v_exige_sinal or coalesce(v_sinal_config, 0) <= 0 then null
    when v_sinal_tipo = 'percentual' then round(v_preco * v_sinal_config / 100, 2)
    else least(v_preco, v_sinal_config)
  end;
  v_token := gen_random_uuid();

  insert into public.agendamentos (
    id_empresa, id_cliente, inicio, fim, observacoes, sinal_status,
    sinal_valor, status, origem, criado_por, site_access_token,
    site_booking_key, site_notification_preferences
  ) values (
    p_id_empresa, v_cliente_id, p_inicio, v_fim, nullif(btrim(p_observacoes), ''),
    case when v_sinal is null then 'nao_exigido' else 'pendente' end,
    v_sinal,
    case when v_sinal is null then 'aguardando_confirmacao' else 'aguardando_pagamento' end,
    'sistema', null, v_token, p_chave_idempotencia,
    jsonb_build_object('whatsapp', p_lembrete_whatsapp, 'email', p_lembrete_email)
  ) returning id into v_agendamento_id;

  insert into public.agendamentos_servicos (
    id_empresa, id_agendamento, id_servico, id_funcionario,
    inicio, fim, duracao_minutos, preco, ordem, status, observacoes
  ) values (
    p_id_empresa, v_agendamento_id, p_id_servico, p_id_funcionario,
    p_inicio, v_fim, v_duracao, v_preco, 1, 'reservado',
    '[SITE] Item criado pelo agendamento público.'
  );

  return public.obter_agendamento_site(v_token);
end;
$$;

create or replace function public.alterar_agendamento_site(
  p_token uuid,
  p_acao text,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agendamento public.agendamentos%rowtype;
begin
  select * into v_agendamento
  from public.agendamentos a
  where a.site_access_token = p_token
  for update;

  if not found then
    raise exception 'Agendamento não encontrado.';
  end if;

  if p_acao = 'confirmar' then
    if v_agendamento.status not in ('aguardando_confirmacao', 'aguardando_pagamento') then
      raise exception 'Este agendamento não pode ser confirmado.';
    end if;
    if v_agendamento.sinal_status = 'pendente' then
      raise exception 'O pagamento do sinal ainda está pendente.';
    end if;
    update public.agendamentos
    set status = 'confirmado'
    where id = v_agendamento.id and id_empresa = v_agendamento.id_empresa;
  elsif p_acao = 'cancelar' then
    if v_agendamento.status in ('cancelado', 'finalizado', 'no_show', 'em_atendimento') then
      raise exception 'Este agendamento não pode mais ser cancelado.';
    end if;
    update public.agendamentos
    set status = 'cancelado',
        motivo_cancelamento = coalesce(nullif(btrim(p_motivo), ''), 'Cancelado pelo cliente no site.')
    where id = v_agendamento.id and id_empresa = v_agendamento.id_empresa;
  else
    raise exception 'Ação inválida.';
  end if;

  return public.obter_agendamento_site(p_token);
end;
$$;

create or replace function public.reagendar_agendamento_site(
  p_token uuid,
  p_id_funcionario bigint,
  p_inicio timestamptz
)
returns jsonb
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
begin
  select * into v_agendamento
  from public.agendamentos a
  where a.site_access_token = p_token
  for update;

  if not found then raise exception 'Agendamento não encontrado.'; end if;
  if v_agendamento.status in ('cancelado', 'finalizado', 'no_show', 'em_atendimento') then
    raise exception 'Este agendamento não pode mais ser reagendado.';
  end if;
  if v_agendamento.inicio <= now() + interval '24 hours' then
    raise exception 'O reagendamento online exige pelo menos 24 horas de antecedência.';
  end if;

  select * into v_item
  from public.agendamentos_servicos item
  where item.id_empresa = v_agendamento.id_empresa
    and item.id_agendamento = v_agendamento.id
    and item.status <> 'cancelado'
  order by item.ordem, item.id
  limit 1;

  select coalesce(e.fuso_horario, 'America/Sao_Paulo') into v_fuso
  from public.empresas e where e.id = v_agendamento.id_empresa;

  select exists (
    select 1
    from jsonb_array_elements(public.obter_disponibilidade_site(
      v_agendamento.id_empresa,
      (p_inicio at time zone v_fuso)::date,
      v_item.id_servico,
      p_id_funcionario
    )) slot
    where (slot->>'id_funcionario')::bigint = p_id_funcionario
      and (slot->>'inicio')::timestamptz = p_inicio
  ) into v_disponivel;

  if not v_disponivel then
    raise exception 'Este horário não está mais disponível. Escolha outro horário.';
  end if;

  v_fim := p_inicio + make_interval(mins => v_item.duracao_minutos);

  update public.agendamentos
  set inicio = p_inicio, fim = v_fim
  where id = v_agendamento.id and id_empresa = v_agendamento.id_empresa;

  update public.agendamentos_servicos
  set id_funcionario = p_id_funcionario, inicio = p_inicio, fim = v_fim
  where id = v_item.id and id_empresa = v_item.id_empresa;

  return public.obter_agendamento_site(p_token);
end;
$$;

revoke all on function public.obter_catalogo_site(bigint) from public, anon, authenticated;
revoke all on function public.obter_disponibilidade_site(bigint, date, bigint, bigint) from public, anon, authenticated;
revoke all on function public.obter_agendamento_site(uuid) from public, anon, authenticated;
revoke all on function public.criar_agendamento_site(bigint, text, text, text, bigint, bigint, timestamptz, text, boolean, boolean, uuid) from public, anon, authenticated;
revoke all on function public.alterar_agendamento_site(uuid, text, text) from public, anon, authenticated;
revoke all on function public.reagendar_agendamento_site(uuid, bigint, timestamptz) from public, anon, authenticated;

grant execute on function public.obter_catalogo_site(bigint) to anon, authenticated;
grant execute on function public.obter_disponibilidade_site(bigint, date, bigint, bigint) to anon, authenticated;
grant execute on function public.obter_agendamento_site(uuid) to anon, authenticated;
grant execute on function public.criar_agendamento_site(bigint, text, text, text, bigint, bigint, timestamptz, text, boolean, boolean, uuid) to anon, authenticated;
grant execute on function public.alterar_agendamento_site(uuid, text, text) to anon, authenticated;
grant execute on function public.reagendar_agendamento_site(uuid, bigint, timestamptz) to anon, authenticated;
