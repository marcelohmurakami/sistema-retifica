-- Fase 14: dashboard operacional e relatórios consolidados.
-- Uma única função entrega todos os blocos, respeitando empresa, plano, cargo e fuso horário.

create index if not exists dashboard_agendamentos_periodo_idx
  on public.agendamentos (id_empresa, inicio, fim)
  where status <> 'cancelado';

create index if not exists dashboard_agendamentos_servicos_periodo_idx
  on public.agendamentos_servicos (id_empresa, id_funcionario, inicio, fim)
  where status <> 'cancelado';

create index if not exists dashboard_comandas_fechadas_idx
  on public.comandas (id_empresa, fechada_em)
  where status = 'fechada';

create index if not exists dashboard_comandas_itens_idx
  on public.comandas_itens (id_empresa, id_comanda, tipo_item);

create index if not exists dashboard_clientes_criados_idx
  on public.clientes (id_empresa, created_at);

create index if not exists dashboard_estoque_baixo_idx
  on public.produtos (id_empresa, estoque_atual)
  where ativo and controla_estoque;

create index if not exists dashboard_parcelas_vencimento_idx
  on public.contas_parcelas (id_empresa, data_vencimento)
  where status not in ('paga', 'cancelada');

create index if not exists dashboard_jornadas_idx
  on public.funcionarios_horarios (id_empresa, dia_semana, id_funcionario)
  where ativo;

