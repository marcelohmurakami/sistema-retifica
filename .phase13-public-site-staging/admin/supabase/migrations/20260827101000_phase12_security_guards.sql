-- Proteções adicionais da administração:
-- 1. uma autenticação só processa convites do próprio e-mail;
-- 2. um dono nunca pode perder a tela que restaura permissões.

create or replace function public.aceitar_convites_pendentes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_confirmado timestamptz;
  v_convite record;
  v_total integer := 0;
begin
  if auth.uid() is null then return 0; end if;

  select lower(u.email), u.email_confirmed_at
    into v_email, v_confirmado
  from auth.users u
  where u.id = auth.uid();

  if v_email is null or v_confirmado is null then return 0; end if;

  update public.convites_empresa
     set status = 'expirado', updated_at = now()
   where status = 'pendente'
     and expires_at <= now()
     and lower(email) = v_email;

  for v_convite in
    select ce.*
    from public.convites_empresa ce
    where ce.status = 'pendente'
      and ce.expires_at > now()
      and lower(ce.email) = v_email
    order by ce.created_at
    for update
  loop
    insert into public.usuarios_empresas (empresa_id, user_id, tipo, status)
    values (v_convite.id_empresa, auth.uid(), v_convite.tipo, 'ativo'::public.status_usuario_empresa)
    on conflict (empresa_id, user_id) do update
      set tipo = excluded.tipo,
          status = 'ativo'::public.status_usuario_empresa;

    update public.convites_empresa
       set status = 'aceito', aceito_por = auth.uid(),
           aceito_em = now(), updated_at = now()
     where id = v_convite.id;
    v_total := v_total + 1;
  end loop;

  return v_total;
end;
$$;

create or replace function public.salvar_permissoes_usuario(
  p_id_empresa bigint,
  p_usuario_empresa_id bigint,
  p_permissoes jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_modulo text;
  v_permitido boolean;
  v_tipo public.tipos_usuarios;
begin
  if not private.usuario_tem_tipo_empresa(p_id_empresa, array['dono']::public.tipos_usuarios[]) then
    raise exception 'Somente o administrador pode personalizar permissões.';
  end if;
  if not private.plano_tem_funcionalidade_empresa(p_id_empresa, 'permissoes_personalizadas') then
    raise exception 'Permissões personalizadas não estão disponíveis no plano atual.';
  end if;
  if jsonb_typeof(p_permissoes) <> 'array' then
    raise exception 'A lista de permissões é inválida.';
  end if;

  select ue.tipo into v_tipo
  from public.usuarios_empresas ue
  where ue.id = p_usuario_empresa_id and ue.empresa_id = p_id_empresa;
  if v_tipo is null then raise exception 'Usuário da empresa não encontrado.'; end if;

  delete from public.permissoes_usuarios
   where id_empresa = p_id_empresa and usuario_empresa_id = p_usuario_empresa_id;

  for v_item in select value from jsonb_array_elements(p_permissoes)
  loop
    v_modulo := v_item ->> 'modulo';
    v_permitido := coalesce((v_item ->> 'permitido')::boolean, true);
    if v_modulo not in (
      'dashboard', 'agendamentos', 'clientes', 'comandas', 'orcamentos',
      'funcionarios', 'servicos', 'produtos', 'fornecedores', 'financeiro',
      'comissoes', 'estoque', 'historico', 'configuracoes'
    ) then raise exception 'Módulo de permissão inválido: %.', v_modulo; end if;
    if v_tipo = 'dono'::public.tipos_usuarios
       and v_modulo = 'configuracoes'
       and not v_permitido then
      raise exception 'A administração não pode ser bloqueada para um dono.';
    end if;

    insert into public.permissoes_usuarios (
      id_empresa, usuario_empresa_id, modulo, permitido, atualizado_por
    ) values (
      p_id_empresa, p_usuario_empresa_id, v_modulo, v_permitido, auth.uid()
    );
  end loop;
end;
$$;
