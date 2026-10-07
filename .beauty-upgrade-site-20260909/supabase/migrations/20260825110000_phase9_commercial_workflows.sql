-- Fase 9: fluxos atomicos de orcamentos e comandas.

create unique index if not exists contas_empresa_comanda_unique
  on public.contas (id_empresa, id_comanda)
  where id_comanda is not null;
create unique index if not exists comandas_itens_orcamento_item_unique
  on public.comandas_itens (id_comanda, id_orcamento_item)
  where id_orcamento_item is not null;
create or replace function private.preparar_orcamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subtotal numeric(14,2);
  v_desconto_itens numeric(14,2);
begin
  if tg_op = 'UPDATE' then
    if new.id_empresa is distinct from old.id_empresa then
      raise exception 'A empresa do orçamento não pode ser alterada.';
    end if;

    if old.status in ('recusado','expirado','convertido','cancelado')
       and (to_jsonb(new) - array['updated_at'])
           is distinct from
           (to_jsonb(old) - array['updated_at']) then
      raise exception 'Orçamento finalizado não pode ser alterado.';
    end if;

    if new.status is distinct from old.status and not (
      (old.status = 'rascunho' and new.status in ('enviado','cancelado','expirado'))
      or (old.status = 'enviado' and new.status in ('aprovado','recusado','cancelado','expirado'))
      or (old.status = 'aprovado' and new.status in ('convertido','cancelado'))
    ) then
      raise exception 'Transição de status inválida para o orçamento.';
    end if;
  end if;

  if not exists (
    select 1 from public.clientes c
    where c.id = new.id_cliente
      and c.id_empresa = new.id_empresa
  ) then
    raise exception 'Cliente inválido ou pertencente a outra empresa.';
  end if;

  select
    coalesce(sum(i.quantidade * i.valor_unitario_snapshot), 0),
    coalesce(sum(i.desconto), 0)
  into v_subtotal, v_desconto_itens
  from public.orcamentos_itens i
  where i.id_orcamento = new.id;

  new.subtotal := v_subtotal;
  new.desconto_itens := v_desconto_itens;

  if new.status = 'enviado' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.enviado_em := coalesce(new.enviado_em, now());
  elsif new.status = 'aprovado' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.aprovado_em := coalesce(new.aprovado_em, now());
  elsif new.status = 'recusado' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.recusado_em := coalesce(new.recusado_em, now());
  elsif new.status = 'convertido' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.convertido_em := coalesce(new.convertido_em, now());
  elsif new.status = 'cancelado' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.cancelado_em := coalesce(new.cancelado_em, now());
  end if;

  new.updated_at := now();
  return new;
end;
$$;
create or replace function private.preparar_comanda()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subtotal numeric(14,2);
  v_desconto_itens numeric(14,2);
