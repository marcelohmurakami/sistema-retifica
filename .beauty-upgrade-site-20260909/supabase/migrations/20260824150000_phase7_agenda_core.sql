-- Fase 7: agenda atômica, transições de status e disponibilidade canônica.

create or replace function private.preparar_agendamento_servico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agendamento public.agendamentos%rowtype;
  v_duracao integer;
  v_preco numeric(10,2);
  v_tem_configuracao boolean;
begin
  select * into v_agendamento
  from public.agendamentos a
  where a.id = new.id_agendamento and a.id_empresa = new.id_empresa;

  if not found then
    raise exception 'Agendamento inválido para esta empresa.';
  end if;

  if v_agendamento.status in ('finalizado', 'no_show', 'cancelado') then
    raise exception 'Não é permitido alterar serviços de um agendamento encerrado.';
  end if;

  if new.inicio < v_agendamento.inicio
     or coalesce(new.fim, new.inicio) > v_agendamento.fim then
    raise exception 'O serviço precisa estar dentro do período do agendamento.';
  end if;

  select exists (
    select 1 from public.funcionarios_servicos fs
    where fs.id_empresa = new.id_empresa
      and fs.id_funcionario = new.id_funcionario
  ) into v_tem_configuracao;

  select
    coalesce(fs.duracao_personalizada, s.duracao_minutos),
    coalesce(fs.valor_personalizado, s.preco)
  into v_duracao, v_preco
  from public.servicos s
  join public.funcionarios f
    on f.id_empresa = s.id_empresa
   and f.id = new.id_funcionario
   and f.ativo
   and f.atende_clientes
  left join public.funcionarios_servicos fs
    on fs.id_empresa = s.id_empresa
   and fs.id_servico = s.id
   and fs.id_funcionario = new.id_funcionario
   and fs.ativo
  where s.id_empresa = new.id_empresa
    and s.id = new.id_servico
    and s.ativo
    and (not v_tem_configuracao or fs.id is not null);

  if not found then
    raise exception 'O profissional não está habilitado para este serviço.';
  end if;

  new.duracao_minutos = coalesce(new.duracao_minutos, v_duracao);
  new.preco = coalesce(new.preco, v_preco);
  new.fim = coalesce(new.fim, new.inicio + make_interval(mins => new.duracao_minutos));

  if new.fim > v_agendamento.fim then
    raise exception 'O serviço ultrapassa o fim do agendamento.';
  end if;

  new.updated_at = now();
  return new;
end;
$$;
create or replace function private.validar_disponibilidade_funcionario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fuso text;
  v_inicio_local timestamp;
  v_fim_local timestamp;
  v_data date;
  v_dia smallint;
begin
  if new.status in ('cancelado', 'finalizado', 'no_show') then
    return new;
  end if;

  if exists (
    select 1 from public.bloqueios_agenda b
    where b.id_empresa = new.id_empresa
      and b.status = 'ativo'
      and (b.id_funcionario is null or b.id_funcionario = new.id_funcionario)
      and tstzrange(b.inicio, b.fim, '[)') && tstzrange(new.inicio, new.fim, '[)')
  ) then
    raise exception 'O horário está bloqueado na agenda.';
  end if;

  if exists (
    select 1 from public.funcionarios_ausencias a
    where a.id_empresa = new.id_empresa
      and a.id_funcionario = new.id_funcionario
      and a.status = 'aprovado'
      and tstzrange(a.inicio, a.fim, '[)') && tstzrange(new.inicio, new.fim, '[)')
  ) then
    raise exception 'O funcionário está ausente nesse período.';
  end if;

  select e.fuso_horario into v_fuso
  from public.empresas e where e.id = new.id_empresa;

  v_inicio_local := new.inicio at time zone coalesce(v_fuso, 'America/Sao_Paulo');
  v_fim_local := new.fim at time zone coalesce(v_fuso, 'America/Sao_Paulo');
  v_data := v_inicio_local::date;
  v_dia := extract(dow from v_inicio_local)::smallint;

  if v_fim_local::date <> v_data then
    raise exception 'O serviço não pode atravessar dois dias da agenda.';
  end if;

  if exists (
    select 1 from public.funcionarios_horarios h
    where h.id_empresa = new.id_empresa
      and h.id_funcionario = new.id_funcionario
      and h.ativo
  ) and not exists (
    select 1 from public.funcionarios_horarios h
    where h.id_empresa = new.id_empresa
      and h.id_funcionario = new.id_funcionario
      and h.ativo
      and h.dia_semana = v_dia
      and h.hora_inicio <= v_inicio_local::time
      and h.hora_fim >= v_fim_local::time
      and (
        h.intervalo_inicio is null
        or h.intervalo_fim is null
        or not (
          v_inicio_local::time < h.intervalo_fim
          and v_fim_local::time > h.intervalo_inicio
        )
      )
  ) then
    raise exception 'O serviço está fora da jornada ou coincide com o intervalo do funcionário.';
  end if;

  return new;
