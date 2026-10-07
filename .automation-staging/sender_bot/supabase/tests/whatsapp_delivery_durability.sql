-- Verifica a trava contra reenvio apos chamada possivel a Evolution.
-- Executar em ambiente de teste; a transacao inteira e revertida.
begin;
set local role postgres;
set local search_path=extensions,public,pg_catalog;

do $$
declare
  v_empresa bigint;
  v_id bigint;
  v_pendente bigint;
  v_marcacao jsonb;
  v_resultado jsonb;
  v_bloqueou boolean;
begin
  if to_regprocedure('public.n8n_iniciar_envio_whatsapp(bigint,integer,text,text)') is null
     or to_regprocedure('public.n8n_reservar_mensagens_whatsapp(integer,bigint,text)') is null
     or not has_function_privilege('service_role',
       'public.n8n_iniciar_envio_whatsapp(bigint,integer,text,text)','EXECUTE')
     or not has_function_privilege('service_role',
       'public.n8n_reservar_mensagens_whatsapp(integer,bigint,text)','EXECUTE')
     or has_function_privilege('authenticated',
       'public.n8n_iniciar_envio_whatsapp(bigint,integer,text,text)','EXECUTE')
     or has_function_privilege('authenticated',
       'public.n8n_reservar_mensagens_whatsapp(integer,bigint,text)','EXECUTE') then
    raise exception 'TESTE WHATSAPP: permissao do marco de envio incorreta.';
  end if;

  select e.id into v_empresa from public.empresas e order by e.id limit 1;
  if v_empresa is null then
    raise exception 'TESTE WHATSAPP: empresa de teste ausente.';
  end if;
  insert into public.configuracoes_automacao_whatsapp(
    id_empresa,ativo,modo,instancia_evolution,telefone_teste,limite_por_minuto
  ) values (v_empresa,true,'sandbox','estudos-whatsapp','5511999999999',60)
  on conflict (id_empresa) do update set
    ativo=true,modo='sandbox',instancia_evolution='estudos-whatsapp',
    telefone_teste='5511999999999',limite_por_minuto=60;

  insert into public.fila_mensagens(
    id_empresa,id_cliente,canal,destinatario,assunto,conteudo,dados_template,
    status,prioridade,agendada_para,tentativas,max_tentativas,chave_idempotencia
  ) values (
    v_empresa,null,'whatsapp','5511999999999','Teste de escopo',
    'Mensagem que permanece pendente ao reservar outra instancia.',
    '{"tipo":"chatbot_resposta"}'::jsonb,
    'pendente',100,now()-interval '1 minute',0,3,
    'teste-escopo-'||gen_random_uuid()::text
  ) returning id into v_pendente;
  v_bloqueou:=false;
  begin
    perform * from public.n8n_reservar_mensagens_whatsapp(
      100,v_empresa,'outra-instancia');
  exception when others then
    if SQLERRM not like 'Instancia WhatsApp nao ativa%' then raise; end if;
    v_bloqueou:=true;
  end;
  if not v_bloqueou or not exists (
    select 1 from public.fila_mensagens m
    where m.id=v_pendente and m.status='pendente'
  ) then
    raise exception 'TESTE WHATSAPP: reserva cruzou instancia.';
  end if;
  v_bloqueou:=false;
  begin
    perform * from public.n8n_reservar_mensagens_whatsapp(
      100,v_empresa+1000000000,'estudos-whatsapp');
  exception when others then
    if SQLERRM not like 'Instancia WhatsApp nao ativa%' then raise; end if;
    v_bloqueou:=true;
  end;
  if not v_bloqueou or not exists (
    select 1 from public.fila_mensagens m
    where m.id=v_pendente and m.status='pendente'
  ) then
    raise exception 'TESTE WHATSAPP: reserva cruzou empresa.';
  end if;

  insert into public.fila_mensagens(
    id_empresa,id_cliente,canal,destinatario,assunto,conteudo,dados_template,
    status,prioridade,agendada_para,tentativas,max_tentativas,chave_idempotencia,
    processamento_iniciado_em
  ) values (
    v_empresa,null,'whatsapp','5511999999999','Teste',
    'Resposta de teste que jamais sera enviada pela suite.',
    '{"tipo":"chatbot_resposta"}'::jsonb,
    'processando',100,now()-interval '1 minute',1,3,
    'teste-envio-'||gen_random_uuid()::text,now()
  ) returning id into v_id;

  v_marcacao:=public.n8n_iniciar_envio_whatsapp(
    v_id,0,'estudos-whatsapp','sandbox');
  if v_marcacao->>'authorized'<>'false' then
    raise exception 'TESTE WHATSAPP: tentativa antiga autorizada.';
  end if;
  v_marcacao:=public.n8n_iniciar_envio_whatsapp(
    v_id,1,'estudos-whatsapp','sandbox');
  if v_marcacao->>'authorized'<>'true' then
    raise exception 'TESTE WHATSAPP: tentativa atual recusada.';
  end if;
  v_marcacao:=public.n8n_iniciar_envio_whatsapp(
    v_id,1,'estudos-whatsapp','sandbox');
  if v_marcacao->>'authorized'<>'false' then
    raise exception 'TESTE WHATSAPP: mesma tentativa autorizada duas vezes.';
  end if;

  v_resultado:=public.n8n_registrar_resultado_mensagem(
    v_id,'erro',null,'Timeout ambiguo de teste.');
  if v_resultado->>'status'<>'erro'
     or not exists (
       select 1 from public.fila_mensagens m
       where m.id=v_id and m.envio_iniciado_em is not null
         and m.proxima_tentativa_em is null
     ) then
    raise exception 'TESTE WHATSAPP: erro ambiguo agendou reenvio.';
  end if;
  update public.fila_mensagens
  set processamento_iniciado_em=now()-interval '11 minutes'
  where id=v_id;
  if exists (
    select 1 from public.n8n_reservar_mensagens_whatsapp(
      100,v_empresa,'estudos-whatsapp') m
    where m.id=v_id
  ) then
    raise exception 'TESTE WHATSAPP: envio incerto foi reservado novamente.';
  end if;
  perform public.n8n_registrar_resultado_mensagem(
    v_id,'entregue','recibo-teste-'||v_id::text,null);
  if not exists (
    select 1 from public.fila_mensagens m
    where m.id=v_id and m.status='entregue'
      and m.identificador_externo='recibo-teste-'||v_id::text
  ) then
    raise exception 'TESTE WHATSAPP: recibo posterior nao reconciliou.';
  end if;
end;
$$;

rollback;
