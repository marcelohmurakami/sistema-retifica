-- Fase 13: disponibilidade real por unidade e protecao atomica contra
-- agendamentos simultaneos do mesmo profissional.

create extension if not exists btree_gist with schema extensions;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agendamentos_servicos_profissional_periodo_excl'
      and conrelid = 'public.agendamentos_servicos'::regclass
  ) then
    alter table public.agendamentos_servicos
      add constraint agendamentos_servicos_profissional_periodo_excl
      exclude using gist (
        id_empresa with =,
        id_funcionario with =,
        tstzrange(inicio, fim, '[)') with &&
      )
      where (status not in ('cancelado', 'concluido'));
  end if;
end;
$$;
create or replace function private.impedir_conflito_profissional_agendamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_intervalo_novo integer;
begin
  if new.status in ('cancelado', 'concluido') then
    return new;
  end if;

  if new.fim <= new.inicio then
    raise exception 'O fim do atendimento deve ser posterior ao inicio.';
  end if;

  -- Serializa qualquer tentativa concorrente para o mesmo profissional.
  perform pg_advisory_xact_lock(hashtextextended(
    new.id_empresa::text || ':' || new.id_funcionario::text,
    0
  ));

  select greatest(coalesce(s.intervalo_minutos, 0), 0)
    into v_intervalo_novo
  from public.servicos s
  where s.id_empresa = new.id_empresa
    and s.id = new.id_servico;

  if exists (
    select 1
    from public.agendamentos_servicos item
    join public.servicos servico_existente
      on servico_existente.id_empresa = item.id_empresa
     and servico_existente.id = item.id_servico
    where item.id_empresa = new.id_empresa
      and item.id_funcionario = new.id_funcionario
      and item.status not in ('cancelado', 'concluido')
      and (new.id is null or item.id <> new.id)
      and tstzrange(
        item.inicio,
        item.fim + make_interval(mins => greatest(coalesce(servico_existente.intervalo_minutos, 0), 0)),
        '[)'
      ) && tstzrange(
        new.inicio,
        new.fim + make_interval(mins => coalesce(v_intervalo_novo, 0)),
        '[)'
      )
  ) then
    raise exception using
      errcode = '23P01',
      message = 'Este profissional ja possui um atendimento nesse horario ou no intervalo entre atendimentos.';
  end if;

  return new;
end;
$$;
drop trigger if exists zz_agendamentos_servicos_impedir_conflito
  on public.agendamentos_servicos;
