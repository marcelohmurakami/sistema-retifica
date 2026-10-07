-- Uma tentativa que chegou ao ponto de chamar a Evolution pode ter sido aceita
-- mesmo quando o n8n recebeu timeout. Ela exige reconciliacao antes de reenvio.
alter table public.fila_mensagens
  add column if not exists envio_iniciado_em timestamptz;

comment on column public.fila_mensagens.envio_iniciado_em is
  'Marco duravel antes de chamar a Evolution. Mensagens WhatsApp marcadas nao sao reenviadas automaticamente.';

-- Linhas anteriores a esta migration podem ter sido enviadas pelo worker antigo.
update public.fila_mensagens m
set envio_iniciado_em=coalesce(m.processamento_iniciado_em,m.updated_at,now()),
    proxima_tentativa_em=null,
    ultimo_erro=case when m.status='erro'
      then left('Entrega anterior incerta; conferir na Evolution antes de reenviar. '||coalesce(m.ultimo_erro,''),1000)
      else m.ultimo_erro end
where m.canal='whatsapp' and m.status in ('processando','erro')
  and m.envio_iniciado_em is null;

create or replace function public.n8n_iniciar_envio_whatsapp(
  p_id_mensagem bigint,p_tentativa integer,p_instancia_evolution text,p_modo text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_mensagem public.fila_mensagens%rowtype;
begin
  select * into v_mensagem from public.fila_mensagens m
  where m.id=p_id_mensagem for update;
  if not found or v_mensagem.canal<>'whatsapp'
     or v_mensagem.status<>'processando'
     or v_mensagem.tentativas<>p_tentativa
     or v_mensagem.envio_iniciado_em is not null
     or v_mensagem.processamento_iniciado_em is null
     or v_mensagem.processamento_iniciado_em<now()-interval '10 minutes'
     or not exists (
       select 1 from public.configuracoes_automacao_whatsapp w
       where w.id_empresa=v_mensagem.id_empresa and w.ativo
         and w.instancia_evolution=p_instancia_evolution and w.modo=p_modo
     ) then
    return jsonb_build_object('authorized',false);
  end if;
  update public.fila_mensagens
  set envio_iniciado_em=now(),updated_at=now()
  where id=p_id_mensagem;
  return jsonb_build_object('authorized',true,'id',p_id_mensagem,'tentativa',p_tentativa);
end;
$$;

revoke all on function public.n8n_iniciar_envio_whatsapp(bigint,integer,text,text) from public;
grant execute on function public.n8n_iniciar_envio_whatsapp(bigint,integer,text,text) to service_role;

-- Mantem o contrato RPC existente e a recuperacao automatica dos outros
-- canais. WhatsApp so pode ser retomado se nenhum envio foi iniciado.
create or replace function public.n8n_reservar_mensagens(
  p_limite integer,p_canal text,p_id_empresa bigint,p_instancia_evolution text
)
returns table(
  id bigint,id_empresa bigint,canal text,destinatario text,assunto text,
  conteudo text,dados_template jsonb,tentativas integer,max_tentativas integer
)
language plpgsql security definer set search_path='' as $$
declare v_empresa record;
begin
  for v_empresa in
    select w.id_empresa from public.configuracoes_automacao_whatsapp w
    where w.ativo and (p_id_empresa is null or w.id_empresa=p_id_empresa)
    order by w.id_empresa
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('whatsapp-rate:'||v_empresa.id_empresa::text,0)
    );
  end loop;
  update public.fila_mensagens m set status='cancelada',cancelada_em=coalesce(m.cancelada_em,now()),
    processamento_iniciado_em=null,ultimo_erro='Consentimento de marketing ausente ou revogado.',
    updated_at=now()
  where m.canal in ('whatsapp','email') and m.status in ('pendente','erro','processando')
    and (p_id_empresa is null or m.id_empresa=p_id_empresa)
    and coalesce(m.dados_template->>'tipo','') in ('campanha_marketing','automacao_marketing')
    and not private.cliente_autorizou_comunicacao(m.id_empresa,m.id_cliente,m.canal,'marketing');

  update public.campanhas_reativacao_destinatarios d set status='bloqueado',updated_at=now()
  from public.fila_mensagens m
  where m.id=d.id_mensagem and m.status='cancelada'
    and (p_id_empresa is null or m.id_empresa=p_id_empresa)
    and m.ultimo_erro='Consentimento de marketing ausente ou revogado.'
    and d.status in ('pendente','processando','erro');

  return query
  with candidatas as (
    select m.id,m.id_empresa,m.canal,
      case when m.canal='whatsapp' then greatest(w.limite_por_minuto-coalesce((
        select count(*)::integer from public.fila_mensagens recent
        where recent.id_empresa=m.id_empresa and recent.canal='whatsapp'
          and (recent.processamento_iniciado_em>=now()-interval '1 minute'
            or recent.enviada_em>=now()-interval '1 minute')
      ),0),0) else least(greatest(coalesce(p_limite,20),1),100) end disponiveis,
      row_number() over (partition by m.id_empresa,m.canal
        order by m.prioridade desc,m.agendada_para,m.id) posicao
    from public.fila_mensagens m
    left join public.configuracoes_automacao_whatsapp w on w.id_empresa=m.id_empresa
    where (
      (m.status in ('pendente','erro') and coalesce(m.proxima_tentativa_em,now())<=now())
      or (m.status='processando' and m.processamento_iniciado_em<now()-interval '10 minutes')
    )
      and (m.canal<>'whatsapp' or m.envio_iniciado_em is null)
      and m.agendada_para<=now() and m.tentativas<m.max_tentativas
      and (p_canal is null or m.canal=p_canal)
      and (p_id_empresa is null or m.id_empresa=p_id_empresa)
      and (m.canal<>'whatsapp' or (
        w.ativo and nullif(btrim(w.instancia_evolution),'') is not null
        and (p_instancia_evolution is null or w.instancia_evolution=p_instancia_evolution)
        and (w.modo<>'sandbox' or nullif(btrim(w.telefone_teste),'') is not null)
        and (now() at time zone coalesce((select e.fuso_horario from public.empresas e
          where e.id=m.id_empresa),'America/Sao_Paulo'))::time>=w.janela_inicio
        and (now() at time zone coalesce((select e.fuso_horario from public.empresas e
          where e.id=m.id_empresa),'America/Sao_Paulo'))::time<w.janela_fim
        and case coalesce(m.dados_template->>'tipo','')
          when 'campanha_marketing' then w.campanhas_ativas
          when 'automacao_marketing' then w.automacoes_ativas
          when 'avaliacao_pos_atendimento' then w.avaliacoes_ativas
          else true end
      ))
  ), escolhidas as (
    select m.id from public.fila_mensagens m
    join candidatas c on c.id=m.id
    where c.posicao<=c.disponiveis
    order by m.prioridade desc,m.agendada_para,m.id
    for update of m skip locked
    limit least(greatest(coalesce(p_limite,20),1),100)
  ), atualizadas as (
    update public.fila_mensagens m set status='processando',processamento_iniciado_em=now(),
      tentativas=m.tentativas+1,ultimo_erro=null,updated_at=now()
    from escolhidas e where m.id=e.id returning m.*
  )
  select a.id,a.id_empresa,a.canal,
    case when a.canal='whatsapp' and w.modo='sandbox' then w.telefone_teste else a.destinatario end,
    a.assunto,a.conteudo,
    coalesce(a.dados_template,'{}'::jsonb)||case when a.canal='whatsapp' then
      jsonb_build_object('instancia_evolution',w.instancia_evolution,'modo',w.modo)
      else '{}'::jsonb end,
    a.tentativas,a.max_tentativas
  from atualizadas a
  left join public.configuracoes_automacao_whatsapp w on w.id_empresa=a.id_empresa
  order by a.prioridade desc,a.agendada_para,a.id;
