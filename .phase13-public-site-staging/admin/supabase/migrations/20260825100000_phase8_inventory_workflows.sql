-- Fase 8: operacoes atomicas usadas pelo front de compras e estoque.
-- Os triggers privados existentes continuam sendo a fonte de verdade para
-- totais, saldos, custo e historico de movimentacoes.

create or replace function private.processar_compra_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delta numeric;
  v_estoque_antes numeric;
  v_custo_antes numeric;
  v_controla_estoque boolean;
begin
  if tg_op = 'DELETE' then
    perform private.recalcular_compra(old.id_compra);
    return old;
  end if;

  v_delta := new.quantidade_recebida
    - case when tg_op = 'UPDATE' then old.quantidade_recebida else 0 end;

  if v_delta > 0 then
    select p.estoque_atual, p.custo_medio, p.controla_estoque
      into v_estoque_antes, v_custo_antes, v_controla_estoque
    from public.produtos p
    where p.id = new.id_produto
      and p.id_empresa = new.id_empresa
    for update;

    if not found then
      raise exception 'Produto da compra não encontrado.';
    end if;

    if v_controla_estoque then
      insert into public.movimentos_estoque (
        id_empresa, id_produto, tipo, quantidade,
        estoque_antes, estoque_depois, descricao,
        status, origem, id_compra_item, movimentado_em, criado_por
      ) values (
        new.id_empresa, new.id_produto, 'entrada_compra', v_delta,
        0, 0, 'Recebimento da compra #' || new.id_compra,
        'ativo', 'compra', new.id, now(), auth.uid()
      );

      update public.produtos
         set custo_medio = round(
           (
             coalesce(v_custo_antes, 0) * v_estoque_antes
             + new.valor_unitario * v_delta
           ) / nullif(v_estoque_antes + v_delta, 0),
           2
         )
       where id = new.id_produto
         and id_empresa = new.id_empresa;
    else
      update public.produtos
         set custo_medio = new.valor_unitario
       where id = new.id_produto
         and id_empresa = new.id_empresa;
    end if;
  end if;

  perform private.recalcular_compra(new.id_compra);
  if tg_op = 'UPDATE' and new.id_compra <> old.id_compra then
    perform private.recalcular_compra(old.id_compra);
  end if;
  return new;
end;
$$;