create trigger zz_agendamentos_servicos_impedir_conflito
before insert or update of id_empresa, id_servico, id_funcionario, inicio, fim, status
on public.agendamentos_servicos
for each row execute function private.impedir_conflito_profissional_agendamento();
create or replace function private.obter_disponibilidade_site(
  p_id_empresa bigint,
  p_id_unidade bigint,
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
  v_antecedencia_minutos integer := 120;
  v_janela_dias integer := 60;
  v_resultado jsonb;
begin
  select coalesce(u.fuso_horario, e.fuso_horario, 'America/Sao_Paulo')
    into v_fuso
  from public.unidades u
  join public.empresas e on e.id = u.id_empresa
  where u.id_empresa = p_id_empresa
    and u.id = p_id_unidade
    and u.ativo
    and e.status = 'ativo';

  if not found then
    raise exception 'Unidade indisponivel para agendamento online.';
  end if;

  select
    p.antecedencia_agendamento_minutos,
    p.janela_agendamento_dias
    into v_antecedencia_minutos, v_janela_dias
  from public.politicas_cancelamento p
  where p.id_empresa = p_id_empresa
    and p.ativo
    and p.vigente_desde <= p_data
    and (p.vigente_ate is null or p.vigente_ate >= p_data)
    and (p.id_unidade = p_id_unidade or p.id_unidade is null)
  order by (p.id_unidade = p_id_unidade) desc, p.vigente_desde desc, p.id desc
  limit 1;

  v_antecedencia_minutos := coalesce(v_antecedencia_minutos, 120);
  v_janela_dias := coalesce(v_janela_dias, 60);
  v_hoje := (now() at time zone v_fuso)::date;

  if p_data < v_hoje or p_data > v_hoje + v_janela_dias then
    raise exception 'Escolha uma data entre hoje e os proximos % dias.', v_janela_dias;
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
      greatest(coalesce(s.intervalo_minutos, 0), 0) as intervalo_minutos,
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
      e.intervalo_minutos,
      e.preco,
      ph.intervalo_inicio as profissional_intervalo_inicio,
      ph.intervalo_fim as profissional_intervalo_fim,
      uh.intervalo_inicio as unidade_intervalo_inicio,
      uh.intervalo_fim as unidade_intervalo_fim,
      slot.inicio_local,
      slot.inicio_local + make_interval(mins => e.duracao_minutos) as fim_local
    from elegiveis e
    join public.funcionarios_horarios ph
      on ph.id_empresa = p_id_empresa
     and ph.id_funcionario = e.id_funcionario
     and ph.ativo
     and ph.dia_semana = extract(dow from p_data)::integer
    join public.horarios_funcionamento uh
      on uh.id_empresa = p_id_empresa
     and uh.id_unidade = p_id_unidade
     and uh.ativo
     and uh.dia_semana = extract(dow from p_data)::integer
    cross join lateral generate_series(
      (p_data + greatest(ph.hora_inicio, uh.hora_abertura))::timestamp,
      (p_data + least(ph.hora_fim, uh.hora_fechamento))::timestamp
        - make_interval(mins => e.duracao_minutos),
      make_interval(mins => e.passo_minutos)
    ) as slot(inicio_local)
    where greatest(ph.hora_inicio, uh.hora_abertura)
      < least(ph.hora_fim, uh.hora_fechamento)
  ), candidatos as (
    select
      c.*,
      c.inicio_local at time zone v_fuso as inicio,
      c.fim_local at time zone v_fuso as fim
    from candidatos_locais c
    where not (
      c.profissional_intervalo_inicio is not null
      and c.profissional_intervalo_fim is not null
      and c.inicio_local < (p_data + c.profissional_intervalo_fim)::timestamp
      and c.fim_local > (p_data + c.profissional_intervalo_inicio)::timestamp
    )
    and not (
      c.unidade_intervalo_inicio is not null
      and c.unidade_intervalo_fim is not null
      and c.inicio_local < (p_data + c.unidade_intervalo_fim)::timestamp
      and c.fim_local > (p_data + c.unidade_intervalo_inicio)::timestamp
    )
  ), disponiveis as (
    select c.*
    from candidatos c
    where c.inicio >= now() + make_interval(mins => v_antecedencia_minutos)
      and not exists (
        select 1
        from public.agendamentos_servicos item
        join public.servicos servico_existente
          on servico_existente.id_empresa = item.id_empresa
         and servico_existente.id = item.id_servico
        where item.id_empresa = p_id_empresa
          and item.id_funcionario = c.id_funcionario
          and item.status not in ('cancelado', 'concluido')
          and item.inicio < c.fim + make_interval(mins => c.intervalo_minutos)
          and item.fim + make_interval(
            mins => greatest(coalesce(servico_existente.intervalo_minutos, 0), 0)
          ) > c.inicio
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
          and (bloqueio.id_unidade is null or bloqueio.id_unidade = p_id_unidade)
          and (bloqueio.id_funcionario is null or bloqueio.id_funcionario = c.id_funcionario)
          and bloqueio.inicio < c.fim
          and bloqueio.fim > c.inicio
      )
      and not exists (
        select 1
        from public.disponibilidades indisponivel
        where indisponivel.id_empresa = p_id_empresa
          and indisponivel.id_unidade = p_id_unidade
          and indisponivel.id_profissional = c.id_funcionario
          and indisponivel.tipo = 'indisponivel'
          and indisponivel.ativo
          and indisponivel.inicio < c.fim
          and indisponivel.fim > c.inicio
      )
      and (
        not exists (
          select 1
          from public.disponibilidades janela
          where janela.id_empresa = p_id_empresa
            and janela.id_unidade = p_id_unidade
            and janela.id_profissional = c.id_funcionario
            and janela.tipo = 'disponivel'
            and janela.ativo
            and (janela.inicio at time zone v_fuso)::date = p_data
        )
        or exists (
          select 1
          from public.disponibilidades janela
          where janela.id_empresa = p_id_empresa
            and janela.id_unidade = p_id_unidade
            and janela.id_profissional = c.id_funcionario
            and janela.tipo = 'disponivel'
            and janela.ativo
            and janela.inicio <= c.inicio
            and janela.fim >= c.fim
        )
      )
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id_funcionario', d.id_funcionario,
    'nome_funcionario', d.nome_funcionario,
    'inicio', d.inicio,
    'fim', d.fim,
    'horario', to_char(d.inicio_local, 'HH24:MI'),
    'duracao_minutos', d.duracao_minutos,
    'intervalo_minutos', d.intervalo_minutos,
    'preco', d.preco
  ) order by d.inicio, d.nome_funcionario), '[]'::jsonb)
    into v_resultado
  from disponiveis d;

  return v_resultado;
