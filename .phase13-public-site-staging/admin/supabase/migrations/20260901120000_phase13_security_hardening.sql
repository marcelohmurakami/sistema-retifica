-- Fase 13: endurecimento de RLS, grants e RPCs expostas.
-- Mantem o site publico funcional sem expor tabelas ou rotinas administrativas.

alter table public.clientes
  add column if not exists auth_user_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clientes_auth_user_fkey'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_auth_user_fkey
      foreign key (auth_user_id) references auth.users(id) on delete set null;
  end if;
end;
$$;

create unique index if not exists clientes_empresa_auth_user_unique
  on public.clientes (id_empresa, auth_user_id)
  where auth_user_id is not null;

create or replace function private.usuario_eh_cliente(
  p_id_empresa bigint,
  p_id_cliente bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.clientes c
    where c.id_empresa = p_id_empresa
      and c.id = p_id_cliente
      and c.auth_user_id = auth.uid()
      and c.ativo
  );
$$;

create or replace function private.usuario_eh_cliente_agendamento(
  p_id_empresa bigint,
  p_id_agendamento bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.agendamentos a
    join public.clientes c
      on c.id_empresa = a.id_empresa and c.id = a.id_cliente
    where a.id_empresa = p_id_empresa
      and a.id = p_id_agendamento
      and c.auth_user_id = auth.uid()
      and c.ativo
  );
$$;

revoke all on function private.usuario_eh_cliente(bigint, bigint)
  from public, anon;
revoke all on function private.usuario_eh_cliente_agendamento(bigint, bigint)
  from public, anon;
grant execute on function private.usuario_eh_cliente(bigint, bigint)
  to authenticated;
grant execute on function private.usuario_eh_cliente_agendamento(bigint, bigint)
  to authenticated;

drop policy if exists clientes_cliente_le_proprio on public.clientes;
create policy clientes_cliente_le_proprio
on public.clientes for select to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists agendamentos_cliente_le_proprios on public.agendamentos;
create policy agendamentos_cliente_le_proprios
on public.agendamentos for select to authenticated
using (private.usuario_eh_cliente(id_empresa, id_cliente));

drop policy if exists agendamentos_servicos_cliente_le_proprios
  on public.agendamentos_servicos;
create policy agendamentos_servicos_cliente_le_proprios
on public.agendamentos_servicos for select to authenticated
using (private.usuario_eh_cliente_agendamento(id_empresa, id_agendamento));

drop policy if exists preferencias_lembrete_cliente_le_proprias
  on public.preferencias_lembrete;
create policy preferencias_lembrete_cliente_le_proprias
on public.preferencias_lembrete for select to authenticated
using (private.usuario_eh_cliente(id_empresa, id_cliente));

drop policy if exists preferencias_lembrete_cliente_insere_proprias
  on public.preferencias_lembrete;
create policy preferencias_lembrete_cliente_insere_proprias
on public.preferencias_lembrete for insert to authenticated
with check (private.usuario_eh_cliente(id_empresa, id_cliente));

drop policy if exists preferencias_lembrete_cliente_atualiza_proprias
  on public.preferencias_lembrete;
create policy preferencias_lembrete_cliente_atualiza_proprias
on public.preferencias_lembrete for update to authenticated
using (private.usuario_eh_cliente(id_empresa, id_cliente))
with check (private.usuario_eh_cliente(id_empresa, id_cliente));

-- Somente cargos operacionais adequados podem administrar as novas estruturas.
drop policy if exists unidades_membros_gerenciam on public.unidades;
create policy unidades_gestao_gerencia
on public.unidades for all to authenticated
using (private.usuario_tem_tipo_empresa(
  id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
))
with check (private.usuario_tem_tipo_empresa(
  id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
));

drop policy if exists horarios_funcionamento_membros_gerenciam
  on public.horarios_funcionamento;
create policy horarios_funcionamento_gestao_gerencia
on public.horarios_funcionamento for all to authenticated
using (private.usuario_tem_tipo_empresa(
  id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
))
with check (private.usuario_tem_tipo_empresa(
  id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
));

drop policy if exists disponibilidades_membros_gerenciam
  on public.disponibilidades;
