-- Homologação transacional de isolamento, expiração de links e fuso horário.
-- Nenhuma alteração persiste: o arquivo sempre termina com ROLLBACK.
begin;
set local role postgres;
set local search_path = extensions, public, pg_catalog;

create temporary table delivery_test_context (
  key text primary key,
  value text not null
) on commit drop;

insert into delivery_test_context(key, value)
select 'client_1', c.auth_user_id::text
from public.clientes c
where c.auth_user_id is not null
  and not exists (
    select 1 from public.usuarios_empresas ue
    where ue.user_id = c.auth_user_id and ue.status = 'ativo'
  )
  and exists (
    select 1 from public.agendamentos a
    where a.id_empresa = c.id_empresa and a.id_cliente = c.id
  )
order by c.id
limit 1;

insert into delivery_test_context(key, value)
select 'client_2', c.auth_user_id::text
from public.clientes c
where c.auth_user_id is not null
  and c.auth_user_id::text <> (select value from delivery_test_context where key = 'client_1')
  and not exists (
    select 1 from public.usuarios_empresas ue
    where ue.user_id = c.auth_user_id and ue.status = 'ativo'
  )
  and exists (
    select 1 from public.agendamentos a
    where a.id_empresa = c.id_empresa and a.id_cliente = c.id
  )
order by c.id
limit 1;

insert into delivery_test_context(key, value)
select 'other_booking', a.id::text
from public.agendamentos a
join public.clientes c
  on c.id_empresa = a.id_empresa and c.id = a.id_cliente
where c.auth_user_id::text = (select value from delivery_test_context where key = 'client_2')
order by a.id
limit 1;

insert into delivery_test_context(key, value)
select 'manager', ue.user_id::text
from public.usuarios_empresas ue
where ue.status = 'ativo' and ue.tipo in ('dono', 'gerente')
order by ue.id
limit 1;

insert into delivery_test_context(key, value)
select 'manager_company', ue.empresa_id::text
from public.usuarios_empresas ue
where ue.user_id::text = (select value from delivery_test_context where key = 'manager')
  and ue.status = 'ativo'
order by ue.id
limit 1;

with source_company as (
  select e.*
  from public.empresas e
  where e.id = (select value::bigint from delivery_test_context where key = 'manager_company')
), inserted as (
  insert into public.empresas (
    razao_social, fantasia, cnpj, contato1, contato2, email, status,
    criado_por, fuso_horario
  )
  select
    'Empresa isolada de homologação',
    'Empresa isolada de homologação',
    null, null, null, null, status, criado_por, fuso_horario
  from source_company
  returning id
)
insert into delivery_test_context(key, value)
select 'foreign_company', id::text from inserted;

do $$
begin
  if (select count(*) from delivery_test_context) <> 6 then
    raise exception 'TESTE ENTREGA: fixtures de isolamento insuficientes.';
  end if;
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  ) then
    raise exception 'TESTE ENTREGA: existe tabela public sem RLS.';
  end if;
  if has_table_privilege('anon', 'public.clientes', 'SELECT')
     or has_table_privilege('anon', 'public.agendamentos', 'SELECT')
     or has_table_privilege('anon', 'public.pagamentos', 'SELECT') then
    raise exception 'TESTE ENTREGA: visitante recebeu leitura direta de dados privados.';
  end if;
end;
$$;

grant select on delivery_test_context to authenticated;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select value from delivery_test_context where key = 'client_1'),
    'role', 'authenticated'
  )::text,
  true
);
select set_config(
  'request.jwt.claim.sub',
  (select value from delivery_test_context where key = 'client_1'),
  true
);

do $$
declare
  v_other_booking bigint := (
    select value::bigint from delivery_test_context where key = 'other_booking'
  );
begin
  if exists (
    select 1 from public.clientes c where c.auth_user_id <> auth.uid()
  ) then
    raise exception 'TESTE ENTREGA: cliente conseguiu ler cadastro de outro cliente.';
  end if;
  if exists (
    select 1 from public.agendamentos a where a.id = v_other_booking
  ) then
    raise exception 'TESTE ENTREGA: cliente conseguiu ler agendamento de outro cliente.';
  end if;
  if not exists (
    select 1 from public.clientes c where c.auth_user_id = auth.uid()
  ) then
    raise exception 'TESTE ENTREGA: cliente não conseguiu ler o próprio cadastro.';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select value from delivery_test_context where key = 'manager'),
    'role', 'authenticated'
  )::text,
  true
);
select set_config(
  'request.jwt.claim.sub',
  (select value from delivery_test_context where key = 'manager'),
  true
);

do $$
declare
  v_own bigint := (
    select value::bigint from delivery_test_context where key = 'manager_company'
  );
  v_foreign bigint := (
    select value::bigint from delivery_test_context where key = 'foreign_company'
  );
  v_blocked_reminders boolean := false;
  v_blocked_resend boolean := false;
  v_blocked_booking boolean := false;