create or replace function public.salvar_compra(
  p_compra_id bigint,
  p_id_empresa bigint,
  p_id_fornecedor bigint,
  p_data_compra date,
  p_numero_documento text,
  p_previsao_entrega date,
  p_frete numeric,
  p_desconto numeric,
  p_observacoes text,
  p_itens jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_compra_id bigint;
  v_status text;
  v_item jsonb;
  v_produto_id bigint;
  v_nome_produto text;
  v_quantidade numeric;
  v_valor_unitario numeric;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para gerenciar compras.';
  end if;

  if p_itens is null
     or jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos um produto à compra.';
  end if;

  if coalesce(p_frete, 0) < 0 or coalesce(p_desconto, 0) < 0 then
    raise exception 'Frete e desconto não podem ser negativos.';
  end if;

  if p_compra_id is null then
    insert into public.compras (
      id_empresa, id_fornecedor, data_compra, numero_documento,
      previsao_entrega, frete, desconto, observacoes, status,
      total_produtos, total_final, criado_por
    ) values (
      p_id_empresa, p_id_fornecedor, coalesce(p_data_compra, current_date),
      nullif(btrim(p_numero_documento), ''), p_previsao_entrega,
      0, 0, nullif(btrim(p_observacoes), ''), 'pedido', 0, 0, auth.uid()
    ) returning id into v_compra_id;
  else
    select c.status
      into v_status
    from public.compras c
    where c.id = p_compra_id
      and c.id_empresa = p_id_empresa
    for update;

    if not found then
      raise exception 'Compra não encontrada.';
    end if;
    if v_status not in ('rascunho', 'pedido') then
      raise exception 'Somente compras ainda não recebidas podem ser editadas.';
    end if;

    v_compra_id := p_compra_id;
    update public.compras
       set id_fornecedor = p_id_fornecedor,
           data_compra = coalesce(p_data_compra, current_date),
           numero_documento = nullif(btrim(p_numero_documento), ''),
           previsao_entrega = p_previsao_entrega,
           frete = 0,
           desconto = 0,
           observacoes = nullif(btrim(p_observacoes), ''),
           status = 'pedido'
     where id = v_compra_id
       and id_empresa = p_id_empresa;

    delete from public.compras_itens
     where id_compra = v_compra_id
       and id_empresa = p_id_empresa;
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_produto_id := nullif(v_item->>'id_produto', '')::bigint;
    v_quantidade := nullif(v_item->>'quantidade', '')::numeric;
    v_valor_unitario := nullif(v_item->>'valor_unitario', '')::numeric;

    if v_produto_id is null
       or coalesce(v_quantidade, 0) <= 0
       or coalesce(v_valor_unitario, -1) < 0 then
      raise exception 'Revise os produtos, quantidades e custos da compra.';
    end if;

    select p.nome
      into v_nome_produto
    from public.produtos p
    where p.id = v_produto_id
      and p.id_empresa = p_id_empresa
      and p.ativo;

    if not found then
      raise exception 'Produto inválido, inativo ou pertencente a outra empresa.';
    end if;

    insert into public.compras_itens (
      id_empresa, id_compra, id_produto, descricao_snapshot,
      quantidade_comprada, quantidade_recebida, valor_unitario,
      desconto, total
    ) values (
      p_id_empresa, v_compra_id, v_produto_id, v_nome_produto,
      v_quantidade, 0, v_valor_unitario, 0,
      round(v_quantidade * v_valor_unitario, 2)
    );
  end loop;

  update public.compras
     set frete = coalesce(p_frete, 0),
         desconto = coalesce(p_desconto, 0)
   where id = v_compra_id
     and id_empresa = p_id_empresa;

  return v_compra_id;
end;
$$;

create or replace function public.receber_compra(
  p_compra_id bigint,
  p_id_empresa bigint,
  p_itens jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_item jsonb;
  v_item_id bigint;
  v_quantidade numeric;
  v_restante numeric;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para receber compras.';
  end if;

  if p_itens is null
     or jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe ao menos uma quantidade recebida.';
  end if;

  select c.status
    into v_status
  from public.compras c
  where c.id = p_compra_id
    and c.id_empresa = p_id_empresa
  for update;

  if not found then
    raise exception 'Compra não encontrada.';
  end if;
  if v_status not in ('pedido', 'recebida_parcial') then
    raise exception 'Esta compra não está disponível para recebimento.';
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_item_id := nullif(v_item->>'id_item', '')::bigint;
    v_quantidade := nullif(v_item->>'quantidade', '')::numeric;

    if v_item_id is null or coalesce(v_quantidade, 0) <= 0 then
      raise exception 'As quantidades recebidas devem ser maiores que zero.';
    end if;

    select ci.quantidade_comprada - ci.quantidade_recebida
      into v_restante
    from public.compras_itens ci
    where ci.id = v_item_id
      and ci.id_compra = p_compra_id
      and ci.id_empresa = p_id_empresa
    for update;

    if not found then
      raise exception 'Item de compra não encontrado.';
    end if;
    if v_quantidade > v_restante then
      raise exception 'Quantidade recebida maior que a quantidade pendente.';
    end if;

    update public.compras_itens
       set quantidade_recebida = quantidade_recebida + v_quantidade
     where id = v_item_id
       and id_empresa = p_id_empresa;
  end loop;

  select c.status into v_status
  from public.compras c
  where c.id = p_compra_id
    and c.id_empresa = p_id_empresa;

  return v_status;
end;
$$;

create or replace function public.movimentar_estoque_manual(
  p_id_empresa bigint,
  p_id_produto bigint,
  p_operacao text,
  p_quantidade numeric,
  p_descricao text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estoque_atual numeric;
  v_quantidade_movimento numeric;
  v_tipo text;
  v_origem text;
  v_movimento_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array[
      'dono'::public.tipos_usuarios,
      'gerente'::public.tipos_usuarios,
      'recepcionista'::public.tipos_usuarios
    ]
  ) then
    raise exception 'Você não possui permissão para movimentar o estoque.';
  end if;

  select p.estoque_atual
    into v_estoque_atual
  from public.produtos p
  where p.id = p_id_produto
    and p.id_empresa = p_id_empresa
    and p.ativo
    and p.controla_estoque
  for update;

  if not found then
    raise exception 'Produto inválido, inativo ou sem controle de estoque.';
  end if;

  if p_operacao = 'entrada' then
    if coalesce(p_quantidade, 0) <= 0 then
      raise exception 'Informe uma quantidade de entrada maior que zero.';
    end if;
    v_quantidade_movimento := p_quantidade;
    v_tipo := 'entrada_ajuste';
    v_origem := 'manual';
  elsif p_operacao = 'saida' then
    if coalesce(p_quantidade, 0) <= 0 then
      raise exception 'Informe uma quantidade de saída maior que zero.';
    end if;
    v_quantidade_movimento := p_quantidade;
    v_tipo := 'saida_consumo';
    v_origem := 'manual';
  elsif p_operacao = 'ajuste' then
    if p_quantidade is null or p_quantidade < 0 then
      raise exception 'O novo saldo do ajuste não pode ser negativo.';
    end if;
    if p_quantidade = v_estoque_atual then
      raise exception 'O saldo informado já é o saldo atual do produto.';
    end if;
    v_quantidade_movimento := abs(p_quantidade - v_estoque_atual);
    v_tipo := case
      when p_quantidade > v_estoque_atual then 'entrada_ajuste'
      else 'saida_ajuste'
    end;
    v_origem := 'ajuste';
  else
    raise exception 'Operação de estoque inválida.';
  end if;

  insert into public.movimentos_estoque (
    id_empresa, id_produto, tipo, quantidade,
    estoque_antes, estoque_depois, descricao,
    status, origem, movimentado_em, criado_por
  ) values (
    p_id_empresa, p_id_produto, v_tipo, v_quantidade_movimento,
    0, 0,
    coalesce(
      nullif(btrim(p_descricao), ''),
      case p_operacao
        when 'entrada' then 'Entrada manual de estoque'
        when 'saida' then 'Saída manual de estoque'
        else 'Ajuste de inventário'
      end
    ),
    'ativo', v_origem, now(), auth.uid()
  ) returning id into v_movimento_id;

  return v_movimento_id;
end;
$$;

revoke all on function public.salvar_compra(bigint, bigint, bigint, date, text, date, numeric, numeric, text, jsonb) from public;
grant execute on function public.salvar_compra(bigint, bigint, bigint, date, text, date, numeric, numeric, text, jsonb) to authenticated;

revoke all on function public.receber_compra(bigint, bigint, jsonb) from public;
grant execute on function public.receber_compra(bigint, bigint, jsonb) to authenticated;

revoke all on function public.movimentar_estoque_manual(bigint, bigint, text, numeric, text) from public;
grant execute on function public.movimentar_estoque_manual(bigint, bigint, text, numeric, text) to authenticated;

comment on function public.salvar_compra(bigint, bigint, bigint, date, text, date, numeric, numeric, text, jsonb)
  is 'Cria ou edita compra ainda não recebida e substitui seus itens atomicamente.';
comment on function public.receber_compra(bigint, bigint, jsonb)
  is 'Recebe parcial ou totalmente itens da compra; triggers geram as entradas de estoque.';
comment on function public.movimentar_estoque_manual(bigint, bigint, text, numeric, text)
  is 'Registra entrada, saída ou ajuste manual e delega o saldo ao trigger de estoque.';
