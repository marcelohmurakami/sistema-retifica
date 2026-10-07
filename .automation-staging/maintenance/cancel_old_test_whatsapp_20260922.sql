-- Cancelamento pontual autorizado em 22/09/2026. Apenas 12 notificacoes
-- antigas e ainda nao tentadas da empresa ficticia 10; nenhum email e tocado.
begin;

do $$
declare
  v_expected bigint[] := array[15,770,782,788,797,799,801,815,817,887,889,913];
  v_found bigint[];
  v_changed integer;
  v_cancelled integer;
begin
  select array_agg(q.id order by q.id) into v_found
  from (
    select id from public.fila_mensagens
    where id = any(v_expected)
      and id_empresa = 10
      and canal = 'whatsapp'
      and status = 'pendente'
      and agendada_para < timestamptz '2026-09-17 00:00:00+00'
      and tentativas = 0
      and envio_iniciado_em is null
      and enviada_em is null
      and identificador_externo is null
    for update
  ) q;

  if v_found is distinct from v_expected then
    raise exception 'Escopo mudou; cancelamento abortado';
  end if;

  update public.fila_mensagens
  set status = 'cancelada', cancelada_em = now()
  where id = any(v_expected)
    and id_empresa = 10
    and canal = 'whatsapp'
    and status = 'pendente'
    and agendada_para < timestamptz '2026-09-17 00:00:00+00'
    and tentativas = 0
    and envio_iniciado_em is null
    and enviada_em is null
    and identificador_externo is null;
  get diagnostics v_changed = row_count;
  if v_changed <> 12 then
    raise exception 'Quantidade inesperada (%); cancelamento abortado', v_changed;
  end if;

  select count(*) into v_cancelled from public.fila_mensagens
  where id = any(v_expected) and id_empresa = 10 and status = 'cancelada'
    and cancelada_em is not null;
  if v_cancelled <> 12 then
    raise exception 'Verificacao final falhou (%); cancelamento abortado', v_cancelled;
  end if;
end;
$$;

commit;
