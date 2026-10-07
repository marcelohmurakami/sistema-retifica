-- Fase 13: integra o painel administrativo aos mesmos invariantes usados pelo site.
-- Todas as operações críticas abaixo são atômicas e sempre validam o tenant/cargo.

create table if not exists public.configuracoes_lembretes_empresa (
  id_empresa bigint primary key references public.empresas(id) on delete cascade,
  ativo boolean not null default true,
  email boolean not null default true,
  whatsapp boolean not null default true,
  antecedencias_minutos integer[] not null default array[1440, 120],
  max_tentativas integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint configuracoes_lembretes_antecedencias_check check (
    coalesce(array_length(antecedencias_minutos, 1), 0) between 1 and 5
    and 0 < all(antecedencias_minutos)
    and 43200 >= all(antecedencias_minutos)
  ),
  constraint configuracoes_lembretes_tentativas_check check (max_tentativas between 1 and 10)
);

insert into public.configuracoes_lembretes_empresa (id_empresa)
select e.id from public.empresas e
on conflict (id_empresa) do nothing;

alter table public.configuracoes_lembretes_empresa enable row level security;

drop policy if exists configuracoes_lembretes_equipe_le on public.configuracoes_lembretes_empresa;
create policy configuracoes_lembretes_equipe_le
on public.configuracoes_lembretes_empresa for select to authenticated
using (private.usuario_pertence_empresa(id_empresa));

drop policy if exists configuracoes_lembretes_gestao_gerencia on public.configuracoes_lembretes_empresa;
create policy configuracoes_lembretes_gestao_gerencia
on public.configuracoes_lembretes_empresa for all to authenticated
using (private.usuario_tem_tipo_empresa(
  id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
))
with check (private.usuario_tem_tipo_empresa(
  id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
));

revoke all on public.configuracoes_lembretes_empresa from public, anon, authenticated;
grant select on public.configuracoes_lembretes_empresa to authenticated;

