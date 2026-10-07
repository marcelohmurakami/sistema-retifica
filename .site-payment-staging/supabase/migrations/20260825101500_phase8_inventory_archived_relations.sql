-- Permite concluir compras existentes quando fornecedor ou produto foi
-- arquivado depois do pedido. Novas compras continuam aceitando apenas
-- cadastros ativos.

create or replace function private.preparar_compra()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id_empresa is distinct from old.id_empresa then
      raise exception 'A empresa da compra não pode ser alterada.';
    end if;
    if old.status in ('recebida','cancelada')
       and (to_jsonb(new) - array['observacoes','anexos','updated_at'])
           is distinct from
           (to_jsonb(old) - array['observacoes','anexos','updated_at']) then
      raise exception 'Compra recebida ou cancelada não pode ter seus dados comerciais alterados.';
    end if;
    if new.status = 'cancelada' and old.status <> 'cancelada'
       and exists (
         select 1
         from public.compras_itens ci
         where ci.id_compra = old.id
           and ci.quantidade_recebida > 0
       ) then
      raise exception 'Não cancele uma compra já recebida; estorne primeiro os movimentos de estoque.';
    end if;
  end if;

  if tg_op = 'INSERT' or new.id_fornecedor is distinct from old.id_fornecedor then
    if not exists (
      select 1
      from public.fornecedores f
      where f.id = new.id_fornecedor
        and f.id_empresa = new.id_empresa
        and f.ativo
    ) then
      raise exception 'Fornecedor inválido, inativo ou pertencente a outra empresa.';
    end if;
  elsif not exists (
    select 1
    from public.fornecedores f
    where f.id = new.id_fornecedor
      and f.id_empresa = new.id_empresa
  ) then
    raise exception 'Fornecedor inválido ou pertencente a outra empresa.';
  end if;

  new.criado_por := coalesce(new.criado_por, auth.uid());
  new.total_final := greatest(new.total_produtos + new.frete - new.desconto, 0);
  new.updated_at := now();
  return new;
end;
$$;
create or replace function private.preparar_compra_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empresa bigint;
  v_status text;
  v_nome text;
begin
  select c.id_empresa, c.status
    into v_empresa, v_status
  from public.compras c
  where c.id = new.id_compra;

  if not found then
    raise exception 'Compra não encontrada.';
  end if;
  if v_status in ('recebida','cancelada') then
    raise exception 'Itens de compra recebida ou cancelada não podem ser alterados.';
  end if;

  if tg_op = 'UPDATE' and (
    new.id_compra is distinct from old.id_compra
    or new.id_produto is distinct from old.id_produto
  ) then
    raise exception 'Não é permitido trocar a compra ou o produto do item.';
  end if;

  if tg_op = 'UPDATE' and new.quantidade_recebida < old.quantidade_recebida then
    raise exception 'A quantidade recebida não pode diminuir; estorne o movimento de estoque correspondente.';
  end if;

  select p.nome
    into v_nome
  from public.produtos p
  where p.id = new.id_produto
    and p.id_empresa = v_empresa
    and (p.ativo or tg_op = 'UPDATE');

  if not found then
    raise exception 'Produto inválido, inativo ou pertencente a outra empresa.';
  end if;

  new.id_empresa := v_empresa;
  new.descricao_snapshot := coalesce(nullif(btrim(new.descricao_snapshot), ''), v_nome);
  new.total := round(new.quantidade_comprada * new.valor_unitario - new.desconto, 2);
  new.updated_at := now();
  return new;
end;
$$;
