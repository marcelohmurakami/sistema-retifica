-- Mantem recibos que chegam antes de o sender gravar o ID retornado pela Evolution.
-- Esta migration depende de 20260922130000_whatsapp_delivery_durability.sql.

create index if not exists fila_mensagens_whatsapp_external_lookup_idx
  on public.fila_mensagens (id_empresa, identificador_externo)
  where canal = 'whatsapp' and identificador_externo is not null;

create index if not exists eventos_webhook_whatsapp_pendentes_idx
  on public.eventos_webhook_whatsapp (id_empresa, identificador_externo)
  where processado_em is null and assinatura_valida;

-- O helper marca os eventos na mesma transacao em que atualiza a fila. Assim,
-- falhas no processamento deixam o recibo pendente para a proxima tentativa.
create or replace function private.n8n_aplicar_recibos_pendentes(
  p_id_empresa bigint, p_id_mensagem bigint, p_identificador_externo text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_status text;
  v_total integer;
begin
  select case e.evento
    when 'DELIVERY_LIDA' then 'lida'
    when 'DELIVERY_ENTREGUE' then 'entregue'
    when 'DELIVERY_ENVIADA' then 'enviada'
    when 'DELIVERY_ERRO' then 'erro'
  end into v_status
  from public.eventos_webhook_whatsapp e
  where e.id_empresa = p_id_empresa
    and e.identificador_externo = p_identificador_externo
    and e.assinatura_valida
    and e.processado_em is null
    and e.payload @> '{"accepted":true}'::jsonb
    and e.evento in ('DELIVERY_LIDA', 'DELIVERY_ENTREGUE', 'DELIVERY_ENVIADA', 'DELIVERY_ERRO')
  order by case e.evento
    when 'DELIVERY_LIDA' then 4
    when 'DELIVERY_ENTREGUE' then 3
    when 'DELIVERY_ENVIADA' then 2
    else 1
  end desc
  limit 1;

  if v_status is null then
    return jsonb_build_object('applied', false, 'count', 0);
  end if;

  update public.eventos_webhook_whatsapp e
  set processado_em = now(), erro = null
  where e.id_empresa = p_id_empresa
    and e.identificador_externo = p_identificador_externo
    and e.assinatura_valida
    and e.processado_em is null
    and e.payload @> '{"accepted":true}'::jsonb
    and e.evento in ('DELIVERY_LIDA', 'DELIVERY_ENTREGUE', 'DELIVERY_ENVIADA', 'DELIVERY_ERRO');
  get diagnostics v_total = row_count;

  if v_total = 0 then
    return jsonb_build_object('applied', false, 'count', 0);
  end if;

  perform public.n8n_registrar_resultado_mensagem(
    p_id_mensagem, v_status, p_identificador_externo,
    case when v_status = 'erro' then 'Falha informada pela Evolution.' else null end
  );
  return jsonb_build_object('applied', true, 'count', v_total, 'status', v_status);
end;
$$;

-- O nome publico e a assinatura usados pelo sender permanecem iguais. O lock
-- por empresa/ID serializa o registro do envio com a chegada do recibo.
alter function public.n8n_registrar_resultado_mensagem(bigint, text, text, text)
  rename to n8n_registrar_resultado_mensagem_impl;

create function public.n8n_registrar_resultado_mensagem(
  p_id_mensagem bigint, p_status text,
  p_identificador_externo text default null, p_erro text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id_empresa bigint;
  v_identificador text := nullif(btrim(p_identificador_externo), '');
  v_resultado jsonb;
begin
  if v_identificador is not null then
    select m.id_empresa into v_id_empresa
    from public.fila_mensagens m where m.id = p_id_mensagem;
    if v_id_empresa is not null then
      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
          'whatsapp-receipt:' || v_id_empresa::text || ':' || v_identificador, 0
        )
      );
    end if;
  end if;

  v_resultado := public.n8n_registrar_resultado_mensagem_impl(
    p_id_mensagem, p_status, p_identificador_externo, p_erro
  );
  if v_identificador is not null and exists (
    select 1 from public.fila_mensagens m
    where m.id = p_id_mensagem and m.id_empresa = v_id_empresa
      and m.canal = 'whatsapp' and m.identificador_externo = v_identificador
  ) then
    perform private.n8n_aplicar_recibos_pendentes(
      v_id_empresa, p_id_mensagem, v_identificador
    );
  end if;
  return v_resultado;
end;
$$;

create or replace function public.n8n_registrar_recibo_whatsapp(
  p_id_empresa bigint, p_instancia_evolution text, p_identificador_externo text,
  p_status text, p_payload jsonb, p_assinatura_valida boolean
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_identificador text := nullif(btrim(p_identificador_externo), '');
  v_config public.configuracoes_automacao_whatsapp%rowtype;
  v_evento jsonb;
  v_id_mensagem bigint;
  v_aplicacao jsonb;
begin
  if v_identificador is null then
    raise exception 'Recibo sem identificador externo.';
  end if;
  if p_status is null or p_status not in ('enviada', 'entregue', 'lida', 'erro') then
    raise exception 'Status de recibo invalido.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'whatsapp-receipt:' || p_id_empresa::text || ':' || v_identificador, 0
    )
  );

  select * into v_config from public.configuracoes_automacao_whatsapp w
  where w.id_empresa = p_id_empresa
    and w.instancia_evolution = p_instancia_evolution;
  if not found or v_config.ativo is not true or p_assinatura_valida is not true then
    return jsonb_build_object('accepted', false, 'applied', false, 'pending', false);
  end if;

  v_evento := public.n8n_registrar_evento_evolution(
    p_id_empresa, p_instancia_evolution, v_identificador,
    'DELIVERY_' || upper(p_status),
    coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('status', p_status, 'accepted', true),
    true
  );
  if (v_evento->>'accepted')::boolean is not true then
    return v_evento || jsonb_build_object('applied', false, 'pending', false);
  end if;

  -- Um evento pendente gravado por uma versao anterior pode existir sem a
  -- marca accepted. Atualiza apenas o pendente para permitir a conciliacao.
  update public.eventos_webhook_whatsapp e
  set payload = e.payload || jsonb_build_object('status', p_status, 'accepted', true),
      assinatura_valida = true
  where e.id = (v_evento->>'id')::bigint and e.processado_em is null;

  select m.id into v_id_mensagem from public.fila_mensagens m
  where m.id_empresa = p_id_empresa and m.canal = 'whatsapp'
    and m.identificador_externo = v_identificador
  order by m.id desc limit 1;

  if v_id_mensagem is null then
    return v_evento || jsonb_build_object('applied', false, 'pending', true);
  end if;

  v_aplicacao := private.n8n_aplicar_recibos_pendentes(
    p_id_empresa, v_id_mensagem, v_identificador
  );
  return v_evento || v_aplicacao || jsonb_build_object('pending', false);
end;
$$;

revoke all on function private.n8n_aplicar_recibos_pendentes(bigint, bigint, text)
  from public, anon, authenticated, service_role;
revoke all on function public.n8n_registrar_resultado_mensagem_impl(bigint, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.n8n_registrar_resultado_mensagem(bigint, text, text, text) from public;
grant execute on function public.n8n_registrar_resultado_mensagem(bigint, text, text, text) to service_role;
revoke all on function public.n8n_registrar_recibo_whatsapp(bigint, text, text, text, jsonb, boolean) from public;
grant execute on function public.n8n_registrar_recibo_whatsapp(bigint, text, text, text, jsonb, boolean) to service_role;