create or replace function private.agendar_lembretes_agendamento(
  p_id_empresa bigint,
  p_id_agendamento bigint
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agendamento public.agendamentos%rowtype;
  v_cliente public.clientes%rowtype;
  v_config public.configuracoes_lembretes_empresa%rowtype;
  v_preferencia public.preferencias_lembrete%rowtype;
  v_antecedencia integer;
  v_agendada_para timestamptz;
  v_total integer := 0;
  v_inseridos integer := 0;
  v_inicio_chave text;
begin
  update public.fila_mensagens
  set status = 'cancelada', cancelada_em = now(), updated_at = now()
  where id_empresa = p_id_empresa
    and status in ('pendente', 'erro')
    and dados_template->>'tipo' = 'lembrete_agendamento'
    and dados_template->>'agendamento_id' = p_id_agendamento::text;

  select * into v_agendamento
  from public.agendamentos a
  where a.id_empresa = p_id_empresa and a.id = p_id_agendamento;
  if not found
     or v_agendamento.status in ('cancelado', 'finalizado', 'no_show')
     or v_agendamento.inicio <= now() then
    return 0;
  end if;

  select * into v_config
  from public.configuracoes_lembretes_empresa c
  where c.id_empresa = p_id_empresa and c.ativo;
  if not found or (not v_config.email and not v_config.whatsapp) then return 0; end if;

  select * into v_cliente
  from public.clientes c
  where c.id_empresa = p_id_empresa and c.id = v_agendamento.id_cliente;
  if not found then return 0; end if;

  select * into v_preferencia
  from public.preferencias_lembrete p
  where p.id_empresa = p_id_empresa and p.id_cliente = v_agendamento.id_cliente;

  if found and not v_preferencia.ativo then return 0; end if;
  v_inicio_chave := extract(epoch from v_agendamento.inicio)::bigint::text;

  foreach v_antecedencia in array v_config.antecedencias_minutos loop
    v_agendada_para := v_agendamento.inicio - make_interval(mins => v_antecedencia);
    if v_agendada_para <= now() then continue; end if;

    if v_config.email
       and coalesce(v_preferencia.email, true)
       and nullif(btrim(v_cliente.email), '') is not null then
      insert into public.fila_mensagens (
        id_empresa, id_cliente, canal, destinatario, assunto, conteudo,
        dados_template, status, prioridade, agendada_para,
        tentativas, max_tentativas, chave_idempotencia
      ) values (
        p_id_empresa, v_cliente.id, 'email', lower(btrim(v_cliente.email)),
        'Lembrete do seu agendamento',
        'Seu atendimento está chegando. Consulte os detalhes na sua área do cliente.',
        jsonb_build_object(
          'tipo', 'lembrete_agendamento', 'agendamento_id', p_id_agendamento,
          'inicio', v_agendamento.inicio, 'antecedencia_minutos', v_antecedencia
        ),
        'pendente', 50, v_agendada_para, 0, v_config.max_tentativas,
        'lembrete:' || p_id_agendamento::text || ':' || v_inicio_chave || ':' || v_antecedencia::text || ':email'
      ) on conflict do nothing;
      get diagnostics v_inseridos = row_count;
      v_total := v_total + v_inseridos;
    end if;

    if v_config.whatsapp
       and coalesce(v_preferencia.whatsapp, true)
       and nullif(btrim(coalesce(v_cliente.telefone_e164, v_cliente.telefone_principal)), '') is not null then
      insert into public.fila_mensagens (
        id_empresa, id_cliente, canal, destinatario, assunto, conteudo,
        dados_template, status, prioridade, agendada_para,
        tentativas, max_tentativas, chave_idempotencia
      ) values (
        p_id_empresa, v_cliente.id, 'whatsapp',
        btrim(coalesce(v_cliente.telefone_e164, v_cliente.telefone_principal)),
        'Lembrete do seu agendamento',
        'Seu atendimento está chegando. Consulte os detalhes na sua área do cliente.',
        jsonb_build_object(
          'tipo', 'lembrete_agendamento', 'agendamento_id', p_id_agendamento,
          'inicio', v_agendamento.inicio, 'antecedencia_minutos', v_antecedencia
        ),
        'pendente', 50, v_agendada_para, 0, v_config.max_tentativas,
        'lembrete:' || p_id_agendamento::text || ':' || v_inicio_chave || ':' || v_antecedencia::text || ':whatsapp'
      ) on conflict do nothing;
      get diagnostics v_inseridos = row_count;
      v_total := v_total + v_inseridos;
    end if;
  end loop;

  return v_total;
end;
$$;

create or replace function private.sincronizar_lembretes_agendamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.agendar_lembretes_agendamento(new.id_empresa, new.id);
  return new;
end;
$$;

drop trigger if exists agendamentos_sincronizar_lembretes on public.agendamentos;
create trigger agendamentos_sincronizar_lembretes
after insert or update of inicio, status, id_cliente, site_notification_preferences
on public.agendamentos
for each row execute function private.sincronizar_lembretes_agendamento();

create or replace function public.salvar_configuracao_lembretes_administracao(
  p_id_empresa bigint,
  p_ativo boolean,
  p_email boolean,
  p_whatsapp boolean,
  p_antecedencias_minutos integer[],
  p_max_tentativas integer
)
returns public.configuracoes_lembretes_empresa
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resultado public.configuracoes_lembretes_empresa%rowtype;
  v_agendamento record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
  ) then raise exception 'Você não possui permissão para configurar lembretes.'; end if;

  if coalesce(array_length(p_antecedencias_minutos, 1), 0) not between 1 and 5
     or not (0 < all(p_antecedencias_minutos))
     or not (43200 >= all(p_antecedencias_minutos)) then
    raise exception 'Informe de uma a cinco antecedências entre 1 minuto e 30 dias.';
  end if;
  if p_max_tentativas not between 1 and 10 then
    raise exception 'O número de tentativas deve ficar entre 1 e 10.';
  end if;

  insert into public.configuracoes_lembretes_empresa (
    id_empresa, ativo, email, whatsapp, antecedencias_minutos, max_tentativas, updated_at
  ) values (
    p_id_empresa, p_ativo, p_email, p_whatsapp,
    (select array_agg(distinct value order by value desc) from unnest(p_antecedencias_minutos) value),
    p_max_tentativas, now()
  )
  on conflict (id_empresa) do update set
    ativo = excluded.ativo, email = excluded.email, whatsapp = excluded.whatsapp,
    antecedencias_minutos = excluded.antecedencias_minutos,
    max_tentativas = excluded.max_tentativas, updated_at = now()
  returning * into v_resultado;

  for v_agendamento in
    select a.id from public.agendamentos a
    where a.id_empresa = p_id_empresa and a.inicio > now()
      and a.status not in ('cancelado', 'finalizado', 'no_show')
  loop
    perform private.agendar_lembretes_agendamento(p_id_empresa, v_agendamento.id);
  end loop;

  return v_resultado;
end;
$$;