begin
  if tg_op = 'UPDATE' then
    if new.id_empresa is distinct from old.id_empresa then
      raise exception 'A empresa da comanda não pode ser alterada.';
    end if;
    if old.status = 'cancelada'
       and (to_jsonb(new) - array['updated_at'])
           is distinct from
           (to_jsonb(old) - array['updated_at']) then
      raise exception 'Comanda cancelada não pode ser alterada.';
    end if;
    if old.status = 'fechada' and new.status is distinct from 'cancelada'
       and (to_jsonb(new) - array['updated_at'])
           is distinct from
           (to_jsonb(old) - array['updated_at']) then
      raise exception 'Comanda fechada não pode ter seus dados comerciais alterados.';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'aberta' and new.status in ('fechada','cancelada'))
      or (old.status = 'fechada' and new.status = 'cancelada')
    ) then
      raise exception 'Transição de status inválida para a comanda.';
    end if;
  end if;

  if not exists (
    select 1 from public.clientes c
    where c.id = new.id_cliente
      and c.id_empresa = new.id_empresa
  ) then
    raise exception 'Cliente inválido ou pertencente a outra empresa.';
  end if;

  if new.id_funcionario_responsavel is not null and not exists (
    select 1 from public.funcionarios f
    where f.id = new.id_funcionario_responsavel
      and f.id_empresa = new.id_empresa
      and f.ativo
  ) then
    raise exception 'Funcionário responsável inválido ou inativo.';
  end if;

  if new.id_agendamento is not null and not exists (
    select 1 from public.agendamentos a
    where a.id = new.id_agendamento
      and a.id_empresa = new.id_empresa
      and a.id_cliente = new.id_cliente
  ) then
    raise exception 'O agendamento não pertence ao cliente e à empresa informados.';
  end if;

  if new.id_orcamento is not null and not exists (
    select 1 from public.orcamentos o
    where o.id = new.id_orcamento
      and o.id_empresa = new.id_empresa
      and o.id_cliente = new.id_cliente
  ) then
    raise exception 'O orçamento não pertence ao cliente e à empresa informados.';
  end if;

  select
    coalesce(sum(i.quantidade * i.valor_unitario_snapshot), 0),
    coalesce(sum(i.desconto), 0)
  into v_subtotal, v_desconto_itens
  from public.comandas_itens i
  where i.id_comanda = new.id;

  new.subtotal := v_subtotal;
  new.desconto_itens := v_desconto_itens;

  if new.status = 'fechada' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.fechada_em := coalesce(new.fechada_em, now());
  elsif new.status = 'cancelada' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.cancelada_em := coalesce(new.cancelada_em, now());
    if nullif(btrim(new.motivo_cancelamento), '') is null then
      raise exception 'Informe o motivo do cancelamento da comanda.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;
