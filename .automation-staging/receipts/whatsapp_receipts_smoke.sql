-- Executar manualmente no SQL Editor como postgres depois das migrations
-- 20260922130000 e 20260922140000. Nao envia WhatsApp e nao persiste dados.
begin;
set local role postgres;
set local search_path = pg_catalog, public;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  v_key_id text := 'smoke-key-' || pg_catalog.pg_backend_pid()::text || '-'
    || pg_catalog.txid_current()::text;
  v_message_id text := 'smoke-db-' || pg_catalog.pg_backend_pid()::text || '-'
    || pg_catalog.txid_current()::text;
  v_queue_id bigint;
  v_result jsonb;
  v_row public.fila_mensagens%rowtype;
  v_pending integer;
  v_processed integer;
  v_total integer;
begin
  if to_regprocedure('public.n8n_registrar_recibo_whatsapp(bigint,text,text,text,jsonb,boolean)') is null
     or to_regprocedure('public.n8n_registrar_resultado_mensagem(bigint,text,text,text)') is null then
    raise exception 'TESTE RECIBOS: migrations de entrega/recibos ausentes.';
  end if;
  if not exists (select 1 from public.empresas where id = 10) then
    raise exception 'TESTE RECIBOS: empresa ficticia 10 ausente.';
  end if;

  -- A configuracao fica visivel apenas nesta transacao e volta ao valor anterior.
  insert into public.configuracoes_automacao_whatsapp (
    id_empresa, ativo, modo, instancia_evolution, telefone_teste, avaliacoes_ativas
  ) values (10, true, 'sandbox', 'estudos-whatsapp', '5511999999999', false)
  on conflict (id_empresa) do update set
    ativo = true, modo = 'sandbox', instancia_evolution = 'estudos-whatsapp',
    telefone_teste = '5511999999999', avaliacoes_ativas = false;

  insert into public.fila_mensagens (
    id_empresa, canal, destinatario, conteudo, dados_template, status,
    tentativas, max_tentativas
  ) values (
    10, 'whatsapp', '5511999999999', 'Mensagem ficticia para teste de recibo.',
    '{"tipo":"smoke_receipt"}'::jsonb, 'processando', 1, 1
  ) returning id into v_queue_id;

  -- O ID externo e keyId; messageId representa um ID interno da Evolution.
  v_result := public.n8n_registrar_recibo_whatsapp(
    10, 'estudos-whatsapp', v_key_id, 'entregue',
    jsonb_build_object('keyId', v_key_id, 'messageId', v_message_id,
      'status', 'DELIVERY_ACK', 'source', 'smoke'), true
  );
  if v_result->>'accepted' is distinct from 'true'
     or v_result->>'pending' is distinct from 'true'
     or v_result->>'applied' is distinct from 'false' then
    raise exception 'TESTE RECIBOS: primeiro recibo nao ficou pendente: %', v_result;
  end if;

  v_result := public.n8n_registrar_recibo_whatsapp(
    10, 'estudos-whatsapp', v_key_id, 'lida',
    jsonb_build_object('keyId', v_key_id, 'messageId', v_message_id,
      'status', 'READ', 'source', 'smoke'), true
  );
  if v_result->>'pending' is distinct from 'true' then
    raise exception 'TESTE RECIBOS: leitura antecipada nao ficou pendente: %', v_result;
  end if;

  select * into v_row from public.fila_mensagens where id = v_queue_id;
  if v_row.identificador_externo is not null
     or v_row.status is distinct from 'processando' then
    raise exception 'TESTE RECIBOS: fila mudou antes de registrar keyId.';
  end if;
  select count(*) into v_pending from public.eventos_webhook_whatsapp e
  where e.id_empresa = 10 and e.instancia_evolution = 'estudos-whatsapp'
    and e.identificador_externo = v_key_id and e.processado_em is null;
  if v_pending <> 2 then
    raise exception 'TESTE RECIBOS: esperados dois eventos pendentes, obtidos %.', v_pending;
  end if;

  -- Simula somente o registro do resultado pelo sender. Nenhuma API externa e chamada.
  perform public.n8n_registrar_resultado_mensagem(v_queue_id, 'enviada', v_key_id, null);
  select * into v_row from public.fila_mensagens where id = v_queue_id;
  if v_row.identificador_externo is distinct from v_key_id
     or v_row.status is distinct from 'lida'
     or v_row.enviada_em is null or v_row.entregue_em is null or v_row.lida_em is null then
    raise exception 'TESTE RECIBOS: reconciliacao ou precedencia falhou: id=%, status=%',
      v_row.identificador_externo, v_row.status;
  end if;

  select count(*), count(*) filter (where processado_em is not null)
    into v_total, v_processed
  from public.eventos_webhook_whatsapp e
  where e.id_empresa = 10 and e.instancia_evolution = 'estudos-whatsapp'
    and e.identificador_externo = v_key_id;
  if v_total <> 2 or v_processed <> 2 then
    raise exception 'TESTE RECIBOS: eventos nao reconciliados: total=%, processados=%',
      v_total, v_processed;
  end if;
  if exists (select 1 from public.eventos_webhook_whatsapp e
    where e.id_empresa = 10 and e.identificador_externo = v_message_id) then
    raise exception 'TESTE RECIBOS: messageId interno foi usado como ID externo.';
  end if;

  -- Repeticao e evento de estado menor nao podem regredir a leitura.
  v_result := public.n8n_registrar_recibo_whatsapp(
    10, 'estudos-whatsapp', v_key_id, 'entregue',
    jsonb_build_object('keyId', v_key_id, 'messageId', v_message_id,
      'status', 'DELIVERY_ACK', 'source', 'smoke'), true
  );
  if v_result->>'duplicated' is distinct from 'true' then
    raise exception 'TESTE RECIBOS: repeticao nao foi reconhecida: %', v_result;
  end if;
  perform public.n8n_registrar_recibo_whatsapp(
    10, 'estudos-whatsapp', v_key_id, 'enviada',
    jsonb_build_object('keyId', v_key_id, 'status', 'SERVER_ACK', 'source', 'smoke'), true
  );
  perform public.n8n_registrar_resultado_mensagem(v_queue_id, 'enviada', v_key_id, null);
  select * into v_row from public.fila_mensagens where id = v_queue_id;
  if v_row.status is distinct from 'lida' then
    raise exception 'TESTE RECIBOS: estado regrediu de lida para %.', v_row.status;
  end if;
  select count(*), count(*) filter (where processado_em is not null)
    into v_total, v_processed
  from public.eventos_webhook_whatsapp e
  where e.id_empresa = 10 and e.instancia_evolution = 'estudos-whatsapp'
    and e.identificador_externo = v_key_id;
  if v_total <> 3 or v_processed <> 3 then
    raise exception 'TESTE RECIBOS: dedup/processamento final incorreto: total=%, processados=%',
      v_total, v_processed;
  end if;

  raise notice 'OK: keyId correto; 2 recibos antecipados reconciliados; lida prevalece; 3 eventos unicos processados.';
end;
$$;

rollback;