create or replace function public.reenviar_confirmacao_agendamento_administracao(
  p_id_empresa bigint,
  p_id_agendamento bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_antes integer;
  v_depois integer;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa, array['dono', 'gerente', 'recepcionista']::public.tipos_usuarios[]
  ) then raise exception 'Você não possui permissão para reenviar confirmações.'; end if;

  select a.status into v_status from public.agendamentos a
  where a.id_empresa = p_id_empresa and a.id = p_id_agendamento for update;
  if not found then raise exception 'Agendamento não encontrado.'; end if;
  if v_status in ('cancelado', 'finalizado', 'no_show') then
    raise exception 'Não é possível reenviar a confirmação de um agendamento encerrado.';
  end if;
  if exists (
    select 1 from public.fila_mensagens m
    where m.id_empresa = p_id_empresa and m.status = 'pendente'
      and m.dados_template->>'agendamento_id' = p_id_agendamento::text
      and m.dados_template->>'tipo' = 'confirmacao_reenviada'
      and m.created_at > now() - interval '30 seconds'
  ) then raise exception 'A confirmação já foi reenviada. Aguarde alguns segundos.'; end if;

  update public.fila_mensagens
  set status = 'cancelada', cancelada_em = now(), updated_at = now()
  where id_empresa = p_id_empresa and status in ('pendente', 'erro')
    and dados_template->>'agendamento_id' = p_id_agendamento::text
    and dados_template->>'tipo' in ('confirmacao_agendamento', 'confirmacao_reenviada', 'reagendamento');

  select count(*) into v_antes from public.fila_mensagens
  where id_empresa = p_id_empresa and dados_template->>'agendamento_id' = p_id_agendamento::text;
  perform private.enfileirar_mensagem_agendamento(
    p_id_empresa, p_id_agendamento, 'confirmacao_reenviada', true
  );
  select count(*) into v_depois from public.fila_mensagens
  where id_empresa = p_id_empresa and dados_template->>'agendamento_id' = p_id_agendamento::text;

  if v_depois = v_antes then
    raise exception 'O cliente não possui um canal habilitado para receber a confirmação.';
  end if;
  return jsonb_build_object('queued', v_depois - v_antes, 'status', 'pendente');
end;
$$;

create or replace function public.alterar_agendamento_administracao(
  p_id_empresa bigint,
  p_id_agendamento bigint,
  p_status text,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agendamento public.agendamentos%rowtype;
  v_pagamento public.pagamentos%rowtype;
  v_politica public.politicas_cancelamento%rowtype;
  v_valor_estorno numeric(12,2);
  v_status_estorno text;
  v_fora_prazo boolean;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa, array['dono', 'gerente', 'recepcionista']::public.tipos_usuarios[]
  ) then raise exception 'Você não possui permissão para alterar este agendamento.'; end if;

  select * into v_agendamento from public.agendamentos a
  where a.id_empresa = p_id_empresa and a.id = p_id_agendamento for update;
  if not found then raise exception 'Agendamento não encontrado.'; end if;
  if v_agendamento.status = p_status then
    return jsonb_build_object('id', v_agendamento.id, 'status', v_agendamento.status, 'duplicated', true);
  end if;
  if p_status not in ('confirmado', 'em_atendimento', 'finalizado', 'no_show', 'cancelado') then
    raise exception 'Status administrativo inválido.';
  end if;
  if p_status = 'confirmado' and v_agendamento.sinal_status = 'pendente' then
    raise exception 'O pagamento do sinal ainda está pendente.';
  end if;

  if p_status <> 'cancelado' then
    update public.agendamentos
    set status = p_status,
        confirmacao_origem = case when p_status = 'confirmado' then 'painel_administrativo' else confirmacao_origem end,
        updated_at = now()
    where id_empresa = p_id_empresa and id = p_id_agendamento;

    if p_status in ('finalizado', 'no_show') then
      perform private.cancelar_mensagens_agendamento(p_id_empresa, p_id_agendamento);
      update public.tokens_links_agendamento set revogado_em = now()
      where id_empresa = p_id_empresa and id_agendamento = p_id_agendamento and revogado_em is null;
    end if;
    return jsonb_build_object('id', p_id_agendamento, 'status', p_status, 'duplicated', false);
  end if;

  if v_agendamento.status in ('cancelado', 'finalizado', 'no_show') then
    raise exception 'Este agendamento não pode mais ser cancelado.';
  end if;
  if nullif(btrim(p_motivo), '') is null then raise exception 'Informe o motivo do cancelamento.'; end if;
  if char_length(p_motivo) > 500 then raise exception 'O motivo pode ter no máximo 500 caracteres.'; end if;

  select * into v_politica from public.politicas_cancelamento p
  where p.id_empresa = p_id_empresa and p.ativo
    and current_date between p.vigente_desde and coalesce(p.vigente_ate, 'infinity'::date)
    and (p.id_unidade = v_agendamento.id_unidade or p.id_unidade is null)
  order by (p.id_unidade = v_agendamento.id_unidade) desc, p.vigente_desde desc, p.id desc limit 1;

  update public.agendamentos
  set status = 'cancelado', cancelado_em = coalesce(cancelado_em, now()),
      motivo_cancelamento = btrim(p_motivo), cancelamento_origem = 'painel_administrativo',
      cancelado_por_usuario = auth.uid(), updated_at = now()
  where id_empresa = p_id_empresa and id = p_id_agendamento;

  perform private.cancelar_mensagens_agendamento(p_id_empresa, p_id_agendamento);
  update public.tokens_links_agendamento set revogado_em = now()
  where id_empresa = p_id_empresa and id_agendamento = p_id_agendamento and revogado_em is null;
  update public.pagamentos
  set status = 'cancelado', updated_at = now(),
      observacoes = concat_ws(E'\n', observacoes, 'Cancelado pelo painel antes da confirmação do pagamento.')
  where id_empresa = p_id_empresa and id_agendamento = p_id_agendamento
    and status in ('pendente', 'processando');
  update public.agendamentos set pagamento_status = 'cancelado', updated_at = now()
  where id_empresa = p_id_empresa and id = p_id_agendamento
    and pagamento_status in ('pendente', 'processando', 'falhou');

  select * into v_pagamento from public.pagamentos p
  where p.id_empresa = p_id_empresa and p.id_agendamento = p_id_agendamento and p.status = 'confirmado'
  order by p.id desc limit 1 for update;
  if found and v_agendamento.sinal_status = 'pago' then
    v_fora_prazo := v_agendamento.inicio <= now() + make_interval(
      mins => coalesce(v_politica.antecedencia_cancelamento_minutos, 1440)
    );
    v_valor_estorno := case
      when v_fora_prazo and coalesce(v_politica.reter_sinal_fora_prazo, true) then 0
      else greatest(round(v_pagamento.valor - (
        v_agendamento.valor_total * coalesce(v_politica.multa_cancelamento_percentual, 0) / 100
      ), 2), 0)
    end;
    if v_valor_estorno > 0 then
      v_status_estorno := case
        when v_valor_estorno <> v_pagamento.valor then 'revisao_manual'
        when v_pagamento.provedor = 'mercado_pago' and v_pagamento.identificador_externo is not null then 'pendente'
        else 'revisao_manual'
      end;
      insert into public.solicitacoes_estorno_agendamento (
        id_empresa, id_agendamento, id_pagamento, valor, status, motivo
      ) values (
        p_id_empresa, p_id_agendamento, v_pagamento.id, v_valor_estorno,
        v_status_estorno, 'Estorno solicitado por cancelamento administrativo conforme a política.'
      ) on conflict do nothing;
    end if;
  end if;

  perform private.enfileirar_mensagem_agendamento(p_id_empresa, p_id_agendamento, 'cancelamento', false);
  return jsonb_build_object('id', p_id_agendamento, 'status', 'cancelado', 'duplicated', false);