end;
$$;
-- Assinatura antiga: mantida para clientes existentes, agora usando a unidade
-- principal e todas as mesmas validacoes da assinatura nova.
create or replace function private.obter_disponibilidade_site(
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
  v_id_unidade bigint;
begin
  select u.id into v_id_unidade
  from public.unidades u
  where u.id_empresa = p_id_empresa and u.ativo
  order by u.principal desc, u.id
  limit 1;

  return private.obter_disponibilidade_site(
    p_id_empresa, v_id_unidade, p_data, p_id_servico, p_id_funcionario
  );
end;
$$;
create or replace function private.criar_agendamento_site(
  p_id_empresa bigint,
  p_id_unidade bigint,
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
    raise exception 'Identificador da solicitacao ausente.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'site-booking:' || p_id_empresa::text || ':' || p_chave_idempotencia::text,
    0
  ));

  select a.id, a.site_access_token
    into v_agendamento_id, v_token
  from public.agendamentos a
  where a.id_empresa = p_id_empresa
    and a.site_booking_key = p_chave_idempotencia;

  if found then
    return private.obter_agendamento_site(v_token);
  end if;

  if not exists (
    select 1 from public.unidades u
    where u.id_empresa = p_id_empresa and u.id = p_id_unidade and u.ativo
  ) then
    raise exception 'Unidade indisponivel para agendamento online.';
  end if;
  if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
    raise exception 'Informe um nome valido.';
  end if;
  if char_length(v_telefone) < 10 or char_length(v_telefone) > 13 then
    raise exception 'Informe um WhatsApp valido com DDD.';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Informe um e-mail valido.';
  end if;
  if char_length(coalesce(p_observacoes, '')) > 1000 then
    raise exception 'As observacoes podem ter no maximo 1000 caracteres.';
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
    raise exception 'Muitas solicitacoes recentes para este telefone. Aguarde antes de tentar novamente.';
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
    raise exception 'Servico ou profissional indisponivel para agendamento online.';
  end if;

  -- A trava e a segunda consulta acontecem na mesma transacao do INSERT.
  perform pg_advisory_xact_lock(hashtextextended(
    p_id_empresa::text || ':' || p_id_funcionario::text,
    0
  ));

  select exists (
    select 1
    from jsonb_array_elements(private.obter_disponibilidade_site(
      p_id_empresa,
      p_id_unidade,
      (p_inicio at time zone coalesce((
        select u.fuso_horario from public.unidades u
        where u.id_empresa = p_id_empresa and u.id = p_id_unidade
      ), 'America/Sao_Paulo'))::date,
      p_id_servico,
      p_id_funcionario
    )) slot
    where (slot->>'id_funcionario')::bigint = p_id_funcionario
      and (slot->>'inicio')::timestamptz = p_inicio
  ) into v_disponivel;

  if not v_disponivel then
    raise exception using
      errcode = '23P01',
      message = 'Este horario nao esta mais disponivel. Escolha outro horario.';
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
      '[SITE] Cadastro criado pelo agendamento publico.'
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
    id_empresa, id_unidade, id_cliente, inicio, fim, observacoes,
    sinal_status, sinal_valor, status, origem, criado_por,
    site_access_token, site_booking_key, site_notification_preferences
  ) values (
    p_id_empresa, p_id_unidade, v_cliente_id, p_inicio, v_fim,
    nullif(btrim(p_observacoes), ''),
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
    '[SITE] Item criado pelo agendamento publico.'
  );

  return private.obter_agendamento_site(v_token);