create policy disponibilidades_equipe_ou_proprio_gerencia
on public.disponibilidades for all to authenticated
using (
  private.usuario_tem_tipo_empresa(
    id_empresa,
    array['dono', 'gerente', 'recepcionista']::public.tipos_usuarios[]
  )
  or private.usuario_eh_funcionario(id_profissional)
)
with check (
  private.usuario_tem_tipo_empresa(
    id_empresa,
    array['dono', 'gerente', 'recepcionista']::public.tipos_usuarios[]
  )
  or private.usuario_eh_funcionario(id_profissional)
);

drop policy if exists preferencias_lembrete_membros_gerenciam
  on public.preferencias_lembrete;
create policy preferencias_lembrete_equipe_gerencia
on public.preferencias_lembrete for all to authenticated
using (private.usuario_tem_tipo_empresa(
  id_empresa,
  array['dono', 'gerente', 'recepcionista']::public.tipos_usuarios[]
))
with check (private.usuario_tem_tipo_empresa(
  id_empresa,
  array['dono', 'gerente', 'recepcionista']::public.tipos_usuarios[]
));

drop policy if exists politicas_cancelamento_membros_gerenciam
  on public.politicas_cancelamento;
create policy politicas_cancelamento_gestao_gerencia
on public.politicas_cancelamento for all to authenticated
using (private.usuario_tem_tipo_empresa(
  id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
))
with check (private.usuario_tem_tipo_empresa(
  id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
));

