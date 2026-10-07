-- Templates editaveis e recuperacao segura de entregas interrompidas do n8n.

create or replace function public.salvar_template_mensagem(
  p_id_empresa bigint,
  p_tipo text,
  p_canal text,
  p_assunto text,
  p_conteudo text,
  p_ativo boolean default true
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare v_id bigint;
begin
  if not private.usuario_pode_administrar_empresa(p_id_empresa) then
    raise exception 'Sem permissao para alterar templates desta empresa.';
  end if;
  if p_tipo not in ('confirmacao_agendamento','confirmacao_reenviada','lembrete_agendamento','reagendamento','cancelamento','resposta_reagendamento')
     or p_canal not in ('email','whatsapp') or nullif(btrim(p_conteudo),'') is null then
    raise exception 'Template de mensagem invalido.';
  end if;
  insert into public.templates_mensagens_empresa(id_empresa,tipo,canal,assunto,conteudo,ativo,updated_by)
  values (p_id_empresa,p_tipo,p_canal,nullif(btrim(p_assunto),''),btrim(p_conteudo),p_ativo,auth.uid())
  on conflict (id_empresa,tipo,canal) do update set
    assunto=excluded.assunto, conteudo=excluded.conteudo, ativo=excluded.ativo,
    updated_by=auth.uid(), updated_at=now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function private.enfileirar_mensagem_agendamento(
  p_id_empresa bigint,
  p_id_agendamento bigint,
  p_tipo text,
  p_gerar_link boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agendamento public.agendamentos%rowtype;
  v_cliente public.clientes%rowtype;
  v_preferencias jsonb;
  v_emitido jsonb;
  v_link text;
  v_assunto text;
  v_conteudo text;
  v_chave text;
  v_servico text := 'seu atendimento';
  v_profissional text := 'nossa equipe';
  v_fuso text := 'America/Sao_Paulo';
  v_canal text;
  v_template public.templates_mensagens_empresa%rowtype;
begin
  select * into v_agendamento from public.agendamentos a
  where a.id_empresa=p_id_empresa and a.id=p_id_agendamento;
  if not found then return; end if;
  select * into v_cliente from public.clientes c
  where c.id_empresa=p_id_empresa and c.id=v_agendamento.id_cliente;
  if not found then return; end if;
  select coalesce(e.fuso_horario,'America/Sao_Paulo') into v_fuso
  from public.empresas e where e.id=p_id_empresa;
  select s.nome,f.nome into v_servico,v_profissional
  from public.agendamentos_servicos a
  join public.servicos s on s.id_empresa=a.id_empresa and s.id=a.id_servico
  join public.funcionarios f on f.id_empresa=a.id_empresa and f.id=a.id_funcionario
  where a.id_empresa=p_id_empresa and a.id_agendamento=p_id_agendamento
  order by a.ordem,a.id limit 1;

  v_preferencias:=coalesce(v_agendamento.site_notification_preferences,'{}'::jsonb);
  if p_gerar_link then
    v_emitido:=private.emitir_token_link_agendamento(p_id_empresa,p_id_agendamento,'gerenciar',interval '7 days');
    v_link:='/confirmacao/acessar?token='||(v_emitido->>'token');
  end if;
  v_chave:=p_tipo||':'||p_id_agendamento::text||':'||coalesce(v_emitido->>'token',extract(epoch from clock_timestamp())::bigint::text);

  foreach v_canal in array array['email','whatsapp'] loop
    if (v_canal='email' and (not coalesce((v_preferencias->>'email')::boolean,true) or nullif(btrim(v_cliente.email),'') is null))
       or (v_canal='whatsapp' and (not coalesce((v_preferencias->>'whatsapp')::boolean,true) or nullif(btrim(coalesce(v_cliente.telefone_e164,v_cliente.telefone_principal)),'') is null)) then
      continue;
    end if;
    select * into v_template from public.templates_mensagens_empresa t
    where t.id_empresa=p_id_empresa and t.tipo=p_tipo and t.canal=v_canal and t.ativo;
    v_assunto:=coalesce(v_template.assunto,case p_tipo when 'reagendamento' then 'Seu novo horario foi reservado' when 'cancelamento' then 'Cancelamento do agendamento' else 'Confirme seu agendamento' end);
    v_conteudo:=coalesce(v_template.conteudo,case p_tipo when 'reagendamento' then 'Ola, {nome}. Seu atendimento foi reagendado para {data} as {hora}. Detalhes: {link}' when 'cancelamento' then 'Ola, {nome}. Seu cancelamento foi registrado.' else 'Ola, {nome}. {servico} com {profissional} esta reservado para {data} as {hora}. Responda 1 para confirmar ou 2 para reagendar. {link}' end);
    v_conteudo:=replace(replace(replace(replace(replace(replace(v_conteudo,
      '{nome}',v_cliente.nome),'{servico}',coalesce(v_servico,'seu atendimento')),
      '{profissional}',coalesce(v_profissional,'nossa equipe')),
      '{data}',to_char(v_agendamento.inicio at time zone v_fuso,'DD/MM/YYYY')),
      '{hora}',to_char(v_agendamento.inicio at time zone v_fuso,'HH24:MI')),
      '{link}',coalesce(v_link,''));
    insert into public.fila_mensagens(id_empresa,id_cliente,canal,destinatario,assunto,conteudo,dados_template,status,prioridade,agendada_para,tentativas,max_tentativas,chave_idempotencia)
    values(p_id_empresa,v_cliente.id,v_canal,case when v_canal='email' then lower(btrim(v_cliente.email)) else btrim(coalesce(v_cliente.telefone_e164,v_cliente.telefone_principal)) end,
      v_assunto,v_conteudo,jsonb_build_object('tipo',p_tipo,'agendamento_id',p_id_agendamento,'inicio',v_agendamento.inicio,'link_relativo',v_link,'token_expira_em',v_emitido->>'expires_at'),
      'pendente',100,now(),0,5,v_chave||':'||v_canal)
    on conflict (id_empresa,chave_idempotencia) do nothing;
  end loop;
end;
$$;

create or replace function public.n8n_reservar_mensagens(p_limite integer default 20)
returns table(id bigint,id_empresa bigint,canal text,destinatario text,assunto text,conteudo text,dados_template jsonb,tentativas integer,max_tentativas integer)
language plpgsql security definer set search_path=''
as $$
begin
  return query
  with escolhidas as (
    select m.id from public.fila_mensagens m
    where (
      (m.status in ('pendente','erro') and coalesce(m.proxima_tentativa_em,now())<=now())
      or (m.status='processando' and m.processamento_iniciado_em<now()-interval '10 minutes')
    ) and m.agendada_para<=now() and m.tentativas<m.max_tentativas
    order by m.prioridade desc,m.agendada_para,m.id
    for update skip locked limit least(greatest(coalesce(p_limite,20),1),100)
  ), atualizadas as (
    update public.fila_mensagens m set status='processando',processamento_iniciado_em=now(),tentativas=tentativas+1,ultimo_erro=null,updated_at=now()
    from escolhidas e where m.id=e.id returning m.*
  )
  select a.id,a.id_empresa,a.canal,a.destinatario,a.assunto,a.conteudo,a.dados_template,a.tentativas,a.max_tentativas
  from atualizadas a order by a.prioridade desc,a.agendada_para,a.id;
end;
$$;

revoke all on function public.salvar_template_mensagem(bigint,text,text,text,text,boolean) from public;
grant execute on function public.salvar_template_mensagem(bigint,text,text,text,text,boolean) to authenticated;
revoke all on function public.n8n_reservar_mensagens(integer) from public;
grant execute on function public.n8n_reservar_mensagens(integer) to service_role;

comment on function public.salvar_template_mensagem(bigint,text,text,text,text,boolean) is 'Salva templates por empresa com auditoria e isolamento multiempresa.';
comment on function public.n8n_reservar_mensagens(integer) is 'Reserva entregas atomicamente e recupera workers interrompidos depois de dez minutos.';