end;
$$;
create or replace function private.criar_agendamento_site(
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
  v_id_unidade bigint;
begin
  select u.id into v_id_unidade
  from public.unidades u
  where u.id_empresa = p_id_empresa and u.ativo
  order by u.principal desc, u.id
  limit 1;

  return private.criar_agendamento_site(
    p_id_empresa, v_id_unidade, p_nome, p_telefone, p_email,
    p_id_servico, p_id_funcionario, p_inicio, p_observacoes,
    p_lembrete_whatsapp, p_lembrete_email, p_chave_idempotencia
  );
end;
$$;
create or replace function private.reagendar_agendamento_site(
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
  v_antecedencia_reagendamento integer := 1440;
begin
  select * into v_agendamento
  from public.agendamentos a
  where a.site_access_token = p_token
  for update;

  if not found then raise exception 'Agendamento nao encontrado.'; end if;
  if v_agendamento.status in ('cancelado', 'finalizado', 'no_show', 'em_atendimento') then
    raise exception 'Este agendamento nao pode mais ser reagendado.';
  end if;

  select coalesce(p.antecedencia_reagendamento_minutos, 1440)
    into v_antecedencia_reagendamento
  from public.politicas_cancelamento p
  where p.id_empresa = v_agendamento.id_empresa
    and p.ativo
    and current_date between p.vigente_desde and coalesce(p.vigente_ate, 'infinity'::date)
    and (p.id_unidade = v_agendamento.id_unidade or p.id_unidade is null)
  order by (p.id_unidade = v_agendamento.id_unidade) desc, p.vigente_desde desc, p.id desc
  limit 1;

  if v_agendamento.inicio <= now() + make_interval(mins => coalesce(v_antecedencia_reagendamento, 1440)) then
    raise exception 'O prazo para reagendamento online desta reserva ja terminou.';
  end if;

  select * into v_item
  from public.agendamentos_servicos item
  where item.id_empresa = v_agendamento.id_empresa
    and item.id_agendamento = v_agendamento.id
    and item.status <> 'cancelado'
  order by item.ordem, item.id
  limit 1
  for update;

  select coalesce(u.fuso_horario, e.fuso_horario, 'America/Sao_Paulo')
    into v_fuso
  from public.unidades u
  join public.empresas e on e.id = u.id_empresa
  where u.id_empresa = v_agendamento.id_empresa
    and u.id = v_agendamento.id_unidade;

  perform pg_advisory_xact_lock(hashtextextended(
    v_agendamento.id_empresa::text || ':' || p_id_funcionario::text,
    0
  ));

  select exists (
    select 1
    from jsonb_array_elements(private.obter_disponibilidade_site(
      v_agendamento.id_empresa,
      v_agendamento.id_unidade,
      (p_inicio at time zone v_fuso)::date,
      v_item.id_servico,
      p_id_funcionario
    )) slot
    where (slot->>'id_funcionario')::bigint = p_id_funcionario
      and (slot->>'inicio')::timestamptz = p_inicio
  ) into v_disponivel;

  if not v_disponivel then
    raise exception using
      errcode = '23P01',
      message = 'Este horario nao esta mais disponivel. Escolha outro horario.';
  end if;

  v_fim := p_inicio + make_interval(mins => v_item.duracao_minutos);

  update public.agendamentos
  set inicio = p_inicio, fim = v_fim
  where id = v_agendamento.id and id_empresa = v_agendamento.id_empresa;

  update public.agendamentos_servicos
  set id_funcionario = p_id_funcionario, inicio = p_inicio, fim = v_fim
  where id = v_item.id and id_empresa = v_item.id_empresa;

  return private.obter_agendamento_site(p_token);
end;
$$;
create or replace function public.obter_disponibilidade_site(
  p_id_empresa bigint,
  p_id_unidade bigint,
  p_data date,
  p_id_servico bigint,
  p_id_funcionario bigint default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.obter_disponibilidade_site($1, $2, $3, $4, $5)
$$;
create or replace function public.criar_agendamento_site(
  p_id_empresa bigint,
  p_id_unidade bigint,
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
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.criar_agendamento_site(
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
  )
$$;
revoke all on function private.obter_disponibilidade_site(bigint, bigint, date, bigint, bigint)
  from public, anon, authenticated;
revoke all on function private.criar_agendamento_site(
  bigint, bigint, text, text, text, bigint, bigint, timestamptz,
  text, boolean, boolean, uuid
) from public, anon, authenticated;
grant execute on function private.obter_disponibilidade_site(bigint, bigint, date, bigint, bigint)
  to anon, authenticated;
grant execute on function private.criar_agendamento_site(
  bigint, bigint, text, text, text, bigint, bigint, timestamptz,
  text, boolean, boolean, uuid
) to anon, authenticated;
revoke all on function public.obter_disponibilidade_site(bigint, bigint, date, bigint, bigint)
  from public, anon, authenticated;
revoke all on function public.criar_agendamento_site(
  bigint, bigint, text, text, text, bigint, bigint, timestamptz,
  text, boolean, boolean, uuid
) from public, anon, authenticated;
grant execute on function public.obter_disponibilidade_site(bigint, bigint, date, bigint, bigint)
  to anon, authenticated;
grant execute on function public.criar_agendamento_site(
  bigint, bigint, text, text, text, bigint, bigint, timestamptz,
  text, boolean, boolean, uuid
) to anon, authenticated;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agendamentos_servicos_profissional_periodo_excl'
      and conrelid = 'public.agendamentos_servicos'::regclass
  ) then
    raise exception 'A protecao contra sobreposicao de agendamentos nao foi instalada.';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'zz_agendamentos_servicos_impedir_conflito'
      and tgrelid = 'public.agendamentos_servicos'::regclass
      and tgenabled <> 'D'
  ) then
    raise exception 'O gatilho de intervalo entre atendimentos nao foi instalado.';
  end if;
end;
$$;
comment on constraint agendamentos_servicos_profissional_periodo_excl
  on public.agendamentos_servicos is
  'Impede no banco dois atendimentos ativos simultaneos do mesmo profissional.';
comment on function private.impedir_conflito_profissional_agendamento() is
  'Serializa agendamentos por profissional e aplica o intervalo entre servicos.';