-- Permite que um cliente autenticado associe sua conta a uma reserva cujo
-- token privado ele já possui. A função será movida para private logo abaixo.
create or replace function public.vincular_cliente_site(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id_cliente bigint;
  v_id_empresa bigint;
  v_auth_atual uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação do cliente obrigatória.';
  end if;

  select a.id_cliente, a.id_empresa, c.auth_user_id
    into v_id_cliente, v_id_empresa, v_auth_atual
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  where a.site_access_token = p_token
  for update of c;

  if not found then
    raise exception 'Agendamento não encontrado.';
  end if;
  if v_auth_atual is not null and v_auth_atual <> auth.uid() then
    raise exception 'Este cliente já está associado a outra conta.';
  end if;

  update public.clientes
  set auth_user_id = auth.uid(), updated_at = now()
  where id_empresa = v_id_empresa and id = v_id_cliente;

  return public.obter_agendamento_site(p_token);
end;
$$;

-- Move RPCs SECURITY DEFINER para o schema privado e recria wrappers
-- SECURITY INVOKER no schema exposto. Assinaturas e retornos são preservados.
do $$
declare
  v_func record;
  v_argumentos text;
  v_argumentos_identidade text;
  v_retorno text;
  v_chamada text;
  v_corpo text;
  v_volatilidade text;
begin
  for v_func in
    select p.oid, p.proname, p.pronargs, p.proretset, p.provolatile
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.prosecdef
      and p.prorettype <> 'trigger'::regtype
    order by p.proname, p.oid
  loop
    v_argumentos := pg_get_function_arguments(v_func.oid);
    v_argumentos_identidade := pg_get_function_identity_arguments(v_func.oid);
    v_retorno := pg_get_function_result(v_func.oid);

    select coalesce(string_agg(format('$%s', pos), ', '), '')
      into v_chamada
    from generate_series(1, v_func.pronargs) pos;

    v_corpo := case when v_func.proretset
      then format('select * from private.%I(%s)', v_func.proname, v_chamada)
      else format('select private.%I(%s)', v_func.proname, v_chamada)
    end;
    v_volatilidade := case v_func.provolatile
      when 'i' then 'immutable'
      when 's' then 'stable'
      else 'volatile'
    end;

    execute format(
      'alter function public.%I(%s) set schema private',
      v_func.proname, v_argumentos_identidade
    );
    execute format(
      'revoke all on function private.%I(%s) from public, anon, authenticated',
      v_func.proname, v_argumentos_identidade
    );
    execute format(
      'grant execute on function private.%I(%s) to authenticated',
      v_func.proname, v_argumentos_identidade
    );

    if v_func.proname in (
      'obter_catalogo_site', 'obter_disponibilidade_site',
      'criar_agendamento_site', 'obter_agendamento_site',
      'alterar_agendamento_site', 'reagendar_agendamento_site'
    ) then
      execute format(
        'grant execute on function private.%I(%s) to anon',
        v_func.proname, v_argumentos_identidade
      );
    end if;

    execute format(
      'create function public.%I(%s) returns %s language sql %s security invoker set search_path = '''' as $wrapper$ %s $wrapper$',
      v_func.proname, v_argumentos, v_retorno,
      v_volatilidade, v_corpo
    );
  end loop;
end;
$$;

-- O schema private não é exposto pela Data API; USAGE apenas permite que os
-- wrappers públicos chamem as implementações autorizadas.
grant usage on schema private to anon, authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to authenticated;
grant execute on function public.obter_catalogo_site(bigint) to anon;
grant execute on function public.obter_disponibilidade_site(bigint, date, bigint, bigint) to anon;
grant execute on function public.criar_agendamento_site(
  bigint, text, text, text, bigint, bigint, timestamptz,
  text, boolean, boolean, uuid
) to anon;
grant execute on function public.obter_agendamento_site(uuid) to anon;
grant execute on function public.alterar_agendamento_site(uuid, text, text) to anon;
grant execute on function public.reagendar_agendamento_site(uuid, bigint, timestamptz) to anon;

-- Reconstroi grants de tabelas a partir das próprias políticas RLS.
-- Isso remove TRUNCATE/TRIGGER/REFERENCES/MAINTAIN concedidos por padrão.
revoke all on all tables in schema public from public, anon, authenticated;

do $$
declare
  v_policy record;
  v_role name;
  v_command text;
begin
  for v_policy in
    select schemaname, tablename, cmd, roles
    from pg_policies
    where schemaname = 'public'
  loop
    foreach v_role in array v_policy.roles
    loop
      if v_role not in ('anon', 'authenticated', 'public') then
        continue;
      end if;

      v_command := case v_policy.cmd
        when 'ALL' then 'select, insert, update, delete'
        when 'SELECT' then 'select'
        when 'INSERT' then 'insert'
        when 'UPDATE' then 'update'
        when 'DELETE' then 'delete'
      end;

      if v_command is not null then
        if v_role = 'public' then
          execute format(
            'grant %s on table %I.%I to anon, authenticated',
            v_command, v_policy.schemaname, v_policy.tablename
          );
        else
          execute format(
            'grant %s on table %I.%I to %I',
            v_command, v_policy.schemaname, v_policy.tablename, v_role
          );
        end if;
      end if;
    end loop;
  end loop;
end;
$$;

-- Views seguras obedecem o RLS das tabelas de origem e não são públicas.
grant select on public.profissionais,
  public.profissionais_servicos, public.notificacoes
to authenticated;

revoke all on all sequences in schema public from public, anon, authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Novos objetos passam a nascer fechados; cada migration deve liberar apenas
-- as operações de que realmente precisa.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated;

-- Asserções executadas no próprio push: a migration falha inteira se alguma
-- garantia de segurança abaixo não for verdadeira.
do $$
declare
  v_total_tabelas integer;
  v_total_rls integer;
  v_rpc_anon_inesperada text;
  v_funcao_exposta text;
begin
  select count(*) into v_total_tabelas
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p');

  select count(*) into v_total_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and c.relrowsecurity;

  if v_total_tabelas <> v_total_rls then
    raise exception 'RLS incompleto: % de % tabelas protegidas.',
      v_total_rls, v_total_tabelas;
  end if;

  select p.proname into v_rpc_anon_inesperada
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and p.proname not in (
      'obter_catalogo_site', 'obter_disponibilidade_site',
      'criar_agendamento_site', 'obter_agendamento_site',
      'alterar_agendamento_site', 'reagendar_agendamento_site'
    )
  limit 1;

  if v_rpc_anon_inesperada is not null then
    raise exception 'RPC não autorizada disponível para anon: %.',
      v_rpc_anon_inesperada;
  end if;

  select p.proname into v_funcao_exposta
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and p.prorettype <> 'trigger'::regtype
  limit 1;

  if v_funcao_exposta is not null then
    raise exception 'SECURITY DEFINER ainda exposta em public: %.',
      v_funcao_exposta;
  end if;

  if has_table_privilege('anon', 'public.clientes', 'SELECT')
     or has_table_privilege('anon', 'public.agendamentos', 'SELECT')
     or has_table_privilege('anon', 'public.pagamentos', 'SELECT') then
    raise exception 'anon ainda possui acesso direto a dados privados.';
  end if;
end;
$$;

comment on column public.clientes.auth_user_id is
  'Conta Supabase Auth opcional do cliente para políticas RLS de autoatendimento.';
comment on function public.vincular_cliente_site(uuid) is
  'Associa de forma autenticada a conta do cliente a uma reserva comprovada pelo token privado.';
