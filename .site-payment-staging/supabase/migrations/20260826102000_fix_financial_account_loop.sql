-- Recompila a função sem sombrear a variável de controle das parcelas.
create or replace function public.salvar_conta_financeira(
  p_conta_id bigint,
  p_id_empresa bigint,
  p_tipo text,
  p_id_categoria bigint,
  p_id_cliente bigint,
  p_id_fornecedor bigint,
  p_descricao text,
  p_documento text,
  p_data_emissao date,
  p_competencia date,
  p_valor_total numeric,
  p_numero_parcelas integer,
  p_primeiro_vencimento date,
  p_observacoes text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_conta record;
  v_categoria_tipo text;
  v_valor_base numeric(14,2);
  v_valor_parcela numeric(14,2);
  v_indice integer;
begin
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      p_tipo = 'receber'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para gerenciar esta conta.';
  end if;

  if p_tipo not in ('receber', 'pagar') then
    raise exception 'Tipo de conta inválido.';
  end if;
  if nullif(btrim(p_descricao), '') is null then
    raise exception 'Informe a descrição da conta.';
  end if;
  if coalesce(p_valor_total, 0) <= 0 then
    raise exception 'O valor total deve ser maior que zero.';
  end if;
  if coalesce(p_numero_parcelas, 0) not between 1 and 120 then
    raise exception 'A quantidade de parcelas deve ficar entre 1 e 120.';
  end if;
  if p_valor_total < p_numero_parcelas * 0.01 then
    raise exception 'O valor total é insuficiente para a quantidade de parcelas.';
  end if;
  if p_primeiro_vencimento is null then
    raise exception 'Informe o primeiro vencimento.';
  end if;

  if p_id_categoria is not null then
    select c.tipo into v_categoria_tipo
    from public.categorias_financeiras c
    where c.id = p_id_categoria
      and c.id_empresa = p_id_empresa
      and c.ativo;

    if not found then
      raise exception 'Categoria financeira inválida ou inativa.';
    end if;
    if v_categoria_tipo <> 'ambos'
       and v_categoria_tipo <> (case when p_tipo = 'receber' then 'entrada' else 'saida' end) then
      raise exception 'A categoria não corresponde ao tipo da conta.';
    end if;
  end if;

  if p_id_cliente is not null and not exists (
    select 1 from public.clientes c
    where c.id = p_id_cliente and c.id_empresa = p_id_empresa and c.ativo
  ) then
    raise exception 'Cliente inválido ou inativo.';
  end if;
  if p_id_fornecedor is not null and not exists (
    select 1 from public.fornecedores f
    where f.id = p_id_fornecedor and f.id_empresa = p_id_empresa and f.ativo
  ) then
    raise exception 'Fornecedor inválido ou inativo.';
  end if;
  if p_tipo = 'receber' and p_id_fornecedor is not null then
    raise exception 'Contas a receber não podem possuir fornecedor.';
  end if;
  if p_tipo = 'pagar' and p_id_cliente is not null then
    raise exception 'Contas a pagar não podem possuir cliente.';
  end if;

  if p_conta_id is null then
    insert into public.contas (
      id_empresa, tipo, id_cliente, id_fornecedor, id_categoria,
      descricao, documento, data_emissao, competencia,
      valor_total, valor_pago, status, observacoes, criado_por
    ) values (
      p_id_empresa, p_tipo,
      case when p_tipo = 'receber' then p_id_cliente end,
      case when p_tipo = 'pagar' then p_id_fornecedor end,
      p_id_categoria, btrim(p_descricao), nullif(btrim(p_documento), ''),
      coalesce(p_data_emissao, current_date), p_competencia,
      0, 0, 'aberta', nullif(btrim(p_observacoes), ''), auth.uid()
    ) returning id into v_id;
  else
    select c.* into v_conta
    from public.contas c
    where c.id = p_conta_id and c.id_empresa = p_id_empresa
    for update;

    if not found then
      raise exception 'Conta não encontrada.';
    end if;
    if v_conta.id_comanda is not null then
      raise exception 'Contas geradas por comandas devem ser ajustadas na origem.';
    end if;
    if v_conta.status in ('paga', 'parcial', 'cancelada') or v_conta.valor_pago > 0 then
      raise exception 'Somente contas sem pagamentos podem ser editadas.';
    end if;

    v_id := p_conta_id;
    delete from public.contas_parcelas
    where id_conta = v_id and id_empresa = p_id_empresa;

    update public.contas
       set tipo = p_tipo,
           id_cliente = case when p_tipo = 'receber' then p_id_cliente end,
           id_fornecedor = case when p_tipo = 'pagar' then p_id_fornecedor end,
           id_categoria = p_id_categoria,
           descricao = btrim(p_descricao),
           documento = nullif(btrim(p_documento), ''),
           data_emissao = coalesce(p_data_emissao, current_date),
           competencia = p_competencia,
           observacoes = nullif(btrim(p_observacoes), ''),
           status = 'aberta', valor_total = 0, valor_pago = 0,
           cancelada_em = null, motivo_cancelamento = null
     where id = v_id and id_empresa = p_id_empresa;
  end if;

  v_valor_base := trunc(p_valor_total / p_numero_parcelas, 2);
  v_indice := 1;
  while v_indice <= p_numero_parcelas loop
    v_valor_parcela := case
      when v_indice = p_numero_parcelas
        then p_valor_total - v_valor_base * (p_numero_parcelas - 1)
      else v_valor_base
    end;

    insert into public.contas_parcelas (
      id_empresa, id_conta, numero_parcela, data_vencimento,
      valor_parcela, valor_pago, status
    ) values (
      p_id_empresa, v_id, v_indice,
      (p_primeiro_vencimento + ((v_indice - 1) * interval '1 month'))::date,
      v_valor_parcela, 0,
      case when p_primeiro_vencimento + ((v_indice - 1) * interval '1 month') < current_date
        then 'atrasada' else 'aberta' end
    );
    v_indice := v_indice + 1;
  end loop;

  return v_id;
end;
$$;