create or replace function public.obter_dashboard_empresa(
  p_id_empresa bigint,
  p_data_referencia date default current_date,
  p_dias_periodo integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_fuso text;
  v_tipo public.tipos_usuarios;
  v_funcionario_id bigint;
  v_escopo_pessoal boolean := false;
  v_pode_financeiro boolean := false;
  v_pode_avancado boolean := false;
  v_pode_estoque boolean := false;
  v_pode_contas boolean := false;
  v_dias integer;
  v_data date := coalesce(p_data_referencia, current_date);
  v_inicio_dia timestamptz;
  v_fim_dia timestamptz;
  v_inicio_periodo date;
  v_inicio_periodo_ts timestamptz;
  v_fim_periodo_ts timestamptz;
  v_inicio_periodo_anterior_ts timestamptz;
  v_agendamentos_hoje integer := 0;
  v_confirmados_hoje integer := 0;
  v_concluidos_hoje integer := 0;
  v_faturamento_hoje numeric := 0;
  v_faturamento_ontem numeric := 0;
  v_clientes_ativos integer := 0;
  v_clientes_novos integer := 0;
  v_clientes_novos_anterior integer := 0;
  v_capacidade_minutos integer := 0;
  v_ocupados_minutos integer := 0;
  v_agenda jsonb := '[]'::jsonb;
  v_faturamento_serie jsonb := '[]'::jsonb;
  v_servicos jsonb := '[]'::jsonb;
  v_funcionarios jsonb := '[]'::jsonb;
  v_estoque jsonb := '[]'::jsonb;
  v_contas jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or not private.usuario_pertence_empresa(p_id_empresa) then
    raise exception 'Você não possui acesso a esta empresa.';
  end if;

  if not private.plano_tem_funcionalidade_empresa(p_id_empresa, 'dashboard_basico') then
    raise exception 'O dashboard não está disponível no plano atual.';
  end if;

  select
    coalesce(nullif(e.fuso_horario, ''), 'America/Sao_Paulo'),
    ue.tipo,
    f.id
  into v_fuso, v_tipo, v_funcionario_id
  from public.usuarios_empresas ue
  join public.empresas e on e.id = ue.empresa_id
  left join public.funcionarios f
    on f.id_empresa = ue.empresa_id
   and f.usuario_empresa_id = ue.id
   and f.ativo
  where ue.empresa_id = p_id_empresa
    and ue.user_id = auth.uid()
    and ue.status = 'ativo'::public.status_usuario_empresa
  order by f.id nulls last
  limit 1;

  if not found then
    raise exception 'Vínculo ativo com a empresa não encontrado.';
  end if;

  v_escopo_pessoal := v_tipo = 'profissional'::public.tipos_usuarios;
  v_pode_financeiro := v_tipo in (
    'dono'::public.tipos_usuarios,
    'gerente'::public.tipos_usuarios
  ) and (
    private.plano_tem_funcionalidade_empresa(p_id_empresa, 'relatorios_financeiros_basicos')
    or private.plano_tem_funcionalidade_empresa(p_id_empresa, 'relatorios_dashboards_avancados')
  );
  v_pode_avancado := v_tipo in (
    'dono'::public.tipos_usuarios,
    'gerente'::public.tipos_usuarios
  ) and private.plano_tem_funcionalidade_empresa(
    p_id_empresa,
    'relatorios_dashboards_avancados'
  );
  v_pode_estoque := v_tipo <> 'profissional'::public.tipos_usuarios
    and private.plano_tem_funcionalidade_empresa(p_id_empresa, 'estoque');
  v_pode_contas := v_pode_financeiro
    and private.plano_tem_funcionalidade_empresa(p_id_empresa, 'contas_pagar_receber');

  v_dias := greatest(7, least(coalesce(p_dias_periodo, 30), 365));
  v_inicio_periodo := v_data - (v_dias - 1);
  v_inicio_dia := v_data::timestamp at time zone v_fuso;
  v_fim_dia := (v_data + 1)::timestamp at time zone v_fuso;
  v_inicio_periodo_ts := v_inicio_periodo::timestamp at time zone v_fuso;
  v_fim_periodo_ts := (v_data + 1)::timestamp at time zone v_fuso;
  v_inicio_periodo_anterior_ts := (v_inicio_periodo - v_dias)::timestamp at time zone v_fuso;

  select
    count(*)::integer,
    count(*) filter (where a.status = 'confirmado')::integer,
    count(*) filter (where a.status = 'finalizado')::integer
  into v_agendamentos_hoje, v_confirmados_hoje, v_concluidos_hoje
  from public.agendamentos a
  where a.id_empresa = p_id_empresa
    and a.status <> 'cancelado'
    and a.inicio < v_fim_dia
    and a.fim > v_inicio_dia
    and (
      not v_escopo_pessoal
      or (
        v_funcionario_id is not null
        and exists (
          select 1
          from public.agendamentos_servicos ags
          where ags.id_empresa = a.id_empresa
            and ags.id_agendamento = a.id
            and ags.id_funcionario = v_funcionario_id
            and ags.status <> 'cancelado'
        )
      )
    );

  if v_pode_financeiro then
    select
      coalesce(sum(c.valor_total) filter (
        where c.fechada_em >= v_inicio_dia
          and c.fechada_em < v_fim_dia
      ), 0),
      coalesce(sum(c.valor_total) filter (
        where c.fechada_em >= v_inicio_dia - interval '1 day'
          and c.fechada_em < v_inicio_dia
      ), 0)
    into v_faturamento_hoje, v_faturamento_ontem
    from public.comandas c
    where c.id_empresa = p_id_empresa
      and c.status = 'fechada'
      and c.fechada_em >= v_inicio_dia - interval '1 day'
      and c.fechada_em < v_fim_dia;
  end if;

  select count(*)::integer
  into v_clientes_ativos
  from public.clientes c
  where c.id_empresa = p_id_empresa and c.ativo;

  select
    count(*) filter (
      where c.created_at >= v_inicio_periodo_ts
        and c.created_at < v_fim_periodo_ts
    )::integer,
    count(*) filter (
      where c.created_at >= v_inicio_periodo_anterior_ts
        and c.created_at < v_inicio_periodo_ts
    )::integer
  into v_clientes_novos, v_clientes_novos_anterior
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and c.created_at >= v_inicio_periodo_anterior_ts
    and c.created_at < v_fim_periodo_ts;

  with slots as (
    select distinct h.id_funcionario, slot.inicio
    from public.funcionarios_horarios h
    join public.funcionarios f
      on f.id_empresa = h.id_empresa
     and f.id = h.id_funcionario
     and f.ativo
     and f.atende_clientes
    cross join lateral generate_series(
      v_inicio_dia,
      v_fim_dia - interval '5 minutes',
      interval '5 minutes'
    ) slot(inicio)
    where h.id_empresa = p_id_empresa
      and h.ativo
      and h.dia_semana = extract(dow from v_data)::smallint
      and (not v_escopo_pessoal or h.id_funcionario = v_funcionario_id)
      and (slot.inicio at time zone v_fuso)::time >= h.hora_inicio
      and ((slot.inicio + interval '5 minutes') at time zone v_fuso)::time <= h.hora_fim
      and not (
        h.intervalo_inicio is not null
        and h.intervalo_fim is not null
        and (slot.inicio at time zone v_fuso)::time < h.intervalo_fim
        and ((slot.inicio + interval '5 minutes') at time zone v_fuso)::time > h.intervalo_inicio
      )
      and not exists (
        select 1
        from public.funcionarios_ausencias fa
        where fa.id_empresa = h.id_empresa
          and fa.id_funcionario = h.id_funcionario
          and fa.status = 'aprovado'
          and tstzrange(fa.inicio, fa.fim, '[)')
            && tstzrange(slot.inicio, slot.inicio + interval '5 minutes', '[)')
      )
      and not exists (
        select 1
        from public.bloqueios_agenda ba
        where ba.id_empresa = h.id_empresa
          and (ba.id_funcionario is null or ba.id_funcionario = h.id_funcionario)
          and ba.status = 'ativo'
          and tstzrange(ba.inicio, ba.fim, '[)')
            && tstzrange(slot.inicio, slot.inicio + interval '5 minutes', '[)')
      )
  ), ocupacao as (
    select
      count(*)::integer * 5 as capacidade,
      count(*) filter (
        where exists (
          select 1
          from public.agendamentos_servicos ags
          join public.agendamentos a
            on a.id_empresa = ags.id_empresa
           and a.id = ags.id_agendamento
          where ags.id_empresa = p_id_empresa
            and ags.id_funcionario = slots.id_funcionario
            and ags.status <> 'cancelado'
            and a.status not in ('cancelado', 'no_show')
            and tstzrange(ags.inicio, ags.fim, '[)')
              && tstzrange(slots.inicio, slots.inicio + interval '5 minutes', '[)')
        )
      )::integer * 5 as ocupados
    from slots
  )
  select coalesce(capacidade, 0), coalesce(ocupados, 0)
  into v_capacidade_minutos, v_ocupados_minutos
  from ocupacao;

  select coalesce(jsonb_agg(to_jsonb(agenda_item) order by agenda_item.inicio), '[]'::jsonb)
  into v_agenda
  from (
    select
      a.id,
      a.inicio,
      a.fim,
      a.status,
      c.id as cliente_id,
      c.nome as cliente_nome,
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', ags.id,
            'nome', s.nome,
            'profissional', f.nome,
            'cor', f.cor_agenda,
            'inicio', ags.inicio,
            'fim', ags.fim
          ) order by ags.inicio, ags.ordem
        )
        from public.agendamentos_servicos ags
        join public.servicos s
          on s.id_empresa = ags.id_empresa and s.id = ags.id_servico
        join public.funcionarios f
          on f.id_empresa = ags.id_empresa and f.id = ags.id_funcionario
        where ags.id_empresa = a.id_empresa
          and ags.id_agendamento = a.id
          and ags.status <> 'cancelado'
          and (not v_escopo_pessoal or ags.id_funcionario = v_funcionario_id)
      ), '[]'::jsonb) as servicos
    from public.agendamentos a
    join public.clientes c
      on c.id_empresa = a.id_empresa and c.id = a.id_cliente
    where a.id_empresa = p_id_empresa
      and a.status <> 'cancelado'
      and a.inicio < v_fim_dia
      and a.fim > v_inicio_dia
      and (
        not v_escopo_pessoal
        or (
          v_funcionario_id is not null
          and exists (
            select 1
            from public.agendamentos_servicos escopo
            where escopo.id_empresa = a.id_empresa
              and escopo.id_agendamento = a.id
              and escopo.id_funcionario = v_funcionario_id
              and escopo.status <> 'cancelado'
          )
        )
      )
    order by a.inicio
    limit 8
  ) agenda_item;

  if v_pode_financeiro then
    select coalesce(jsonb_agg(to_jsonb(serie) order by serie.data), '[]'::jsonb)
    into v_faturamento_serie
    from (
      select
        (v_inicio_periodo + dia.deslocamento)::date as data,
        coalesce(sum(c.valor_total), 0) as valor
      from generate_series(0, v_dias - 1) dia(deslocamento)
      left join public.comandas c
        on c.id_empresa = p_id_empresa
       and c.status = 'fechada'
       and (c.fechada_em at time zone v_fuso)::date = (v_inicio_periodo + dia.deslocamento)::date
      group by dia.deslocamento
      order by dia.deslocamento
    ) serie;
  end if;

  if v_pode_avancado then
    select coalesce(jsonb_agg(to_jsonb(ranking) order by ranking.faturamento desc, ranking.quantidade desc), '[]'::jsonb)
    into v_servicos
    from (
      select
        ci.id_servico as id,
        coalesce(s.nome, ci.descricao_snapshot) as nome,
        sum(ci.quantidade)::numeric as quantidade,
        coalesce(sum(ci.valor_total), 0)::numeric as faturamento
      from public.comandas c
      join public.comandas_itens ci
        on ci.id_empresa = c.id_empresa and ci.id_comanda = c.id
      left join public.servicos s
        on s.id_empresa = ci.id_empresa and s.id = ci.id_servico
      where c.id_empresa = p_id_empresa
        and c.status = 'fechada'
        and c.fechada_em >= v_inicio_periodo_ts
        and c.fechada_em < v_fim_periodo_ts
        and ci.tipo_item = 'servico'
      group by ci.id_servico, coalesce(s.nome, ci.descricao_snapshot)
      order by faturamento desc, quantidade desc
      limit 5
    ) ranking;

    select coalesce(jsonb_agg(to_jsonb(desempenho) order by desempenho.faturamento desc, desempenho.servicos desc), '[]'::jsonb)
    into v_funcionarios
    from (
      select
        f.id,
        f.nome,
        f.cargo,
        f.cor_agenda as cor,
        count(distinct c.id)::integer as atendimentos,
        sum(ci.quantidade)::numeric as servicos,
        coalesce(sum(ci.valor_total), 0)::numeric as faturamento,
        case
          when count(distinct c.id) = 0 then 0
          else round(coalesce(sum(ci.valor_total), 0) / count(distinct c.id), 2)
        end as ticket_medio
      from public.comandas c
      join public.comandas_itens ci
        on ci.id_empresa = c.id_empresa and ci.id_comanda = c.id
      join public.funcionarios f
        on f.id_empresa = ci.id_empresa and f.id = ci.id_funcionario
      where c.id_empresa = p_id_empresa
        and c.status = 'fechada'
        and c.fechada_em >= v_inicio_periodo_ts
        and c.fechada_em < v_fim_periodo_ts
        and ci.tipo_item = 'servico'
        and ci.id_funcionario is not null
      group by f.id, f.nome, f.cargo, f.cor_agenda
      order by faturamento desc, servicos desc
      limit 6
    ) desempenho;
  end if;

  if v_pode_estoque then
    select coalesce(jsonb_agg(to_jsonb(alerta) order by alerta.criticidade desc, alerta.nome), '[]'::jsonb)
    into v_estoque
    from (
      select
        p.id,
        p.nome,
        p.codigo,
        p.estoque_atual,
        p.estoque_minimo,
        p.unidade_medida,
        case
          when p.estoque_atual <= 0 then 2
          else 1
        end as criticidade
      from public.produtos p
      where p.id_empresa = p_id_empresa
        and p.ativo
        and p.controla_estoque
        and p.estoque_atual <= p.estoque_minimo
      order by criticidade desc, p.estoque_atual, p.nome
      limit 6
    ) alerta;
  end if;

  if v_pode_contas then
    select coalesce(jsonb_agg(to_jsonb(vencimento) order by vencimento.data_vencimento, vencimento.id), '[]'::jsonb)
    into v_contas
    from (
      select
        cp.id,
        c.id as conta_id,
        c.tipo,
        c.descricao,
        cp.numero_parcela,
        cp.data_vencimento,
        greatest(cp.valor_parcela - cp.valor_pago, 0)::numeric as saldo,
        cp.status,
        coalesce(cl.nome, nullif(fr.nome_fantasia, ''), fr.nome) as contraparte
      from public.contas_parcelas cp
      join public.contas c
        on c.id_empresa = cp.id_empresa and c.id = cp.id_conta
      left join public.clientes cl
        on cl.id_empresa = c.id_empresa and cl.id = c.id_cliente
      left join public.fornecedores fr
        on fr.id_empresa = c.id_empresa and fr.id = c.id_fornecedor
      where cp.id_empresa = p_id_empresa
        and c.status <> 'cancelada'
        and cp.status not in ('paga', 'cancelada')
        and greatest(cp.valor_parcela - cp.valor_pago, 0) > 0
        and cp.data_vencimento between v_data - 30 and v_data + 7
      order by cp.data_vencimento, cp.id
      limit 8
    ) vencimento;
  end if;

  return jsonb_build_object(
    'meta', jsonb_build_object(
      'data_referencia', v_data,
      'inicio_periodo', v_inicio_periodo,
      'dias_periodo', v_dias,
      'fuso_horario', v_fuso,
      'escopo_pessoal', v_escopo_pessoal,
      'pode_ver_financeiro', v_pode_financeiro,
      'relatorios_avancados', v_pode_avancado,
      'pode_ver_estoque', v_pode_estoque,
      'pode_ver_contas', v_pode_contas
    ),
    'indicadores', jsonb_build_object(
      'agendamentos_hoje', v_agendamentos_hoje,
      'confirmados_hoje', v_confirmados_hoje,
      'concluidos_hoje', v_concluidos_hoje,
      'faturamento_hoje', v_faturamento_hoje,
      'faturamento_ontem', v_faturamento_ontem,
      'variacao_faturamento', case
        when v_faturamento_ontem > 0
          then round(((v_faturamento_hoje - v_faturamento_ontem) / v_faturamento_ontem) * 100, 1)
        when v_faturamento_hoje > 0 then 100
        else 0
      end,
      'clientes_ativos', v_clientes_ativos,
      'clientes_novos', v_clientes_novos,
      'clientes_novos_anterior', v_clientes_novos_anterior,
      'variacao_clientes', case
        when v_clientes_novos_anterior > 0
          then round(((v_clientes_novos - v_clientes_novos_anterior)::numeric / v_clientes_novos_anterior) * 100, 1)
        when v_clientes_novos > 0 then 100
        else 0
      end,
      'capacidade_minutos', v_capacidade_minutos,
      'ocupados_minutos', v_ocupados_minutos,
      'taxa_ocupacao', case
        when v_capacidade_minutos > 0
          then round(least(100, v_ocupados_minutos::numeric / v_capacidade_minutos * 100), 1)
        else 0
      end
    ),
    'agenda', v_agenda,
    'faturamento_serie', v_faturamento_serie,
    'servicos_mais_vendidos', v_servicos,
    'desempenho_funcionarios', v_funcionarios,
    'estoque_baixo', v_estoque,
    'contas_vencimento', v_contas
  );
end;
$$;

revoke all on function public.obter_dashboard_empresa(bigint, date, integer) from public, anon;
grant execute on function public.obter_dashboard_empresa(bigint, date, integer) to authenticated;

comment on function public.obter_dashboard_empresa(bigint, date, integer)
is 'Consolida indicadores, agenda e relatórios do dashboard com escopo por empresa, plano, cargo e fuso horário.';