end;
$$;
create or replace function private.validar_agendamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.fim <= new.inicio then
    raise exception 'O fim do agendamento deve ser posterior ao início.';
  end if;

  if (
    tg_op = 'INSERT'
    or new.inicio is distinct from old.inicio
    or new.fim is distinct from old.fim
  ) and new.inicio <= now() then
    raise exception 'Não é permitido criar ou reagendar para um horário passado.';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status in ('finalizado', 'no_show', 'cancelado') then
      raise exception 'Um agendamento encerrado não pode mudar de status.';
    end if;

    if not (
      (old.status in ('aguardando_confirmacao', 'aguardando_pagamento') and new.status in ('confirmado', 'cancelado', 'no_show'))
      or (old.status = 'confirmado' and new.status in ('em_atendimento', 'cancelado', 'no_show'))
      or (old.status = 'em_atendimento' and new.status in ('finalizado', 'cancelado'))
    ) then
      raise exception 'Transição de status inválida: % para %.', old.status, new.status;
    end if;
  end if;

  if new.status = 'no_show' and now() < new.inicio then
    raise exception 'O não comparecimento só pode ser registrado após o início previsto.';
  end if;

  if new.status = 'cancelado' and nullif(btrim(new.motivo_cancelamento), '') is null then
    raise exception 'Informe o motivo do cancelamento.';
  end if;

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    case new.status
      when 'confirmado' then new.confirmado_em = coalesce(new.confirmado_em, now());
      when 'em_atendimento' then new.iniciado_em = coalesce(new.iniciado_em, now());
      when 'finalizado' then new.finalizado_em = coalesce(new.finalizado_em, now());
      when 'no_show' then new.no_show_em = coalesce(new.no_show_em, now());
      when 'cancelado' then new.cancelado_em = coalesce(new.cancelado_em, now());
      else null;
    end case;
  end if;

  if new.sinal_status = 'pago' then
    new.sinal_pago_em = coalesce(new.sinal_pago_em, now());
  end if;

  new.updated_at = now();
  return new;
end;
$$;
create or replace function private.sincronizar_status_servicos_agendamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'em_atendimento' then
      update public.agendamentos_servicos
      set status = 'em_execucao', updated_at = now()
      where id_agendamento = new.id and id_empresa = new.id_empresa and status = 'reservado';
    elsif new.status in ('cancelado', 'no_show') then
      update public.agendamentos_servicos
      set status = 'cancelado', updated_at = now()
      where id_agendamento = new.id and id_empresa = new.id_empresa and status in ('reservado', 'em_execucao');
    elsif new.status = 'finalizado' then
      update public.agendamentos_servicos
      set status = 'concluido', updated_at = now()
      where id_agendamento = new.id and id_empresa = new.id_empresa and status in ('reservado', 'em_execucao');
    end if;
  end if;
  return new;
end;
$$;
create or replace function private.validar_servicos_no_periodo_agendamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.agendamentos_servicos s
    where s.id_empresa = new.id_empresa
      and s.id_agendamento = new.id
      and s.status not in ('cancelado')
      and (s.inicio < new.inicio or s.fim > new.fim)
  ) then
    raise exception 'Existem serviços fora do período do agendamento.';
  end if;
  return null;
