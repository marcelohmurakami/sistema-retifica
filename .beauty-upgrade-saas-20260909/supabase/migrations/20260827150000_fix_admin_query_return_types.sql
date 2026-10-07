create or replace function public.listar_usuarios_administracao(
  p_id_empresa bigint
)
returns table (
  id bigint,
  user_id uuid,
  nome text,
  email text,
  tipo public.tipos_usuarios,
  status public.status_usuario_empresa,
  created_at timestamptz,
  ultimo_acesso_em timestamptz,
  permissoes jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono', 'gerente']::public.tipos_usuarios[]
  ) then
    raise exception 'Você não possui permissão para consultar os usuários.';
  end if;

  return query
  select
    ue.id,
    ue.user_id,
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      split_part(u.email, '@', 1),
      'Usuário'
    ) as nome,
    u.email::text,
    ue.tipo,
    ue.status,
    ue.created_at,
    u.last_sign_in_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object('modulo', pu.modulo, 'permitido', pu.permitido)
        order by pu.modulo
      ) filter (where pu.id is not null),
      '[]'::jsonb
    ) as permissoes
  from public.usuarios_empresas ue
  join auth.users u on u.id = ue.user_id
  left join public.permissoes_usuarios pu
    on pu.id_empresa = ue.empresa_id
   and pu.usuario_empresa_id = ue.id
  where ue.empresa_id = p_id_empresa
  group by ue.id, ue.user_id, u.raw_user_meta_data, u.email,
           ue.tipo, ue.status, ue.created_at, u.last_sign_in_at
  order by
    case ue.tipo::text
      when 'dono' then 1
      when 'gerente' then 2
      when 'recepcionista' then 3
      else 4
    end,
    nome;
end;
$$;

create or replace function public.listar_auditoria_administracao(
  p_id_empresa bigint,
  p_busca text default null,
  p_acao text default null,
  p_tabela text default null,
  p_inicio timestamptz default null,
  p_fim timestamptz default null,
  p_pagina integer default 1,
  p_por_pagina integer default 20
)
returns table (
  id bigint,
  created_at timestamptz,
  acao text,
  tabela text,
  registro_id text,
  origem text,
  usuario_id uuid,
  usuario_nome text,
  usuario_email text,
  papel_execucao text,
  campos_alterados text[],
  dados_anteriores jsonb,
  dados_novos jsonb,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono', 'gerente']::public.tipos_usuarios[]
  ) then
    raise exception 'Você não possui permissão para consultar a auditoria.';
  end if;

  if not private.plano_tem_funcionalidade_empresa(p_id_empresa, 'auditoria') then
    raise exception 'A auditoria detalhada não está disponível no plano atual.';
  end if;

  return query
  select
    a.id,
    a.created_at,
    a.acao,
    a.tabela,
    a.registro_id,
    a.origem,
    a.usuario_id,
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      split_part(u.email, '@', 1),
      case when a.origem = 'sistema' then 'Sistema' else 'Usuário removido' end
    ) as usuario_nome,
    u.email::text as usuario_email,
    a.papel_execucao,
    a.campos_alterados,
    a.dados_anteriores,
    a.dados_novos,
    count(*) over() as total_count
  from public.auditorias a
  left join auth.users u on u.id = a.usuario_id
  where a.id_empresa = p_id_empresa
    and (
      nullif(btrim(p_busca), '') is null
      or a.tabela ilike '%' || btrim(p_busca) || '%'
      or a.registro_id ilike '%' || btrim(p_busca) || '%'
      or coalesce(u.email, '') ilike '%' || btrim(p_busca) || '%'
      or coalesce(u.raw_user_meta_data ->> 'full_name', '') ilike '%' || btrim(p_busca) || '%'
    )
    and (nullif(p_acao, '') is null or a.acao = p_acao)
    and (nullif(p_tabela, '') is null or a.tabela = p_tabela)
    and (p_inicio is null or a.created_at >= p_inicio)
    and (p_fim is null or a.created_at < p_fim)
  order by a.created_at desc, a.id desc
  limit least(greatest(p_por_pagina, 1), 100)
  offset (greatest(p_pagina, 1) - 1) * least(greatest(p_por_pagina, 1), 100);
end;
$$;

revoke all on function public.listar_usuarios_administracao(bigint) from public;
grant execute on function public.listar_usuarios_administracao(bigint) to authenticated;

revoke all on function public.listar_auditoria_administracao(bigint,text,text,text,timestamptz,timestamptz,integer,integer) from public;
grant execute on function public.listar_auditoria_administracao(bigint,text,text,text,timestamptz,timestamptz,integer,integer) to authenticated;

comment on function public.listar_usuarios_administracao(bigint) is
  'Lista os usuários da empresa convertendo explicitamente os campos do Auth para os tipos públicos declarados.';

comment on function public.listar_auditoria_administracao(bigint,text,text,text,timestamptz,timestamptz,integer,integer) is
  'Lista a auditoria administrativa com paginação e tipos de retorno compatíveis com o esquema público.';