begin
  if not exists (select 1 from public.empresas e where e.id = v_own) then
    raise exception 'TESTE ENTREGA: gestor não conseguiu ler a própria empresa.';
  end if;
  if exists (select 1 from public.empresas e where e.id = v_foreign) then
    raise exception 'TESTE ENTREGA: gestor conseguiu ler outra empresa.';
  end if;

  begin
    perform public.salvar_configuracao_lembretes_administracao(
      v_foreign, true, true, true, array[120], 3
    );
  exception when others then v_blocked_reminders := true;
  end;
  begin
    perform public.reenviar_confirmacao_agendamento_administracao(v_foreign, 1);
  exception when others then v_blocked_resend := true;
  end;
  begin
    perform public.alterar_agendamento_administracao(
      v_foreign, 1, 'confirmado', null
    );
  exception when others then v_blocked_booking := true;
  end;
  if not (v_blocked_reminders and v_blocked_resend and v_blocked_booking) then
    raise exception 'TESTE ENTREGA: RPC administrativo aceitou empresa estrangeira.';
  end if;
end;
$$;

reset role;
set local role postgres;

do $$
declare
  v_booking record;
  v_link jsonb;
  v_blocked boolean := false;
  v_unit record;
  v_service bigint;
  v_day date;
  v_slot jsonb;
  v_backup_count bigint;
  v_restore_count bigint;
  v_backup_digest text;
  v_restore_digest text;
begin
  select a.id, a.id_empresa into v_booking
  from public.agendamentos a
  where a.site_access_token is not null
  order by a.id desc
  limit 1;

  if v_booking.id is null then
    raise exception 'TESTE ENTREGA: nenhum agendamento apto para testar link expirado.';
  end if;

  v_link := private.emitir_token_link_agendamento(
    v_booking.id_empresa, v_booking.id, 'gerenciar', interval '5 minutes'
  );
  update public.tokens_links_agendamento
  set expira_em = now() - interval '1 second'
  where token_hash = encode(
    extensions.digest(lower(v_link->>'token'), 'sha256'), 'hex'
  );

  begin
    perform public.consumir_token_link_agendamento(v_link->>'token');
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then
    raise exception 'TESTE ENTREGA: link expirado ainda foi aceito.';
  end if;

  select u.id_empresa, u.id, coalesce(u.fuso_horario, e.fuso_horario) as fuso_horario
    into v_unit
  from public.unidades u
  join public.empresas e on e.id = u.id_empresa
  where u.ativo
  order by u.id
  limit 1;

  select s.id into v_service
  from public.servicos s
  where s.id_empresa = v_unit.id_empresa and s.ativo
    and exists (
      select 1 from public.funcionarios_servicos fs
      join public.funcionarios f
        on f.id_empresa = fs.id_empresa and f.id = fs.id_funcionario
      where fs.id_empresa = s.id_empresa and fs.id_servico = s.id
        and fs.ativo and f.ativo
    )
  order by s.id
  limit 1;

  for v_day in
    select d::date
    from generate_series(current_date + 2, current_date + 35, interval '1 day') d
  loop
    select value into v_slot
    from jsonb_array_elements(
      private.obter_disponibilidade_site(
        v_unit.id_empresa, v_unit.id, v_day, v_service, null
      )
    )
    limit 1;
    exit when v_slot is not null;
  end loop;

  if v_slot is null then
    raise exception 'TESTE ENTREGA: nenhum horário disponível para validar fuso.';
  end if;
  if ((v_slot->>'inicio')::timestamptz at time zone v_unit.fuso_horario)::date <> v_day then
    raise exception 'TESTE ENTREGA: o instante retornado caiu em outro dia no fuso da unidade.';
  end if;
  if to_char(
    (v_slot->>'inicio')::timestamptz at time zone v_unit.fuso_horario,
    'HH24:MI'
  ) <> v_slot->>'horario' then
    raise exception 'TESTE ENTREGA: o rótulo do horário diverge do fuso da unidade.';
  end if;

  create temporary table delivery_backup_agendamentos on commit drop as
  select id, id_empresa, id_cliente, status, inicio, fim, pagamento_status
  from public.agendamentos;
  create temporary table delivery_restore_agendamentos on commit drop as
  select * from delivery_backup_agendamentos with no data;
  insert into delivery_restore_agendamentos
  select * from delivery_backup_agendamentos;

  select count(*), md5(coalesce(string_agg(
    concat_ws('|', id, id_empresa, id_cliente, status, inicio, fim, pagamento_status),
    E'\n' order by id
  ), '')) into v_backup_count, v_backup_digest
  from delivery_backup_agendamentos;
  select count(*), md5(coalesce(string_agg(
    concat_ws('|', id, id_empresa, id_cliente, status, inicio, fim, pagamento_status),
    E'\n' order by id
  ), '')) into v_restore_count, v_restore_digest
  from delivery_restore_agendamentos;

  if v_backup_count <> v_restore_count
     or v_backup_digest is distinct from v_restore_digest then
    raise exception 'TESTE ENTREGA: ensaio lógico de backup/restauração divergiu.';
  end if;

  raise notice 'TESTE ENTREGA: RLS, isolamento, RPCs, link, fuso e restauração lógica passaram.';
end;
$$;

rollback;