end;
$$;

create or replace function public.n8n_reservar_mensagens(p_limite integer,p_canal text)
returns table(
  id bigint,id_empresa bigint,canal text,destinatario text,assunto text,
  conteudo text,dados_template jsonb,tentativas integer,max_tentativas integer
)
language sql security definer set search_path='' as $$
  select * from public.n8n_reservar_mensagens(
    p_limite,p_canal,null::bigint,null::text
  );
$$;

create or replace function public.n8n_reservar_mensagens_whatsapp(
  p_limite integer,p_id_empresa bigint,p_instancia_evolution text
)
returns table(
  id bigint,id_empresa bigint,canal text,destinatario text,assunto text,
  conteudo text,dados_template jsonb,tentativas integer,max_tentativas integer
)
language plpgsql security definer set search_path='' as $$
begin
  if p_id_empresa is null or p_id_empresa<=0
     or nullif(btrim(p_instancia_evolution),'') is null then
    raise exception 'Empresa e instancia WhatsApp obrigatorias.';
  end if;
  if not exists (
    select 1 from public.configuracoes_automacao_whatsapp w
    where w.id_empresa=p_id_empresa and w.ativo
      and w.instancia_evolution=p_instancia_evolution
  ) then
    raise exception 'Instancia WhatsApp nao ativa para a empresa.';
  end if;
  return query select * from public.n8n_reservar_mensagens(
    p_limite,'whatsapp',p_id_empresa,p_instancia_evolution
  );
