-- Dados ficticios das fases 8 e 9 para a empresa de teste.
-- A carga e idempotente e so e executada para Murakami Beauty (empresa 10).

do $$
declare
  v_empresa_id bigint;
  v_user_id uuid;
  v_cliente_1 bigint;
  v_cliente_2 bigint;
  v_cliente_3 bigint;
  v_cliente_4 bigint;
  v_funcionario_1 bigint;
  v_funcionario_2 bigint;
  v_responsavel bigint;
  v_servico_1 bigint;
  v_servico_2 bigint;
  v_servico_3 bigint;
  v_servico_nome_1 text;
  v_servico_nome_2 text;
  v_servico_nome_3 text;
  v_servico_preco_1 numeric;
  v_servico_preco_2 numeric;
  v_servico_preco_3 numeric;
  v_fornecedor_1 bigint;
  v_fornecedor_2 bigint;
  v_fornecedor_3 bigint;
  v_produto_shampoo bigint;
  v_produto_condicionador bigint;
  v_produto_mascara bigint;
  v_produto_oleo bigint;
  v_produto_luvas bigint;
  v_produto_esmalte bigint;
  v_produto_cera bigint;
  v_produto_acetona bigint;
  v_compra_id bigint;
  v_orcamento_id bigint;
  v_comanda_id bigint;
  v_recebimento jsonb;
  v_funcionarios_servicos jsonb;
