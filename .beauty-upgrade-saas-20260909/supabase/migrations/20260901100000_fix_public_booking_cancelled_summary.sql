-- Mantem o resumo acessivel ao proprio cliente depois do cancelamento.
-- O token continua sendo exigido; apenas o item cancelado passa a compor o retorno.

create or replace function public.obter_agendamento_site(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'token', a.site_access_token,
    'codigo', 'MK' || lpad(a.id::text, 6, '0'),
    'status', a.status,
    'inicio', a.inicio,
    'fim', a.fim,
    'sinal_status', a.sinal_status,
    'sinal_valor', a.sinal_valor,
    'cliente', jsonb_build_object(
      'nome', c.nome,
      'email', c.email,
      'telefone', c.telefone_principal
    ),
    'empresa', jsonb_build_object(
      'id', e.id,
      'nome', e.fantasia,
      'fuso_horario', coalesce(e.fuso_horario, 'America/Sao_Paulo')
    ),
    'servico', jsonb_build_object(
      'id', s.id,
      'nome', s.nome,
      'duracao_minutos', item.duracao_minutos,
      'preco', item.preco
    ),
    'profissional', jsonb_build_object(
      'id', f.id,
      'nome', regexp_replace(f.nome, '[[:space:]]*\(Teste\)[[:space:]]*$', '', 'i'),
      'cargo', coalesce(f.cargo, 'Profissional')
    ),
    'lembretes', coalesce(a.site_notification_preferences, '{}'::jsonb)
  )
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  join public.empresas e
    on e.id = a.id_empresa
  join lateral (
    select i.*
    from public.agendamentos_servicos i
    where i.id_empresa = a.id_empresa
      and i.id_agendamento = a.id
    order by (i.status = 'cancelado'), i.ordem, i.id
    limit 1
  ) item on true
  join public.servicos s
    on s.id_empresa = item.id_empresa and s.id = item.id_servico
  join public.funcionarios f
    on f.id_empresa = item.id_empresa and f.id = item.id_funcionario
  where a.site_access_token = p_token;
$$;

revoke all on function public.obter_agendamento_site(uuid) from public, anon, authenticated;
grant execute on function public.obter_agendamento_site(uuid) to anon, authenticated;
