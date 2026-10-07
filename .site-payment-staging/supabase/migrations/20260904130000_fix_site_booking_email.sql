-- Mantem o e-mail informado no agendamento associado somente aquela reserva.
-- Se o telefone ja pertencer a outro e-mail, cria/reutiliza o cliente correto
-- sem alterar os agendamentos anteriores nem a conta Auth ja vinculada.

create or replace function private.atualizar_email_agendamento_site(
  p_token uuid,
  p_email text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id_agendamento bigint;
  v_id_empresa bigint;
  v_id_cliente_atual bigint;
  v_email_atual text;
  v_id_cliente_destino bigint;
  v_total_email integer;
  v_nome text;
  v_telefone_principal text;
  v_telefone_e164 text;
  v_canal_preferido text;
begin
  if p_token is null then
    raise exception 'Agendamento nao identificado.';
  end if;
  if v_email = ''
    or char_length(v_email) > 254
    or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    raise exception 'Informe um e-mail valido.';
  end if;

  select
    a.id,
    a.id_empresa,
    c.id,
    lower(btrim(coalesce(c.email, ''))),
    c.nome,
    c.telefone_principal,
    c.telefone_e164,
    c.canal_preferido
  into
    v_id_agendamento,
    v_id_empresa,
    v_id_cliente_atual,
    v_email_atual,
    v_nome,
    v_telefone_principal,
    v_telefone_e164,
    v_canal_preferido
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa
   and c.id = a.id_cliente
  where a.site_access_token = p_token
  for update of a;

  if not found then
    raise exception 'Agendamento nao encontrado.';
  end if;

  if v_email_atual = v_email then
    return private.obter_agendamento_site(p_token);
  end if;

  select count(*), min(c.id)
  into v_total_email, v_id_cliente_destino
  from public.clientes c
  where c.id_empresa = v_id_empresa
    and c.ativo
    and c.email_normalizado = v_email;

  if v_total_email > 1 then
    raise exception 'Ha cadastros duplicados com este e-mail. Fale com a recepcao.';
  end if;

  if v_total_email = 0 then
    insert into public.clientes (
      id_empresa,
      nome,
      telefone_principal,
      telefone_e164,
      email,
      canal_preferido,
      observacoes
    ) values (
      v_id_empresa,
      v_nome,
      v_telefone_principal,
      v_telefone_e164,
      v_email,
      coalesce(v_canal_preferido, 'email'),
      '[SITE] Cadastro separado porque o e-mail informado difere do cliente encontrado pelo telefone.'
    )
    returning id into v_id_cliente_destino;
  end if;

  update public.agendamentos
  set id_cliente = v_id_cliente_destino,
      updated_at = now()
  where id_empresa = v_id_empresa
    and id = v_id_agendamento;

  return private.obter_agendamento_site(p_token);
end;
$$;

revoke all on function private.atualizar_email_agendamento_site(uuid, text) from public;
grant execute on function private.atualizar_email_agendamento_site(uuid, text) to anon, authenticated, service_role;

create or replace function public.atualizar_email_agendamento_site(
  p_token uuid,
  p_email text
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.atualizar_email_agendamento_site($1, $2)
$$;

revoke all on function public.atualizar_email_agendamento_site(uuid, text) from public;
grant execute on function public.atualizar_email_agendamento_site(uuid, text) to anon, authenticated, service_role;

comment on function public.atualizar_email_agendamento_site(uuid, text) is
  'Corrige o e-mail da reserva identificada por token sem alterar o cliente ou os agendamentos anteriores.';