begin
  select e.id
    into v_empresa_id
  from public.empresas e
  where e.id = 10
    and lower(btrim(e.fantasia)) = lower('Murakami Beauty');

  if not found then
    raise notice 'Carga comercial ignorada: Murakami Beauty (empresa 10) nao foi encontrada.';
    return;
  end if;

  select ue.user_id
    into v_user_id
  from public.usuarios_empresas ue
  where ue.empresa_id = v_empresa_id
    and ue.status = 'ativo'
    and ue.tipo in ('dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios)
  order by case when ue.tipo = 'dono'::public.tipos_usuarios then 0 else 1 end, ue.id
  limit 1;

  if v_user_id is null then
    raise notice 'Carga comercial ignorada: a empresa de teste nao possui dono ou gerente ativo.';
    return;
  end if;

  -- Simula a identidade do responsavel para exercitar as mesmas RPCs usadas pelo front.
  perform set_config('request.jwt.claim.sub', v_user_id::text, true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user_id, 'role', 'authenticated')::text,
    true
  );

  select c.id into v_cliente_1
  from public.clientes c
  where c.id_empresa = v_empresa_id and c.ativo
  order by (c.email = 'ana.silva.demo@example.com') desc, c.id
  limit 1;

  select c.id into v_cliente_2
  from public.clientes c
  where c.id_empresa = v_empresa_id and c.ativo and c.id <> v_cliente_1
  order by (c.email = 'carlos.mendes.demo@example.com') desc, c.id
  limit 1;

  select c.id into v_cliente_3
  from public.clientes c
  where c.id_empresa = v_empresa_id and c.ativo and c.id not in (v_cliente_1, v_cliente_2)
  order by (c.email = 'juliana.rocha.demo@example.com') desc, c.id
  limit 1;

  select c.id into v_cliente_4
  from public.clientes c
  where c.id_empresa = v_empresa_id and c.ativo and c.id not in (v_cliente_1, v_cliente_2, v_cliente_3)
  order by (c.email = 'rafael.almeida.demo@example.com') desc, c.id
  limit 1;

  if v_cliente_4 is null then v_cliente_4 := v_cliente_1; end if;
  if v_cliente_3 is null then v_cliente_3 := v_cliente_1; end if;
  if v_cliente_2 is null then v_cliente_2 := v_cliente_1; end if;

  if v_cliente_1 is null then
    raise notice 'Carga comercial ignorada: nenhum cliente ativo foi encontrado.';
    return;
  end if;

  select s.id, s.nome, s.preco
    into v_servico_1, v_servico_nome_1, v_servico_preco_1
  from public.servicos s
  where s.id_empresa = v_empresa_id and s.ativo
  order by s.id
  limit 1;

  select s.id, s.nome, s.preco
    into v_servico_2, v_servico_nome_2, v_servico_preco_2
  from public.servicos s
  where s.id_empresa = v_empresa_id and s.ativo and s.id <> v_servico_1
  order by s.id
  limit 1;

  select s.id, s.nome, s.preco
    into v_servico_3, v_servico_nome_3, v_servico_preco_3
  from public.servicos s
  where s.id_empresa = v_empresa_id and s.ativo and s.id not in (v_servico_1, v_servico_2)
  order by s.id
  limit 1;

  if v_servico_1 is null then
    raise notice 'Carga comercial ignorada: nenhum servico ativo foi encontrado.';
    return;
  end if;
  if v_servico_2 is null then
    v_servico_2 := v_servico_1;
    v_servico_nome_2 := v_servico_nome_1;
    v_servico_preco_2 := v_servico_preco_1;
  end if;
  if v_servico_3 is null then
    v_servico_3 := v_servico_2;
    v_servico_nome_3 := v_servico_nome_2;
    v_servico_preco_3 := v_servico_preco_2;
  end if;

  select fs.id_funcionario into v_funcionario_1
  from public.funcionarios_servicos fs
  join public.funcionarios f
    on f.id = fs.id_funcionario and f.id_empresa = fs.id_empresa
  where fs.id_empresa = v_empresa_id
    and fs.id_servico = v_servico_1
    and fs.ativo and f.ativo and f.atende_clientes
  order by (f.email = 'beatriz.costa.demo@example.com') desc, f.id
  limit 1;

  select fs.id_funcionario into v_funcionario_2
  from public.funcionarios_servicos fs
  join public.funcionarios f
    on f.id = fs.id_funcionario and f.id_empresa = fs.id_empresa
  where fs.id_empresa = v_empresa_id
    and fs.id_servico = v_servico_2
    and fs.ativo and f.ativo and f.atende_clientes
  order by (f.email = 'diego.martins.demo@example.com') desc, f.id
  limit 1;

  if v_funcionario_1 is null or v_funcionario_2 is null then
    raise notice 'Carga comercial ignorada: faltam profissionais vinculados aos servicos.';
    return;
  end if;
  v_responsavel := v_funcionario_1;

  -- Fornecedores.
  insert into public.fornecedores (
    id_empresa, nome, nome_fantasia, documento, contato_responsavel,
    telefone, email, endereco, observacoes, ativo
  )
  select v_empresa_id, 'Beauty Distribuidora Demo Ltda.', 'Beauty Distribuidora',
         'DEMO-FOR-001', 'Marina Souza', '(11) 4000-1101',
         'pedidos.beauty.demo@example.com', 'Rua das Flores, 120 - Sao Paulo/SP',
         '[DADO FICTICIO] Fornecedor de produtos capilares.', true
  where not exists (
    select 1 from public.fornecedores
    where id_empresa = v_empresa_id and documento = 'DEMO-FOR-001'
  );

  insert into public.fornecedores (
    id_empresa, nome, nome_fantasia, documento, contato_responsavel,
    telefone, email, endereco, observacoes, ativo
  )
  select v_empresa_id, 'Estetica Pro Suprimentos Demo Ltda.', 'Estetica Pro',
         'DEMO-FOR-002', 'Felipe Nunes', '(11) 4000-2202',
         'vendas.esteticapro.demo@example.com', 'Av. Central, 450 - Sao Paulo/SP',
         '[DADO FICTICIO] Fornecedor de descartaveis e estetica.', true
  where not exists (
    select 1 from public.fornecedores
    where id_empresa = v_empresa_id and documento = 'DEMO-FOR-002'
  );

  insert into public.fornecedores (
    id_empresa, nome, nome_fantasia, documento, contato_responsavel,
    telefone, email, endereco, observacoes, ativo
  )
  select v_empresa_id, 'Nail Color Atacado Demo Ltda.', 'Nail Color',
         'DEMO-FOR-003', 'Camila Reis', '(11) 4000-3303',
         'comercial.nailcolor.demo@example.com', 'Rua Aurora, 88 - Sao Paulo/SP',
         '[DADO FICTICIO] Fornecedor de manicure e esmalteria.', true
  where not exists (
    select 1 from public.fornecedores
    where id_empresa = v_empresa_id and documento = 'DEMO-FOR-003'
  );

  select id into strict v_fornecedor_1 from public.fornecedores
  where id_empresa = v_empresa_id and documento = 'DEMO-FOR-001';
  select id into strict v_fornecedor_2 from public.fornecedores
  where id_empresa = v_empresa_id and documento = 'DEMO-FOR-002';
  select id into strict v_fornecedor_3 from public.fornecedores
  where id_empresa = v_empresa_id and documento = 'DEMO-FOR-003';

  -- Produtos com diferentes cenarios de saldo e reposicao.
  insert into public.produtos (
    id_empresa, nome, codigo, descricao, unidade_medida, finalidade,
    preco_venda, custo_medio, estoque_atual, estoque_minimo, controla_estoque, ativo
  ) values
    (v_empresa_id, 'Shampoo profissional 1L (Demo)', 'DEMO-SHP-1L', '[DADO FICTICIO] Shampoo para venda e uso interno.', 'un', 'ambos', 69.90, 0, 0, 6, true, true),
    (v_empresa_id, 'Condicionador profissional 1L (Demo)', 'DEMO-COND-1L', '[DADO FICTICIO] Condicionador profissional.', 'un', 'ambos', 74.90, 0, 0, 5, true, true),
    (v_empresa_id, 'Mascara de hidratacao 500g (Demo)', 'DEMO-MASC-500', '[DADO FICTICIO] Mascara de tratamento.', 'un', 'venda', 89.90, 0, 0, 4, true, true),
    (v_empresa_id, 'Oleo finalizador 60ml (Demo)', 'DEMO-OLEO-60', '[DADO FICTICIO] Finalizador capilar.', 'un', 'venda', 54.90, 0, 0, 3, true, true),
    (v_empresa_id, 'Luvas descartaveis com 100 (Demo)', 'DEMO-LUVA-100', '[DADO FICTICIO] Material de consumo interno.', 'cx', 'consumo_interno', null, 0, 0, 2, true, true),
    (v_empresa_id, 'Esmalte vinho classico (Demo)', 'DEMO-ESM-VINHO', '[DADO FICTICIO] Esmalte para venda.', 'un', 'venda', 14.90, 0, 0, 8, true, true),
    (v_empresa_id, 'Cera depilatoria 500g (Demo)', 'DEMO-CERA-500', '[DADO FICTICIO] Insumo para depilacao.', 'un', 'consumo_interno', null, 0, 0, 5, true, true),
    (v_empresa_id, 'Acetona profissional 500ml (Demo)', 'DEMO-ACET-500', '[DADO FICTICIO] Removedor profissional.', 'un', 'consumo_interno', null, 0, 0, 4, true, true)
  on conflict (id_empresa, codigo)
    where codigo is not null and btrim(codigo) <> ''
  do nothing;

  select id into strict v_produto_shampoo from public.produtos where id_empresa = v_empresa_id and codigo = 'DEMO-SHP-1L';
  select id into strict v_produto_condicionador from public.produtos where id_empresa = v_empresa_id and codigo = 'DEMO-COND-1L';
  select id into strict v_produto_mascara from public.produtos where id_empresa = v_empresa_id and codigo = 'DEMO-MASC-500';
  select id into strict v_produto_oleo from public.produtos where id_empresa = v_empresa_id and codigo = 'DEMO-OLEO-60';
  select id into strict v_produto_luvas from public.produtos where id_empresa = v_empresa_id and codigo = 'DEMO-LUVA-100';
  select id into strict v_produto_esmalte from public.produtos where id_empresa = v_empresa_id and codigo = 'DEMO-ESM-VINHO';
  select id into strict v_produto_cera from public.produtos where id_empresa = v_empresa_id and codigo = 'DEMO-CERA-500';
  select id into strict v_produto_acetona from public.produtos where id_empresa = v_empresa_id and codigo = 'DEMO-ACET-500';

  insert into public.produtos_fornecedores (
    id_empresa, id_produto, id_fornecedor, codigo_produto_fornecedor,
    ultimo_custo, prazo_entrega_dias, fornecedor_principal
  )
  select v_empresa_id, x.id_produto, x.id_fornecedor, x.codigo, x.custo, x.prazo, true
  from (values
    (v_produto_shampoo, v_fornecedor_1, 'BD-SHP-01', 28.00::numeric, 3),
    (v_produto_condicionador, v_fornecedor_1, 'BD-COND-01', 30.00::numeric, 3),
    (v_produto_mascara, v_fornecedor_1, 'BD-MASC-05', 35.00::numeric, 4),
    (v_produto_oleo, v_fornecedor_1, 'BD-OLEO-06', 22.00::numeric, 4),
    (v_produto_luvas, v_fornecedor_2, 'EP-LUVAS-100', 55.00::numeric, 2),
    (v_produto_cera, v_fornecedor_2, 'EP-CERA-500', 24.00::numeric, 5),
    (v_produto_esmalte, v_fornecedor_3, 'NC-VINHO-14', 7.00::numeric, 6),
    (v_produto_acetona, v_fornecedor_3, 'NC-ACET-500', 8.00::numeric, 6)
  ) as x(id_produto, id_fornecedor, codigo, custo, prazo)
  where not exists (
    select 1 from public.produtos_fornecedores pf
    where pf.id_empresa = v_empresa_id
      and pf.id_produto = x.id_produto
      and pf.id_fornecedor = x.id_fornecedor
  );

  -- Compra totalmente recebida: gera entradas e custo medio.
  if not exists (
    select 1 from public.compras
    where id_empresa = v_empresa_id and numero_documento = 'DEMO-CMP-001'
  ) then
    v_compra_id := public.salvar_compra(
      null, v_empresa_id, v_fornecedor_1, current_date - 18,
      'DEMO-CMP-001', current_date - 15, 32, 20,
      '[DADO FICTICIO] Compra recebida integralmente.',
      jsonb_build_array(
        jsonb_build_object('id_produto', v_produto_shampoo, 'quantidade', 24, 'valor_unitario', 28),
        jsonb_build_object('id_produto', v_produto_condicionador, 'quantidade', 18, 'valor_unitario', 30),
        jsonb_build_object('id_produto', v_produto_mascara, 'quantidade', 10, 'valor_unitario', 35),
        jsonb_build_object('id_produto', v_produto_esmalte, 'quantidade', 24, 'valor_unitario', 7)
      )
    );
    select jsonb_agg(jsonb_build_object('id_item', ci.id, 'quantidade', ci.quantidade_comprada))
      into v_recebimento
    from public.compras_itens ci
    where ci.id_compra = v_compra_id;
    perform public.receber_compra(v_compra_id, v_empresa_id, v_recebimento);
  end if;

  -- Compra parcialmente recebida.
  if not exists (
    select 1 from public.compras
    where id_empresa = v_empresa_id and numero_documento = 'DEMO-CMP-002'
  ) then
    v_compra_id := public.salvar_compra(
      null, v_empresa_id, v_fornecedor_2, current_date - 7,
      'DEMO-CMP-002', current_date + 2, 18, 0,
      '[DADO FICTICIO] Recebimento parcial; ha unidades pendentes.',
      jsonb_build_array(
        jsonb_build_object('id_produto', v_produto_luvas, 'quantidade', 10, 'valor_unitario', 55),
        jsonb_build_object('id_produto', v_produto_oleo, 'quantidade', 12, 'valor_unitario', 22)
      )
    );
    select jsonb_agg(
      jsonb_build_object(
        'id_item', ci.id,
        'quantidade', case when ci.id_produto = v_produto_luvas then 6 else 4 end
      )
    ) into v_recebimento
    from public.compras_itens ci
    where ci.id_compra = v_compra_id;
    perform public.receber_compra(v_compra_id, v_empresa_id, v_recebimento);
  end if;

  -- Pedido ainda aguardando entrega.
  if not exists (
    select 1 from public.compras
    where id_empresa = v_empresa_id and numero_documento = 'DEMO-CMP-003'
  ) then
    perform public.salvar_compra(
      null, v_empresa_id, v_fornecedor_3, current_date - 1,
      'DEMO-CMP-003', current_date + 6, 25, 10,
      '[DADO FICTICIO] Pedido aguardando entrega do fornecedor.',
      jsonb_build_array(
        jsonb_build_object('id_produto', v_produto_cera, 'quantidade', 15, 'valor_unitario', 24),
        jsonb_build_object('id_produto', v_produto_acetona, 'quantidade', 20, 'valor_unitario', 8)
      )
    );
  end if;

  -- Ajustes deixam exemplos de estoque normal, baixo e zerado.
  if not exists (
    select 1 from public.movimentos_estoque
    where id_empresa = v_empresa_id and descricao = '[DADO FICTICIO] Inventario rotativo: saldo de shampoo ajustado.'
  ) and (select estoque_atual from public.produtos where id = v_produto_shampoo) <> 20 then
    perform public.movimentar_estoque_manual(
      v_empresa_id, v_produto_shampoo, 'ajuste', 20,
      '[DADO FICTICIO] Inventario rotativo: saldo de shampoo ajustado.'
    );
  end if;

  if not exists (
    select 1 from public.movimentos_estoque
    where id_empresa = v_empresa_id and descricao = '[DADO FICTICIO] Consumo interno deixou a mascara em estoque minimo.'
  ) and (select estoque_atual from public.produtos where id = v_produto_mascara) <> 2 then
    perform public.movimentar_estoque_manual(
      v_empresa_id, v_produto_mascara, 'ajuste', 2,
      '[DADO FICTICIO] Consumo interno deixou a mascara em estoque minimo.'
    );
  end if;

  if not exists (
    select 1 from public.movimentos_estoque
    where id_empresa = v_empresa_id and descricao = '[DADO FICTICIO] Ultimas unidades do oleo utilizadas em atendimentos.'
  ) and (select estoque_atual from public.produtos where id = v_produto_oleo) <> 0 then
    perform public.movimentar_estoque_manual(
      v_empresa_id, v_produto_oleo, 'ajuste', 0,
      '[DADO FICTICIO] Ultimas unidades do oleo utilizadas em atendimentos.'
    );
  end if;

  -- Orcamento em rascunho.
  if not exists (
    select 1 from public.orcamentos
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] ORC-RASCUNHO%'
  ) then
    perform public.salvar_orcamento(
      null, v_empresa_id, v_cliente_1, current_date + 12, 10, 0,
      '[DEMO FASE 9] ORC-RASCUNHO | Proposta em elaboracao.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_1, 'id_produto', null, 'descricao', v_servico_nome_1, 'quantidade', 1, 'valor_unitario', v_servico_preco_1, 'desconto', 0),
        jsonb_build_object('tipo_item', 'produto', 'id_servico', null, 'id_produto', v_produto_shampoo, 'descricao', 'Shampoo profissional 1L (Demo)', 'quantidade', 1, 'valor_unitario', 69.90, 'desconto', 0)
      )
    );
  end if;

  -- Orcamento enviado ao cliente.
  if not exists (
    select 1 from public.orcamentos
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] ORC-ENVIADO%'
  ) then
    v_orcamento_id := public.salvar_orcamento(
      null, v_empresa_id, v_cliente_2, current_date + 8, 0, 0,
      '[DEMO FASE 9] ORC-ENVIADO | Aguardando retorno pelo WhatsApp.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_2, 'id_produto', null, 'descricao', v_servico_nome_2, 'quantidade', 1, 'valor_unitario', v_servico_preco_2, 'desconto', 0),
        jsonb_build_object('tipo_item', 'produto', 'id_servico', null, 'id_produto', v_produto_condicionador, 'descricao', 'Condicionador profissional 1L (Demo)', 'quantidade', 1, 'valor_unitario', 74.90, 'desconto', 0)
      )
    );
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'enviado', 'Enviado para avaliacao do cliente.');
  end if;

  -- Orcamento aprovado e pronto para testar o botao Converter.
  if not exists (
    select 1 from public.orcamentos
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] ORC-APROVADO%'
  ) then
    v_orcamento_id := public.salvar_orcamento(
      null, v_empresa_id, v_cliente_3, current_date + 15, 15, 0,
      '[DEMO FASE 9] ORC-APROVADO | Pronto para conversao manual.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_3, 'id_produto', null, 'descricao', v_servico_nome_3, 'quantidade', 1, 'valor_unitario', v_servico_preco_3, 'desconto', 0),
        jsonb_build_object('tipo_item', 'produto', 'id_servico', null, 'id_produto', v_produto_mascara, 'descricao', 'Mascara de hidratacao 500g (Demo)', 'quantidade', 1, 'valor_unitario', 89.90, 'desconto', 5)
      )
    );
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'enviado', null);
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'aprovado', 'Aprovado pelo cliente em contato telefonico.');
  end if;

  -- Orcamento recusado.
  if not exists (
    select 1 from public.orcamentos
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] ORC-RECUSADO%'
  ) then
    v_orcamento_id := public.salvar_orcamento(
      null, v_empresa_id, v_cliente_4, current_date + 5, 0, 25,
      '[DEMO FASE 9] ORC-RECUSADO | Historico comercial para teste.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_1, 'id_produto', null, 'descricao', v_servico_nome_1, 'quantidade', 2, 'valor_unitario', v_servico_preco_1, 'desconto', 0)
      )
    );
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'enviado', null);
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'recusado', 'Cliente optou por adiar o atendimento.');
  end if;

  -- Orcamento vencido.
  if not exists (
    select 1 from public.orcamentos
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] ORC-EXPIRADO%'
  ) then
    v_orcamento_id := public.salvar_orcamento(
      null, v_empresa_id, v_cliente_1, current_date + 1, 0, 0,
      '[DEMO FASE 9] ORC-EXPIRADO | Exemplo de proposta vencida.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_2, 'id_produto', null, 'descricao', v_servico_nome_2, 'quantidade', 1, 'valor_unitario', v_servico_preco_2, 'desconto', 0)
      )
    );
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'enviado', null);
    update public.orcamentos set validade = current_date - 1 where id = v_orcamento_id;
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'expirado', 'Validade encerrada sem aprovacao.');
  end if;

  -- Orcamento convertido automaticamente em comanda aberta.
  if not exists (
    select 1 from public.orcamentos
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] ORC-CONVERTIDO%'
  ) then
    v_orcamento_id := public.salvar_orcamento(
      null, v_empresa_id, v_cliente_2, current_date + 10, 20, 0,
      '[DEMO FASE 9] ORC-CONVERTIDO | Exemplo completo de conversao.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_1, 'id_produto', null, 'descricao', v_servico_nome_1, 'quantidade', 1, 'valor_unitario', v_servico_preco_1, 'desconto', 0),
        jsonb_build_object('tipo_item', 'produto', 'id_servico', null, 'id_produto', v_produto_esmalte, 'descricao', 'Esmalte vinho classico (Demo)', 'quantidade', 2, 'valor_unitario', 14.90, 'desconto', 0)
      )
    );
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'enviado', null);
    perform public.alterar_status_orcamento(v_orcamento_id, v_empresa_id, 'aprovado', 'Aprovado para demonstrar a conversao.');

    select coalesce(jsonb_object_agg(oi.id::text, v_funcionario_1), '{}'::jsonb)
      into v_funcionarios_servicos
    from public.orcamentos_itens oi
    where oi.id_orcamento = v_orcamento_id and oi.tipo_item = 'servico';

    perform public.converter_orcamento_em_comanda(
      v_orcamento_id, v_empresa_id, v_responsavel,
      v_funcionarios_servicos,
      '[DEMO FASE 9] COMANDA-CONVERTIDA | Originada de orcamento aprovado.'
    );
  end if;

  -- Comanda aberta com servico, produto e item avulso.
  if not exists (
    select 1 from public.comandas
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] COMANDA-ABERTA%'
  ) then
    perform public.salvar_comanda(
      null, v_empresa_id, v_cliente_3, v_responsavel, 12, 0,
      '[DEMO FASE 9] COMANDA-ABERTA | Atendimento em andamento no caixa.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_1, 'id_produto', null, 'id_funcionario', v_funcionario_1, 'descricao', v_servico_nome_1, 'quantidade', 1, 'valor_unitario', v_servico_preco_1, 'desconto', 0),
        jsonb_build_object('tipo_item', 'produto', 'id_servico', null, 'id_produto', v_produto_condicionador, 'id_funcionario', null, 'descricao', 'Condicionador profissional 1L (Demo)', 'quantidade', 1, 'valor_unitario', 74.90, 'desconto', 0),
        jsonb_build_object('tipo_item', 'outro', 'id_servico', null, 'id_produto', null, 'id_funcionario', null, 'descricao', 'Taxa de atendimento especial', 'quantidade', 1, 'valor_unitario', 18, 'desconto', 0)
      )
    );
  end if;

  -- Comanda fechada: gera conta a receber e saidas de estoque.
  if not exists (
    select 1 from public.comandas
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] COMANDA-FECHADA%'
  ) then
    v_comanda_id := public.salvar_comanda(
      null, v_empresa_id, v_cliente_4, v_funcionario_2, 8, 5,
      '[DEMO FASE 9] COMANDA-FECHADA | Venda concluida para validar estoque e financeiro.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_2, 'id_produto', null, 'id_funcionario', v_funcionario_2, 'descricao', v_servico_nome_2, 'quantidade', 1, 'valor_unitario', v_servico_preco_2, 'desconto', 0),
        jsonb_build_object('tipo_item', 'produto', 'id_servico', null, 'id_produto', v_produto_shampoo, 'id_funcionario', null, 'descricao', 'Shampoo profissional 1L (Demo)', 'quantidade', 2, 'valor_unitario', 69.90, 'desconto', 4),
        jsonb_build_object('tipo_item', 'produto', 'id_servico', null, 'id_produto', v_produto_mascara, 'id_funcionario', null, 'descricao', 'Mascara de hidratacao 500g (Demo)', 'quantidade', 1, 'valor_unitario', 89.90, 'desconto', 0)
      )
    );
    perform public.fechar_comanda(v_comanda_id, v_empresa_id, current_date + 3);
  end if;

  -- Comanda cancelada com motivo visivel nos detalhes.
  if not exists (
    select 1 from public.comandas
    where id_empresa = v_empresa_id and observacoes like '[DEMO FASE 9] COMANDA-CANCELADA%'
  ) then
    v_comanda_id := public.salvar_comanda(
      null, v_empresa_id, v_cliente_1, v_responsavel, 0, 0,
      '[DEMO FASE 9] COMANDA-CANCELADA | Exemplo para testar historico.',
      jsonb_build_array(
        jsonb_build_object('tipo_item', 'servico', 'id_servico', v_servico_1, 'id_produto', null, 'id_funcionario', v_funcionario_1, 'descricao', v_servico_nome_1, 'quantidade', 1, 'valor_unitario', v_servico_preco_1, 'desconto', 0)
      )
    );
    perform public.cancelar_comanda(
      v_comanda_id, v_empresa_id,
      'Cliente solicitou cancelamento antes do inicio do atendimento.'
    );
  end if;

  raise notice 'Carga demo de estoque, compras, orcamentos e comandas concluida.';
end;
$$;