create or replace function public.salvar_orcamento(
  p_orcamento_id bigint,
  p_id_empresa bigint,
  p_id_cliente bigint,
  p_validade date,
  p_desconto numeric,
  p_acrescimo numeric,
  p_observacoes text,
  p_itens jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_status text;
  v_item jsonb;
  v_tipo text;
  v_servico_id bigint;
  v_produto_id bigint;
  v_descricao text;
  v_quantidade numeric;
  v_valor numeric;
  v_desconto numeric;
  v_ordem integer := 0;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para gerenciar orçamentos.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos um item ao orçamento.';
  end if;
  if coalesce(p_desconto, 0) < 0 or coalesce(p_acrescimo, 0) < 0 then
    raise exception 'Desconto e acréscimo não podem ser negativos.';
  end if;
  if not exists (
    select 1 from public.clientes c
    where c.id = p_id_cliente and c.id_empresa = p_id_empresa and c.ativo
  ) then
    raise exception 'Cliente inválido, inativo ou pertencente a outra empresa.';
  end if;

  if p_orcamento_id is null then
    insert into public.orcamentos (
      id_empresa,id_cliente,status,validade,observacoes,
      subtotal,desconto_itens,desconto,acrescimo,criado_por
    ) values (
      p_id_empresa,p_id_cliente,'rascunho',p_validade,nullif(btrim(p_observacoes),''),
      0,0,0,0,auth.uid()
    ) returning id into v_id;
  else
    select o.status into v_status
    from public.orcamentos o
    where o.id = p_orcamento_id and o.id_empresa = p_id_empresa
    for update;

    if not found then raise exception 'Orçamento não encontrado.'; end if;
    if v_status not in ('rascunho','enviado') then
      raise exception 'Somente orçamentos em rascunho ou enviados podem ser editados.';
    end if;

    v_id := p_orcamento_id;
    update public.orcamentos
       set id_cliente = p_id_cliente,
           validade = p_validade,
           observacoes = nullif(btrim(p_observacoes),''),
           desconto = 0,
           acrescimo = 0
     where id = v_id and id_empresa = p_id_empresa;
    delete from public.orcamentos_itens
     where id_orcamento = v_id and id_empresa = p_id_empresa;
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_ordem := v_ordem + 1;
    v_tipo := v_item->>'tipo_item';
    v_servico_id := nullif(v_item->>'id_servico','')::bigint;
    v_produto_id := nullif(v_item->>'id_produto','')::bigint;
    v_descricao := nullif(btrim(v_item->>'descricao'), '');
    v_quantidade := nullif(v_item->>'quantidade','')::numeric;
    v_valor := nullif(v_item->>'valor_unitario','')::numeric;
    v_desconto := coalesce(nullif(v_item->>'desconto','')::numeric, 0);

    if v_tipo not in ('servico','produto','outro')
       or coalesce(v_quantidade, 0) <= 0
       or coalesce(v_valor, -1) < 0
       or v_desconto < 0
       or v_desconto > v_quantidade * v_valor then
      raise exception 'Revise o tipo, quantidade, preço e desconto dos itens.';
    end if;
    if v_tipo = 'servico' and (v_servico_id is null or v_produto_id is not null) then
      raise exception 'Selecione um serviço válido.';
    elsif v_tipo = 'produto' and (v_produto_id is null or v_servico_id is not null) then
      raise exception 'Selecione um produto válido.';
    elsif v_tipo = 'outro' and (v_servico_id is not null or v_produto_id is not null or v_descricao is null) then
      raise exception 'Itens avulsos exigem descrição.';
    end if;

    insert into public.orcamentos_itens (
      id_empresa,id_orcamento,tipo_item,id_servico,id_produto,
      descricao_snapshot,quantidade,valor_unitario_snapshot,
      desconto,ordem,observacoes
    ) values (
      p_id_empresa,v_id,v_tipo,v_servico_id,v_produto_id,
      v_descricao,v_quantidade,v_valor,
      v_desconto,v_ordem,nullif(btrim(v_item->>'observacoes'),'')
    );
  end loop;

  update public.orcamentos
     set desconto = coalesce(p_desconto,0),
         acrescimo = coalesce(p_acrescimo,0)
   where id = v_id and id_empresa = p_id_empresa;

  return v_id;
end;
$$;
create or replace function public.alterar_status_orcamento(
  p_orcamento_id bigint,
  p_id_empresa bigint,
  p_status text,
  p_observacao text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_validade date;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para alterar o orçamento.';
  end if;

  select o.status,o.validade into v_status,v_validade
  from public.orcamentos o
  where o.id = p_orcamento_id and o.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Orçamento não encontrado.'; end if;

  if p_status in ('enviado','aprovado') and not exists (
    select 1 from public.orcamentos_itens i where i.id_orcamento = p_orcamento_id
  ) then
    raise exception 'O orçamento precisa ter pelo menos um item.';
  end if;
  if p_status in ('enviado','aprovado') and v_validade is not null and v_validade < current_date then
    raise exception 'O orçamento está vencido. Atualize a validade antes de continuar.';
  end if;
  if p_status = 'expirado' and (v_validade is null or v_validade >= current_date) then
    raise exception 'O orçamento ainda não está vencido.';
  end if;

  update public.orcamentos
     set status = p_status,
         observacoes = case
           when nullif(btrim(p_observacao),'') is null then observacoes
           when observacoes is null then btrim(p_observacao)
           else observacoes || E'\n' || btrim(p_observacao)
         end
   where id = p_orcamento_id and id_empresa = p_id_empresa;

  return p_status;
end;
$$;
create or replace function public.converter_orcamento_em_comanda(
  p_orcamento_id bigint,
  p_id_empresa bigint,
  p_id_funcionario_responsavel bigint,
  p_funcionarios_servicos jsonb,
  p_observacoes text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_orcamento record;
  v_comanda_id bigint;
  v_item record;
  v_funcionario_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para converter o orçamento.';
  end if;

  select o.* into v_orcamento
  from public.orcamentos o
  where o.id = p_orcamento_id and o.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Orçamento não encontrado.'; end if;

  if v_orcamento.status = 'convertido' then
    select c.id into v_comanda_id
    from public.comandas c
    where c.id_empresa = p_id_empresa and c.id_orcamento = p_orcamento_id;
    if v_comanda_id is not null then return v_comanda_id; end if;
  end if;
  if v_orcamento.status <> 'aprovado' then
    raise exception 'Apenas orçamentos aprovados podem ser convertidos.';
  end if;
  if v_orcamento.validade is not null and v_orcamento.validade < current_date then
    raise exception 'O orçamento aprovado está vencido.';
  end if;

  insert into public.comandas (
    id_empresa,id_cliente,id_orcamento,id_funcionario_responsavel,
    status,observacoes,subtotal,desconto_itens,desconto,acrescimo,criado_por
  ) values (
    p_id_empresa,v_orcamento.id_cliente,p_orcamento_id,p_id_funcionario_responsavel,
    'aberta',coalesce(nullif(btrim(p_observacoes),''),v_orcamento.observacoes),
    0,0,0,0,auth.uid()
  ) returning id into v_comanda_id;

  for v_item in
    select i.* from public.orcamentos_itens i
    where i.id_orcamento = p_orcamento_id
    order by i.ordem,i.id
  loop
    v_funcionario_id := case
      when v_item.tipo_item = 'servico'
        then nullif(p_funcionarios_servicos ->> v_item.id::text,'')::bigint
      else null
    end;
    if v_item.tipo_item = 'servico' and v_funcionario_id is null then
      raise exception 'Selecione o profissional de todos os serviços.';
    end if;

    insert into public.comandas_itens (
      id_empresa,id_comanda,id_orcamento_item,tipo_item,id_servico,id_produto,
      id_funcionario,descricao_snapshot,quantidade,valor_unitario_snapshot,
      desconto,ordem,observacoes
    ) values (
      p_id_empresa,v_comanda_id,v_item.id,v_item.tipo_item,v_item.id_servico,v_item.id_produto,
      v_funcionario_id,v_item.descricao_snapshot,v_item.quantidade,v_item.valor_unitario_snapshot,
      v_item.desconto,v_item.ordem,v_item.observacoes
    );
  end loop;

  update public.comandas
     set desconto = v_orcamento.desconto,
         acrescimo = v_orcamento.acrescimo
   where id = v_comanda_id and id_empresa = p_id_empresa;

  update public.orcamentos
     set status = 'convertido'
   where id = p_orcamento_id and id_empresa = p_id_empresa;

  return v_comanda_id;
end;
$$;
create or replace function public.salvar_comanda(
  p_comanda_id bigint,
  p_id_empresa bigint,
  p_id_cliente bigint,
  p_id_funcionario_responsavel bigint,
  p_desconto numeric,
  p_acrescimo numeric,
  p_observacoes text,
  p_itens jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_status text;
  v_item jsonb;
  v_tipo text;
  v_servico_id bigint;
  v_produto_id bigint;
  v_funcionario_id bigint;
  v_descricao text;
  v_quantidade numeric;
  v_valor numeric;
  v_desconto numeric;
  v_ordem integer := 0;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para gerenciar comandas.';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos um item à comanda.';
  end if;
  if coalesce(p_desconto,0) < 0 or coalesce(p_acrescimo,0) < 0 then
    raise exception 'Desconto e acréscimo não podem ser negativos.';
  end if;
  if not exists (
    select 1 from public.clientes c
    where c.id = p_id_cliente and c.id_empresa = p_id_empresa and c.ativo
  ) then
    raise exception 'Cliente inválido, inativo ou pertencente a outra empresa.';
  end if;

  if p_comanda_id is null then
    insert into public.comandas (
      id_empresa,id_cliente,id_funcionario_responsavel,status,observacoes,
      subtotal,desconto_itens,desconto,acrescimo,criado_por
    ) values (
      p_id_empresa,p_id_cliente,p_id_funcionario_responsavel,'aberta',
      nullif(btrim(p_observacoes),''),0,0,0,0,auth.uid()
    ) returning id into v_id;
  else
    select c.status into v_status
    from public.comandas c
    where c.id = p_comanda_id and c.id_empresa = p_id_empresa
    for update;
    if not found then raise exception 'Comanda não encontrada.'; end if;
    if v_status <> 'aberta' then raise exception 'Somente comandas abertas podem ser editadas.'; end if;

    v_id := p_comanda_id;
    update public.comandas
       set id_cliente = p_id_cliente,
           id_funcionario_responsavel = p_id_funcionario_responsavel,
           observacoes = nullif(btrim(p_observacoes),''),
           desconto = 0,
           acrescimo = 0
     where id = v_id and id_empresa = p_id_empresa;
    delete from public.comandas_itens
     where id_comanda = v_id and id_empresa = p_id_empresa;
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_ordem := v_ordem + 1;
    v_tipo := v_item->>'tipo_item';
    v_servico_id := nullif(v_item->>'id_servico','')::bigint;
    v_produto_id := nullif(v_item->>'id_produto','')::bigint;
    v_funcionario_id := nullif(v_item->>'id_funcionario','')::bigint;
    v_descricao := nullif(btrim(v_item->>'descricao'),'');
    v_quantidade := nullif(v_item->>'quantidade','')::numeric;
    v_valor := nullif(v_item->>'valor_unitario','')::numeric;
    v_desconto := coalesce(nullif(v_item->>'desconto','')::numeric,0);

    if v_tipo not in ('servico','produto','outro')
       or coalesce(v_quantidade,0) <= 0
       or coalesce(v_valor,-1) < 0
       or v_desconto < 0
       or v_desconto > v_quantidade * v_valor then
      raise exception 'Revise o tipo, quantidade, preço e desconto dos itens.';
    end if;
    if v_tipo = 'servico' and (v_servico_id is null or v_produto_id is not null or v_funcionario_id is null) then
      raise exception 'Serviços exigem catálogo e profissional.';
    elsif v_tipo = 'produto' and (v_produto_id is null or v_servico_id is not null) then
      raise exception 'Selecione um produto válido.';
    elsif v_tipo = 'outro' and (v_servico_id is not null or v_produto_id is not null or v_descricao is null) then
      raise exception 'Itens avulsos exigem descrição.';
    end if;

    insert into public.comandas_itens (
      id_empresa,id_comanda,tipo_item,id_servico,id_produto,id_funcionario,
      descricao_snapshot,quantidade,valor_unitario_snapshot,desconto,ordem,observacoes
    ) values (
      p_id_empresa,v_id,v_tipo,v_servico_id,v_produto_id,v_funcionario_id,
      v_descricao,v_quantidade,v_valor,v_desconto,v_ordem,
      nullif(btrim(v_item->>'observacoes'),'')
    );
  end loop;

  update public.comandas
     set desconto = coalesce(p_desconto,0),
         acrescimo = coalesce(p_acrescimo,0)
   where id = v_id and id_empresa = p_id_empresa;

  return v_id;
end;
$$;
create or replace function public.fechar_comanda(
  p_comanda_id bigint,
  p_id_empresa bigint,
  p_data_vencimento date default current_date
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comanda record;
  v_conta_id bigint;
  v_falta record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para fechar comandas.';
  end if;

  select c.* into v_comanda
  from public.comandas c
  where c.id = p_comanda_id and c.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Comanda não encontrada.'; end if;
  if v_comanda.status <> 'aberta' then raise exception 'Apenas comandas abertas podem ser fechadas.'; end if;
  if not exists (select 1 from public.comandas_itens i where i.id_comanda = p_comanda_id) then
    raise exception 'Adicione pelo menos um item antes de fechar a comanda.';
  end if;

  select p.nome,
         p.estoque_atual,
         sum(i.quantidade) as necessario
    into v_falta
  from public.comandas_itens i
  join public.produtos p on p.id = i.id_produto and p.id_empresa = i.id_empresa
  where i.id_comanda = p_comanda_id
    and i.tipo_item = 'produto'
    and p.controla_estoque
  group by p.id,p.nome,p.estoque_atual
  having p.estoque_atual < sum(i.quantidade)
  limit 1;
  if found then
    raise exception 'Estoque insuficiente para %. Disponível: %, necessário: %.',
      v_falta.nome,v_falta.estoque_atual,v_falta.necessario;
  end if;

  update public.comandas
     set status = 'fechada'
   where id = p_comanda_id and id_empresa = p_id_empresa;

  select c.* into v_comanda
  from public.comandas c
  where c.id = p_comanda_id and c.id_empresa = p_id_empresa;

  if coalesce(v_comanda.valor_total,0) > 0 then
    insert into public.contas (
      id_empresa,tipo,id_cliente,id_comanda,descricao,data_emissao,
      competencia,valor_total,valor_pago,status,criado_por
    ) values (
      p_id_empresa,'receber',v_comanda.id_cliente,p_comanda_id,
      'Comanda #' || p_comanda_id,current_date,current_date,
      v_comanda.valor_total,0,'aberta',auth.uid()
    ) returning id into v_conta_id;

    insert into public.contas_parcelas (
      id_empresa,id_conta,numero_parcela,data_vencimento,
      valor_parcela,valor_pago,status
    ) values (
      p_id_empresa,v_conta_id,1,coalesce(p_data_vencimento,current_date),
      v_comanda.valor_total,0,'aberta'
    );
  end if;

  return v_conta_id;
end;
$$;
create or replace function public.cancelar_comanda(
  p_comanda_id bigint,
  p_id_empresa bigint,
  p_motivo text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_conta_id bigint;
  v_valor_pago numeric;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para cancelar comandas.';
  end if;
  if nullif(btrim(p_motivo),'') is null then
    raise exception 'Informe o motivo do cancelamento.';
  end if;

  select c.status into v_status
  from public.comandas c
  where c.id = p_comanda_id and c.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Comanda não encontrada.'; end if;
  if v_status not in ('aberta','fechada') then raise exception 'Esta comanda não pode ser cancelada.'; end if;

  select c.id,c.valor_pago into v_conta_id,v_valor_pago
  from public.contas c
  where c.id_empresa = p_id_empresa and c.id_comanda = p_comanda_id;
  if coalesce(v_valor_pago,0) > 0 then
    raise exception 'A comanda possui pagamentos. Estorne-os antes de cancelar.';
  end if;

  update public.comandas
     set status = 'cancelada', motivo_cancelamento = btrim(p_motivo)
   where id = p_comanda_id and id_empresa = p_id_empresa;

  if v_conta_id is not null then
    update public.contas_parcelas
       set status = 'cancelada', observacoes = coalesce(observacoes || E'\n','') || 'Cancelada com a comanda: ' || btrim(p_motivo)
     where id_conta = v_conta_id and id_empresa = p_id_empresa and status <> 'cancelada';
    update public.contas
       set status = 'cancelada', cancelada_em = now(), motivo_cancelamento = btrim(p_motivo)
     where id = v_conta_id and id_empresa = p_id_empresa;
  end if;

  return 'cancelada';
end;
$$;
revoke all on function public.salvar_orcamento(bigint,bigint,bigint,date,numeric,numeric,text,jsonb) from public;
grant execute on function public.salvar_orcamento(bigint,bigint,bigint,date,numeric,numeric,text,jsonb) to authenticated;
revoke all on function public.alterar_status_orcamento(bigint,bigint,text,text) from public;
grant execute on function public.alterar_status_orcamento(bigint,bigint,text,text) to authenticated;
revoke all on function public.converter_orcamento_em_comanda(bigint,bigint,bigint,jsonb,text) from public;
grant execute on function public.converter_orcamento_em_comanda(bigint,bigint,bigint,jsonb,text) to authenticated;
revoke all on function public.salvar_comanda(bigint,bigint,bigint,bigint,numeric,numeric,text,jsonb) from public;
grant execute on function public.salvar_comanda(bigint,bigint,bigint,bigint,numeric,numeric,text,jsonb) to authenticated;
revoke all on function public.fechar_comanda(bigint,bigint,date) from public;
grant execute on function public.fechar_comanda(bigint,bigint,date) to authenticated;
revoke all on function public.cancelar_comanda(bigint,bigint,text) from public;
grant execute on function public.cancelar_comanda(bigint,bigint,text) to authenticated;
comment on function public.salvar_orcamento(bigint,bigint,bigint,date,numeric,numeric,text,jsonb)
  is 'Cria ou edita orçamento e seus itens atomicamente.';
comment on function public.converter_orcamento_em_comanda(bigint,bigint,bigint,jsonb,text)
  is 'Converte orçamento aprovado em uma única comanda preservando snapshots.';
comment on function public.salvar_comanda(bigint,bigint,bigint,bigint,numeric,numeric,text,jsonb)
  is 'Cria ou edita comanda aberta e seus itens atomicamente.';
comment on function public.fechar_comanda(bigint,bigint,date)
  is 'Fecha comanda, movimenta estoque, gera comissões e conta a receber.';
