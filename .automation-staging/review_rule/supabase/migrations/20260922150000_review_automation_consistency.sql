-- Avaliações têm fluxo dedicado. Regras genéricas do tipo antigo nunca eram
-- processadas; preservamos o histórico, mas impedimos que pareçam ativas.
update public.regras_automacao_marketing
set ativo=false, updated_at=now()
where tipo='avaliacao_pos_atendimento' and ativo;

-- Antes desta versão a antecedência de aniversário era ignorada. Valores
-- antigos acima de um mês mantêm o comportamento de enviar no próprio dia.
update public.regras_automacao_marketing
set dias_apos=0, updated_at=now()
where tipo='aniversario' and dias_apos>31;

create or replace function public.salvar_regra_automacao_marketing(
  p_id_empresa bigint,p_id bigint,p_nome text,p_tipo text,p_id_servico bigint,
  p_dias_apos integer,p_horario_local time,p_mensagem text,p_filtros jsonb,p_ativo boolean
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id bigint; v_config public.configuracoes_automacao_whatsapp%rowtype;
begin
  if not public.marketing_autorizar_gestor(p_id_empresa) then
    raise exception 'Sem permissao para alterar automacoes desta empresa.';
  end if;
  if p_tipo='avaliacao_pos_atendimento' then
    raise exception 'Avaliacoes sao controladas pela integracao dedicada; configure-as na aba Avaliacoes.';
  end if;
  if p_tipo not in ('retorno_servico','reativacao','aniversario') then
    raise exception 'Tipo de automacao invalido.';
  end if;
  if nullif(btrim(p_nome),'') is null or char_length(btrim(p_nome))>120
     or nullif(btrim(p_mensagem),'') is null or char_length(btrim(p_mensagem))>2000 then
    raise exception 'Nome ou mensagem invalido.';
  end if;
  if coalesce(p_dias_apos,-1) not between 0 and 730 then raise exception 'Prazo invalido.'; end if;
  if p_tipo='aniversario' and p_dias_apos>31 then
    raise exception 'A antecedencia de aniversario deve ser de no maximo 31 dias.';
  end if;
  if jsonb_typeof(coalesce(p_filtros,'{}'::jsonb))<>'object' then raise exception 'Filtros invalidos.'; end if;
  if p_ativo then
    select * into v_config from public.configuracoes_automacao_whatsapp w
    where w.id_empresa=p_id_empresa and w.ativo and w.automacoes_ativas;
    if not found then raise exception 'Ative e valide o WhatsApp antes de ligar uma automacao.'; end if;
  end if;
  if p_id is null then
    insert into public.regras_automacao_marketing(
      id_empresa,nome,tipo,id_servico,dias_apos,horario_local,mensagem,filtros,ativo,criado_por
    ) values (
      p_id_empresa,btrim(p_nome),p_tipo,p_id_servico,p_dias_apos,
      coalesce(p_horario_local,'10:00'),btrim(p_mensagem),coalesce(p_filtros,'{}'::jsonb),
      p_ativo,auth.uid()
    ) returning id into v_id;
  else
    update public.regras_automacao_marketing set nome=btrim(p_nome),tipo=p_tipo,
      id_servico=p_id_servico,dias_apos=p_dias_apos,
      horario_local=coalesce(p_horario_local,'10:00'),mensagem=btrim(p_mensagem),
      filtros=coalesce(p_filtros,'{}'::jsonb),ativo=p_ativo
    where id_empresa=p_id_empresa and id=p_id returning id into v_id;
    if v_id is null then raise exception 'Automacao nao encontrada.'; end if;
  end if;
  return jsonb_build_object('id',v_id,'ativo',p_ativo);
end;
$$;

-- O editor anuncia estas variáveis. Só enfileiramos textos com link de
-- agendamento quando há site público publicado e URL HTTPS configurada.
create or replace function public.n8n_processar_automacoes_marketing(p_limite integer default 100)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v record; v_exec_id bigint; v_msg_id bigint; v_total integer:=0;
  v_chave text; v_destino text; v_conteudo text;
begin
  for v in
    with candidatas as (
      select r.id id_regra,r.id_empresa,r.tipo,r.id_servico,r.dias_apos,
        r.mensagem,c.id id_cliente,c.nome,
        regexp_replace(coalesce(c.telefone_e164,c.telefone_principal,''),'[^0-9]','','g') telefone,
        s.nome servico,e.fantasia empresa,w.instancia_evolution,w.modo,w.telefone_teste,
        case when sp.slug is not null and nullif(btrim(w.site_base_url),'') is not null
          then w.site_base_url||'/agendar?empresa='||sp.slug else null end link_agendamento,
        (now() at time zone coalesce(e.fuso_horario,'America/Sao_Paulo'))::date hoje,
        case
          when r.tipo='aniversario' then (now() at time zone coalesce(e.fuso_horario,'America/Sao_Paulo'))::date
          when r.tipo='reativacao' then ultima.ultima_data+r.dias_apos
          when r.tipo='retorno_servico' then ultimo_servico.ultima_data+r.dias_apos
        end data_referencia,
        ultima.ultima_data ultima_geral,ultimo_servico.ultima_data ultima_servico
      from public.regras_automacao_marketing r
      join public.configuracoes_automacao_whatsapp w
        on w.id_empresa=r.id_empresa and w.ativo and w.automacoes_ativas
      join public.empresas e on e.id=r.id_empresa
      join public.clientes c on c.id_empresa=r.id_empresa and c.ativo
      left join public.servicos s on s.id_empresa=r.id_empresa and s.id=r.id_servico
      left join public.sites_publicos sp on sp.id_empresa=r.id_empresa and sp.publicado
      left join lateral (
        select max((a.inicio at time zone coalesce(e.fuso_horario,'America/Sao_Paulo'))::date) ultima_data
        from public.agendamentos a
        where a.id_empresa=r.id_empresa and a.id_cliente=c.id and a.status='finalizado'
      ) ultima on true
      left join lateral (
        select max((a.inicio at time zone coalesce(e.fuso_horario,'America/Sao_Paulo'))::date) ultima_data
        from public.agendamentos a
        join public.agendamentos_servicos ags on ags.id_empresa=a.id_empresa
          and ags.id_agendamento=a.id and ags.id_servico=r.id_servico and ags.status<>'cancelado'
        where a.id_empresa=r.id_empresa and a.id_cliente=c.id and a.status='finalizado'
      ) ultimo_servico on true
      where r.ativo and r.tipo in ('aniversario','reativacao','retorno_servico')
        and (now() at time zone coalesce(e.fuso_horario,'America/Sao_Paulo'))::time>=r.horario_local
        and private.cliente_autorizou_comunicacao(r.id_empresa,c.id,'whatsapp','marketing')
    )
    select q.* from candidatas q
    where case q.tipo
      when 'aniversario' then exists(select 1 from public.clientes cx
        where cx.id_empresa=q.id_empresa and cx.id=q.id_cliente and cx.data_nascimento is not null
          and extract(month from cx.data_nascimento)=extract(month from (q.hoje+q.dias_apos))
          and extract(day from cx.data_nascimento)=extract(day from (q.hoje+q.dias_apos)))
      when 'reativacao' then q.ultima_geral is not null and q.ultima_geral+q.dias_apos<=q.hoje
      when 'retorno_servico' then q.ultima_servico is not null and q.ultima_servico+q.dias_apos<=q.hoje
      else false end
      and (position('{link_agendamento}' in q.mensagem)=0 or q.link_agendamento is not null)
      and not exists(select 1 from public.execucoes_automacao_marketing anterior
        where anterior.id_regra=q.id_regra and anterior.id_cliente=q.id_cliente
          and anterior.data_referencia=q.data_referencia)
      and not exists(
        select 1 from public.agendamentos futuro
        where futuro.id_empresa=q.id_empresa and futuro.id_cliente=q.id_cliente
          and futuro.inicio>now() and futuro.status in ('aguardando_confirmacao','aguardando_pagamento','confirmado')
          and (q.tipo<>'retorno_servico' or exists(
            select 1 from public.agendamentos_servicos fs
            where fs.id_empresa=futuro.id_empresa and fs.id_agendamento=futuro.id
              and fs.id_servico=q.id_servico and fs.status<>'cancelado'
          ))
      )
    order by q.id_empresa,q.id_regra,q.id_cliente
    limit least(greatest(coalesce(p_limite,100),1),500)
  loop
    -- Sem URL funcional, o filtro acima não consome a idempotência; a regra
    -- voltará a ser candidata quando o site for publicado.
    v_exec_id:=null;
    v_msg_id:=null;
    insert into public.execucoes_automacao_marketing(
      id_empresa,id_regra,id_cliente,data_referencia,status
    ) values (v.id_empresa,v.id_regra,v.id_cliente,v.data_referencia,'pendente')
    on conflict (id_regra,id_cliente,data_referencia) do nothing returning id into v_exec_id;
    if v_exec_id is null then continue; end if;
    v_chave:='automacao:'||v.id_regra||':cliente:'||v.id_cliente||':data:'||v.data_referencia;
    v_destino:=case when v.modo='sandbox' then v.telefone_teste else v.telefone end;
    v_conteudo:=replace(replace(replace(replace(v.mensagem,
      '{nome}',v.nome),'{servico}',coalesce(v.servico,'seu atendimento')),
      '{empresa}',coalesce(v.empresa,'')),
      '{link_agendamento}',coalesce(v.link_agendamento,''));
    insert into public.fila_mensagens(
      id_empresa,id_cliente,canal,destinatario,assunto,conteudo,dados_template,
      status,prioridade,agendada_para,tentativas,max_tentativas,chave_idempotencia
    ) values (
      v.id_empresa,v.id_cliente,'whatsapp',v_destino,'Mensagem automatica',v_conteudo,
      jsonb_build_object('tipo','automacao_marketing','execucao_id',v_exec_id,
        'regra_id',v.id_regra,'instancia_evolution',v.instancia_evolution,'modo',v.modo),
      'pendente',20,now(),0,3,v_chave
    ) on conflict (id_empresa,chave_idempotencia) do update set updated_at=now()
    returning id into v_msg_id;
    update public.execucoes_automacao_marketing set id_mensagem=v_msg_id,
      status='enfileirada',updated_at=now() where id=v_exec_id;
    update public.regras_automacao_marketing set ultima_execucao_em=now(),updated_at=now()
    where id_empresa=v.id_empresa and id=v.id_regra;
    v_total:=v_total+1;
  end loop;
  return jsonb_build_object('enfileiradas',v_total);
end;
$$;

-- A restrição da tabela já exige URL ao ativar avaliações; esta verificação
-- adicional protege a RPC caso dados legados ou uma migração futura a alterem.
create or replace function public.n8n_criar_solicitacao_avaliacao(
  p_id_empresa bigint,p_id_agendamento bigint
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_a public.agendamentos%rowtype; v_c public.clientes%rowtype;
  v_config public.configuracoes_automacao_whatsapp%rowtype;
  v_id bigint; v_msg_id bigint; v_token text; v_destino text; v_chave text;
begin
  select * into v_config from public.configuracoes_automacao_whatsapp w
  where w.id_empresa=p_id_empresa and w.ativo and w.avaliacoes_ativas;
  if not found then raise exception 'Avaliacao automatica desativada.'; end if;
  if nullif(btrim(v_config.site_base_url),'') is null then
    raise exception 'Configure a URL HTTPS do site antes de enviar avaliacoes.';
  end if;
  select * into v_a from public.agendamentos a
  where a.id_empresa=p_id_empresa and a.id=p_id_agendamento and a.status='finalizado';
  if not found then raise exception 'Atendimento finalizado nao encontrado.'; end if;
  if not private.cliente_autorizou_comunicacao(p_id_empresa,v_a.id_cliente,'whatsapp','lembrete') then
    raise exception 'Cliente sem consentimento valido para a mensagem de pos-atendimento.';
  end if;
  if exists(select 1 from public.solicitacoes_avaliacao s
    where s.id_empresa=p_id_empresa and s.id_agendamento=p_id_agendamento) then
    return jsonb_build_object('created',false,'reason','already_exists');
  end if;
  select * into v_c from public.clientes c
  where c.id_empresa=p_id_empresa and c.id=v_a.id_cliente;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.solicitacoes_avaliacao(
    id_empresa,id_agendamento,id_cliente,token_hash,expira_em
  ) values (
    p_id_empresa,v_a.id,v_c.id,encode(extensions.digest(v_token,'sha256'),'hex'),now()+interval '14 days'
  ) returning id into v_id;
  v_destino:=case when v_config.modo='sandbox' then v_config.telefone_teste else
    regexp_replace(coalesce(v_c.telefone_e164,v_c.telefone_principal,''),'[^0-9]','','g') end;
  v_chave:='avaliacao:'||p_id_empresa||':'||v_a.id;
  insert into public.fila_mensagens(
    id_empresa,id_cliente,canal,destinatario,assunto,conteudo,dados_template,
    status,prioridade,agendada_para,tentativas,max_tentativas,chave_idempotencia
  ) values (
    p_id_empresa,v_c.id,'whatsapp',v_destino,'Como foi sua experiencia?',
    'Ola, '||v_c.nome||'! Como foi sua experiencia? Avalie de 1 a 5: '||v_config.site_base_url||'/avaliar?token='||v_token,
    jsonb_build_object('tipo','avaliacao_pos_atendimento','solicitacao_id',v_id,
      'agendamento_id',v_a.id,'instancia_evolution',v_config.instancia_evolution,
      'modo',v_config.modo),
    'pendente',40,now(),0,3,v_chave
  ) on conflict (id_empresa,chave_idempotencia) do update set updated_at=now()
  returning id into v_msg_id;
  return jsonb_build_object('created',true,'id',v_id,'id_mensagem',v_msg_id);
end;
$$;