end;
$$;

revoke all on function public.n8n_reservar_mensagens(integer,text,bigint,text) from public;
revoke all on function public.n8n_reservar_mensagens_whatsapp(integer,bigint,text) from public;
grant execute on function public.n8n_reservar_mensagens(integer,text,bigint,text) to service_role;
grant execute on function public.n8n_reservar_mensagens_whatsapp(integer,bigint,text) to service_role;

-- O resultado de timeout pode ser "erro" para auditoria, mas nunca agenda
-- nova tentativa quando a chamada a Evolution ja pode ter ocorrido.
create or replace function public.n8n_registrar_resultado_mensagem(
  p_id_mensagem bigint,p_status text,p_identificador_externo text default null,p_erro text default null
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_mensagem public.fila_mensagens%rowtype; v_dest_id bigint;
begin
  select * into v_mensagem from public.fila_mensagens m where m.id=p_id_mensagem for update;
  if not found then raise exception 'Mensagem nao encontrada.'; end if;
  if p_status not in ('enviada','entregue','lida','erro') then raise exception 'Status invalido.'; end if;
  if (v_mensagem.status='lida' and p_status<>'lida')
     or (v_mensagem.status='entregue' and p_status in ('enviada','erro')) then
    return jsonb_build_object('id',v_mensagem.id,'status',v_mensagem.status,'duplicated',true);
  end if;
  update public.fila_mensagens set status=p_status,
    identificador_externo=coalesce(nullif(btrim(p_identificador_externo),''),identificador_externo),
    enviada_em=case when p_status in ('enviada','entregue','lida') then coalesce(enviada_em,now()) else enviada_em end,
    entregue_em=case when p_status in ('entregue','lida') then coalesce(entregue_em,now()) else entregue_em end,
    lida_em=case when p_status='lida' then coalesce(lida_em,now()) else lida_em end,
    ultimo_erro=case when p_status='erro' then left(coalesce(p_erro,'Erro nao informado.'),1000) else null end,
    proxima_tentativa_em=case when p_status='erro' and tentativas<max_tentativas
      and (v_mensagem.canal<>'whatsapp' or v_mensagem.envio_iniciado_em is null)
      then now()+make_interval(mins=>least(60,power(2,greatest(tentativas,1))::integer)) else null end,
    processamento_iniciado_em=null,updated_at=now() where id=p_id_mensagem;

  v_dest_id:=nullif(v_mensagem.dados_template->>'campanha_destinatario_id','')::bigint;
  if v_dest_id is not null then
    update public.campanhas_reativacao_destinatarios set
      status=case p_status when 'enviada' then 'enviado' when 'entregue' then 'entregue'
        when 'lida' then 'lido' else 'erro' end,
      enviado_em=case when p_status in ('enviada','entregue','lida') then coalesce(enviado_em,now()) else enviado_em end,
      entregue_em=case when p_status in ('entregue','lida') then coalesce(entregue_em,now()) else entregue_em end,
      lido_em=case when p_status='lida' then coalesce(lido_em,now()) else lido_em end,
      tentativas=v_mensagem.tentativas,
      ultimo_erro=case when p_status='erro' then left(coalesce(p_erro,'Erro nao informado.'),1000) else null end,
      updated_at=now()
    where id_empresa=v_mensagem.id_empresa and id=v_dest_id;
  end if;
  update public.execucoes_automacao_marketing set
    status=case p_status when 'enviada' then 'enviada' when 'entregue' then 'enviada'
      when 'lida' then 'enviada' else 'erro' end,updated_at=now()
  where id_mensagem=p_id_mensagem;
  return jsonb_build_object('id',p_id_mensagem,'status',p_status,'duplicated',false);
end;
$$;