end;
$$;
drop trigger if exists agendamentos_validar_servicos_periodo on public.agendamentos;
create constraint trigger agendamentos_validar_servicos_periodo
after insert or update of inicio, fim on public.agendamentos
deferrable initially deferred
for each row execute function private.validar_servicos_no_periodo_agendamento();
create or replace function public.salvar_agendamento(
  p_agendamento_id bigint,
  p_id_empresa bigint,
  p_id_cliente bigint,
  p_observacoes text,
  p_sinal_status text,
  p_sinal_valor numeric,
  p_servicos jsonb
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_id bigint;
  v_status text;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_item jsonb;
  v_item_id bigint;
begin
  if p_servicos is null or jsonb_typeof(p_servicos) <> 'array' or jsonb_array_length(p_servicos) = 0 then
    raise exception 'Adicione pelo menos um serviço ao agendamento.';
  end if;

  select min((item->>'inicio')::timestamptz), max((item->>'fim')::timestamptz)
  into v_inicio, v_fim
  from jsonb_array_elements(p_servicos) item;

  if p_agendamento_id is null then
    insert into public.agendamentos (
      id_empresa, id_cliente, inicio, fim, observacoes,
      sinal_status, sinal_valor, status, origem, criado_por
    ) values (
      p_id_empresa, p_id_cliente, v_inicio, v_fim, nullif(btrim(p_observacoes), ''),
      p_sinal_status, p_sinal_valor, 'aguardando_confirmacao', 'sistema', auth.uid()
    ) returning id into v_id;
  else
    select status into v_status
    from public.agendamentos
    where id = p_agendamento_id and id_empresa = p_id_empresa
    for update;

    if not found then raise exception 'Agendamento não encontrado.'; end if;
    if v_status in ('em_atendimento', 'finalizado', 'no_show', 'cancelado') then
      raise exception 'Este agendamento não pode mais ser editado.';
    end if;

    update public.agendamentos
    set id_cliente = p_id_cliente,
        inicio = v_inicio,
        fim = v_fim,
        observacoes = nullif(btrim(p_observacoes), ''),
        sinal_status = p_sinal_status,
        sinal_valor = p_sinal_valor
    where id = p_agendamento_id and id_empresa = p_id_empresa;
    v_id := p_agendamento_id;

    update public.agendamentos_servicos
    set status = 'cancelado', updated_at = now()
    where id_empresa = p_id_empresa
      and id_agendamento = v_id
      and status in ('reservado', 'em_execucao');
  end if;

  for v_item in select value from jsonb_array_elements(p_servicos)
  loop
    v_item_id := nullif(v_item->>'id', '')::bigint;

    if v_item_id is null then
      insert into public.agendamentos_servicos (
        id_empresa, id_agendamento, id_servico, id_funcionario,
        inicio, fim, duracao_minutos, preco, ordem, status, observacoes
      ) values (
        p_id_empresa, v_id, (v_item->>'id_servico')::bigint, (v_item->>'id_funcionario')::bigint,
        (v_item->>'inicio')::timestamptz, (v_item->>'fim')::timestamptz,
        (v_item->>'duracao_minutos')::integer, (v_item->>'preco')::numeric,
        (v_item->>'ordem')::integer, 'reservado', nullif(btrim(v_item->>'observacoes'), '')
      );
    else
      update public.agendamentos_servicos
      set id_servico = (v_item->>'id_servico')::bigint,
          id_funcionario = (v_item->>'id_funcionario')::bigint,
          inicio = (v_item->>'inicio')::timestamptz,
          fim = (v_item->>'fim')::timestamptz,
          duracao_minutos = (v_item->>'duracao_minutos')::integer,
          preco = (v_item->>'preco')::numeric,
          ordem = (v_item->>'ordem')::integer,
          status = 'reservado',
          observacoes = nullif(btrim(v_item->>'observacoes'), '')
      where id = v_item_id
        and id_empresa = p_id_empresa
        and id_agendamento = v_id;

      if not found then raise exception 'Serviço do agendamento não encontrado.'; end if;
    end if;
  end loop;

  return v_id;
end;
$$;
revoke all on function public.salvar_agendamento(bigint, bigint, bigint, text, text, numeric, jsonb) from public;
grant execute on function public.salvar_agendamento(bigint, bigint, bigint, text, text, numeric, jsonb) to authenticated;