end;
$$;

create or replace function public.salvar_agendamento_administracao(
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
security invoker
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa, array['dono', 'gerente', 'recepcionista']::public.tipos_usuarios[]
  ) then raise exception 'Você não possui permissão para salvar agendamentos.'; end if;

  v_id := public.salvar_agendamento(
    p_agendamento_id, p_id_empresa, p_id_cliente, p_observacoes,
    p_sinal_status, p_sinal_valor, p_servicos
  );

  if p_agendamento_id is not null then
    update public.fila_mensagens
    set status = 'cancelada', cancelada_em = now(), updated_at = now()
    where id_empresa = p_id_empresa and status in ('pendente', 'erro')
      and dados_template->>'agendamento_id' = v_id::text
      and dados_template->>'tipo' in ('confirmacao_agendamento', 'confirmacao_reenviada', 'reagendamento');
    perform private.enfileirar_mensagem_agendamento(p_id_empresa, v_id, 'reagendamento', true);
    perform private.agendar_lembretes_agendamento(p_id_empresa, v_id);
  end if;
  return v_id;
end;
$$;

revoke all on function public.salvar_configuracao_lembretes_administracao(bigint,boolean,boolean,boolean,integer[],integer) from public;
revoke all on function public.reenviar_confirmacao_agendamento_administracao(bigint,bigint) from public;
revoke all on function public.alterar_agendamento_administracao(bigint,bigint,text,text) from public;
revoke all on function public.salvar_agendamento_administracao(bigint,bigint,bigint,text,text,numeric,jsonb) from public;
grant execute on function public.salvar_configuracao_lembretes_administracao(bigint,boolean,boolean,boolean,integer[],integer) to authenticated;
grant execute on function public.reenviar_confirmacao_agendamento_administracao(bigint,bigint) to authenticated;
grant execute on function public.alterar_agendamento_administracao(bigint,bigint,text,text) to authenticated;
grant execute on function public.salvar_agendamento_administracao(bigint,bigint,bigint,text,text,numeric,jsonb) to authenticated;

comment on table public.configuracoes_lembretes_empresa is
  'Regras globais de lembrete por empresa. A fila é consumida posteriormente pelo n8n/provedor configurado.';
