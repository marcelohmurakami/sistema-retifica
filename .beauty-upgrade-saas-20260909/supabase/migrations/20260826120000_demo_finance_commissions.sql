-- Carga controlada e idempotente para validar as Fases 10 e 11.
-- Executa somente na empresa de demonstracao Murakami Beauty (ID 10).

do $$
declare
  v_empresa_id bigint;
  v_user_id uuid;
  v_categoria_entrada bigint;
  v_categoria_saida bigint;
  v_forma_pix bigint;
  v_forma_dinheiro bigint;
  v_forma_debito bigint;
  v_caixa_id bigint;
  v_sessao_id bigint;
  v_conta_id bigint;
  v_parcela_id bigint;
  v_pagamento_id bigint;
  v_movimento_id bigint;
  v_cliente_id bigint;
  v_funcionario_1 bigint;
  v_funcionario_2 bigint;
  v_funcionario_3 bigint;
  v_servico_1 bigint;
  v_servico_2 bigint;
  v_servico_3 bigint;
  v_servico_nome_1 text;
  v_servico_nome_2 text;
  v_servico_nome_3 text;
  v_servico_preco_1 numeric;
  v_servico_preco_2 numeric;
  v_servico_preco_3 numeric;
  v_regra_id bigint;
  v_comanda_id bigint;
  v_lancamento_parcial bigint;
  v_lancamento_pago bigint;
  v_lancamento_estornado bigint;
  v_lancamento_liberado bigint;
  v_lancamento_pagamento_estornado bigint;
  v_pagamento_comissao_id bigint;
  v_relatorio_count integer;
  v_erro_esperado boolean;
  v_status text;
begin
  select e.id into v_empresa_id
  from public.empresas e
  where e.id = 10
    and lower(btrim(e.fantasia)) = lower('Murakami Beauty');

  if not found then
    raise notice 'Carga financeira/comissoes ignorada: empresa de demonstracao nao encontrada.';
    return;
  end if;

  select ue.user_id into v_user_id
  from public.usuarios_empresas ue
  where ue.empresa_id = v_empresa_id
    and ue.status = 'ativo'
    and ue.tipo in ('dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios)
  order by case when ue.tipo = 'dono'::public.tipos_usuarios then 0 else 1 end, ue.id
  limit 1;

  if v_user_id is null then
    raise exception 'A empresa de demonstracao precisa de um dono ou gerente ativo.';
  end if;

  perform set_config('request.jwt.claim.sub', v_user_id::text, true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user_id, 'role', 'authenticated')::text,
    true
  );

  perform private.configurar_financeiro_padrao(v_empresa_id);

  select id into v_categoria_entrada
  from public.categorias_financeiras
  where id_empresa = v_empresa_id and ativo and tipo in ('entrada', 'ambos')
  order by (nome = 'Serviços') desc, id
  limit 1;

  select id into v_categoria_saida
  from public.categorias_financeiras
  where id_empresa = v_empresa_id and ativo and tipo in ('saida', 'ambos')
  order by (nome = 'Despesas operacionais') desc, id
  limit 1;

  select id into v_forma_pix
  from public.formas_pagamento
  where id_empresa = v_empresa_id and ativo and tipo = 'pix'
  order by id limit 1;

  select id into v_forma_dinheiro
  from public.formas_pagamento
  where id_empresa = v_empresa_id and ativo and tipo = 'dinheiro'
  order by id limit 1;

  select id into v_forma_debito
  from public.formas_pagamento
  where id_empresa = v_empresa_id and ativo and tipo = 'cartao_debito'
  order by id limit 1;

  select id into v_caixa_id
  from public.caixas
  where id_empresa = v_empresa_id and ativo
  order by id limit 1;

  if v_categoria_entrada is null or v_categoria_saida is null
     or v_forma_pix is null or v_forma_dinheiro is null
     or v_forma_debito is null or v_caixa_id is null then
    raise exception 'Os catalogos financeiros padrao nao foram configurados corretamente.';
  end if;

  select id into v_sessao_id
  from public.sessoes_caixa
  where id_empresa = v_empresa_id and id_caixa = v_caixa_id and status = 'aberta'
  order by id desc limit 1;

  if v_sessao_id is null then
    v_sessao_id := public.abrir_sessao_caixa(
      v_empresa_id, v_caixa_id, 300,
      '[TESTE FINANCEIRO] Caixa aberto para cenarios integrados das Fases 10 e 11.'
    );
  end if;

  -- 1. Conta a receber futura com tres parcelas, ainda totalmente aberta.
  select id into v_conta_id from public.contas
  where id_empresa = v_empresa_id
    and descricao = '[TESTE FINANCEIRO] Pacote mensal de tratamentos'
  order by id limit 1;

  if v_conta_id is null then
    v_conta_id := public.salvar_conta_financeira(
      null, v_empresa_id, 'receber', v_categoria_entrada, null, null,
      '[TESTE FINANCEIRO] Pacote mensal de tratamentos', 'TF-REC-001',
      current_date, current_date, 1200, 3, current_date + 5,
      'Cenario aberto e parcelado para validar previsao de recebimentos.'
    );
  end if;

  -- 2. Conta a receber parcialmente paga em PIX.
  select id into v_conta_id from public.contas
  where id_empresa = v_empresa_id
    and descricao = '[TESTE FINANCEIRO] Venda corporativa parcelada'
  order by id limit 1;

  if v_conta_id is null then
    v_conta_id := public.salvar_conta_financeira(
      null, v_empresa_id, 'receber', v_categoria_entrada, null, null,
      '[TESTE FINANCEIRO] Venda corporativa parcelada', 'TF-REC-002',
      current_date - 25, current_date, 900, 2, current_date - 20,
      'Cenario com baixa parcial da primeira parcela.'
    );
  end if;

  if not exists (
    select 1 from public.pagamentos
    where id_empresa = v_empresa_id and referencia = '[TESTE FINANCEIRO] Recebimento parcial PIX'
  ) then
    select id into v_parcela_id from public.contas_parcelas
    where id_empresa = v_empresa_id and id_conta = v_conta_id
    order by numero_parcela limit 1;

    perform public.registrar_pagamento_financeiro(
      v_empresa_id, 'entrada', v_forma_pix, null, now() - interval '2 days',
      200, '[TESTE FINANCEIRO] Recebimento parcial PIX',
      'Baixa parcial para validar saldo e status da parcela.',
      jsonb_build_array(jsonb_build_object('id_parcela', v_parcela_id, 'valor', 200))
    );
  end if;

  -- 3. Despesa vencida e ainda sem pagamento.
  select id into v_conta_id from public.contas
  where id_empresa = v_empresa_id
    and descricao = '[TESTE FINANCEIRO] Aluguel do espaco'
  order by id limit 1;

  if v_conta_id is null then
    v_conta_id := public.salvar_conta_financeira(
      null, v_empresa_id, 'pagar', v_categoria_saida, null, null,
      '[TESTE FINANCEIRO] Aluguel do espaco', 'TF-PAG-001',
      current_date - 15, current_date, 1800, 1, current_date - 10,
      'Cenario vencido para testar alertas e relatorios.'
    );
  end if;

  -- 4. Despesa parcelada com uma baixa em dinheiro e reflexo no caixa.
  select id into v_conta_id from public.contas
  where id_empresa = v_empresa_id
    and descricao = '[TESTE FINANCEIRO] Compra de materiais de consumo'
  order by id limit 1;

  if v_conta_id is null then
    v_conta_id := public.salvar_conta_financeira(
      null, v_empresa_id, 'pagar', v_categoria_saida, null, null,
      '[TESTE FINANCEIRO] Compra de materiais de consumo', 'TF-PAG-002',
      current_date, current_date, 450, 2, current_date,
      'Cenario de pagamento em dinheiro integrado ao caixa.'
    );
  end if;

  if not exists (
    select 1 from public.pagamentos
    where id_empresa = v_empresa_id and referencia = '[TESTE FINANCEIRO] Pagamento parcial em dinheiro'
  ) then
    select id into v_parcela_id from public.contas_parcelas
    where id_empresa = v_empresa_id and id_conta = v_conta_id
    order by numero_parcela limit 1;

    perform public.registrar_pagamento_financeiro(
      v_empresa_id, 'saida', v_forma_dinheiro, v_sessao_id, now() - interval '1 day',
      225, '[TESTE FINANCEIRO] Pagamento parcial em dinheiro',
      'Primeira parcela quitada pelo caixa fisico.',
      jsonb_build_array(jsonb_build_object('id_parcela', v_parcela_id, 'valor', 225))
    );
  end if;

  -- 5. Receita integralmente recebida por cartao de debito.
  select id into v_conta_id from public.contas
  where id_empresa = v_empresa_id
    and descricao = '[TESTE FINANCEIRO] Receita recebida integralmente'
  order by id limit 1;

  if v_conta_id is null then
    v_conta_id := public.salvar_conta_financeira(
      null, v_empresa_id, 'receber', v_categoria_entrada, null, null,
      '[TESTE FINANCEIRO] Receita recebida integralmente', 'TF-REC-003',
      current_date - 3, current_date, 350, 1, current_date - 2,
      'Cenario concluido para validar conta paga.'
    );
  end if;

  if not exists (
    select 1 from public.pagamentos
    where id_empresa = v_empresa_id and referencia = '[TESTE FINANCEIRO] Recebimento integral no debito'
  ) then
    select id into v_parcela_id from public.contas_parcelas
    where id_empresa = v_empresa_id and id_conta = v_conta_id
    order by numero_parcela limit 1;

    perform public.registrar_pagamento_financeiro(
      v_empresa_id, 'entrada', v_forma_debito, null, now() - interval '1 day',
      350, '[TESTE FINANCEIRO] Recebimento integral no debito',
      'Receita completamente liquidada.',
      jsonb_build_array(jsonb_build_object('id_parcela', v_parcela_id, 'valor', 350))
    );
  end if;

  -- 6. Conta cancelada sem pagamentos.
  select id, status into v_conta_id, v_status from public.contas
  where id_empresa = v_empresa_id
    and descricao = '[TESTE FINANCEIRO] Despesa cancelada de demonstracao'
  order by id limit 1;

  if v_conta_id is null then
    v_conta_id := public.salvar_conta_financeira(
      null, v_empresa_id, 'pagar', v_categoria_saida, null, null,
      '[TESTE FINANCEIRO] Despesa cancelada de demonstracao', 'TF-PAG-003',
      current_date, current_date, 110, 1, current_date + 7,
      'Cenario usado para validar cancelamento sem baixa.'
    );
    v_status := 'aberta';
  end if;

  if v_status <> 'cancelada' then
    perform public.cancelar_conta_financeira(
      v_conta_id, v_empresa_id,
      'Cancelamento proposital para validar historico e motivo.'
    );
  end if;

  -- 7. Pagamento confirmado e depois estornado.
  select id into v_conta_id from public.contas
  where id_empresa = v_empresa_id
    and descricao = '[TESTE FINANCEIRO] Receita com pagamento estornado'
  order by id limit 1;

  if v_conta_id is null then
    v_conta_id := public.salvar_conta_financeira(
      null, v_empresa_id, 'receber', v_categoria_entrada, null, null,
      '[TESTE FINANCEIRO] Receita com pagamento estornado', 'TF-REC-004',
      current_date, current_date, 160, 1, current_date + 2,
      'Cenario para validar restauracao do saldo depois do estorno.'
    );
  end if;

  select id, status into v_pagamento_id, v_status from public.pagamentos
  where id_empresa = v_empresa_id
    and referencia = '[TESTE FINANCEIRO] Recebimento posteriormente estornado'
  order by id limit 1;

  if v_pagamento_id is null then
    select id into v_parcela_id from public.contas_parcelas
    where id_empresa = v_empresa_id and id_conta = v_conta_id
    order by numero_parcela limit 1;

    v_pagamento_id := public.registrar_pagamento_financeiro(
      v_empresa_id, 'entrada', v_forma_pix, null, now(),
      160, '[TESTE FINANCEIRO] Recebimento posteriormente estornado',
      'O estorno deste pagamento e intencional.',
      jsonb_build_array(jsonb_build_object('id_parcela', v_parcela_id, 'valor', 160))
    );
    v_status := 'confirmado';
  end if;

  if v_status = 'confirmado' then
    perform public.estornar_pagamento_financeiro(
      v_pagamento_id, v_empresa_id,
      'Estorno proposital para confirmar a restauracao da conta.'
    );
  end if;

  perform public.atualizar_vencimentos_financeiros(v_empresa_id);

  -- 8. Suprimento, sangria e movimento manual estornado.
  if not exists (
    select 1 from public.movimentos_caixa
    where id_empresa = v_empresa_id
      and descricao = '[TESTE FINANCEIRO] Suprimento para troco'
  ) then
    perform public.movimentar_caixa_manual(
      v_empresa_id, v_sessao_id, 'suprimento', 150,
      '[TESTE FINANCEIRO] Suprimento para troco'
    );
  end if;

  if not exists (
    select 1 from public.movimentos_caixa
    where id_empresa = v_empresa_id
      and descricao = '[TESTE FINANCEIRO] Sangria preventiva'
  ) then
    perform public.movimentar_caixa_manual(
      v_empresa_id, v_sessao_id, 'sangria', 75,
      '[TESTE FINANCEIRO] Sangria preventiva'
    );
  end if;

  select id, status into v_movimento_id, v_status
  from public.movimentos_caixa
  where id_empresa = v_empresa_id
    and descricao = '[TESTE FINANCEIRO] Ajuste manual posteriormente estornado'
  order by id limit 1;

  if v_movimento_id is null then
    v_movimento_id := public.movimentar_caixa_manual(
      v_empresa_id, v_sessao_id, 'ajuste_entrada', 25,
      '[TESTE FINANCEIRO] Ajuste manual posteriormente estornado'
    );
    v_status := 'ativo';
  end if;

  if v_status = 'ativo' then
    perform public.estornar_movimento_caixa(
      v_movimento_id, v_empresa_id,
      'Estorno proposital para validar movimentos manuais.'
    );
  end if;

  -- Catalogos necessarios para regras e comandas de comissao.
  select c.id into v_cliente_id
  from public.clientes c
  where c.id_empresa = v_empresa_id and c.ativo
  order by c.id limit 1;

  select fs.id_funcionario, fs.id_servico, s.nome, s.preco
    into v_funcionario_1, v_servico_1, v_servico_nome_1, v_servico_preco_1
  from public.funcionarios_servicos fs
  join public.funcionarios f on f.id = fs.id_funcionario and f.id_empresa = fs.id_empresa
  join public.servicos s on s.id = fs.id_servico and s.id_empresa = fs.id_empresa
  where fs.id_empresa = v_empresa_id and fs.ativo and f.ativo and s.ativo and s.preco > 0
  order by f.id, s.id limit 1;

  select fs.id_funcionario, fs.id_servico, s.nome, s.preco
    into v_funcionario_2, v_servico_2, v_servico_nome_2, v_servico_preco_2
  from public.funcionarios_servicos fs
  join public.funcionarios f on f.id = fs.id_funcionario and f.id_empresa = fs.id_empresa
  join public.servicos s on s.id = fs.id_servico and s.id_empresa = fs.id_empresa
  where fs.id_empresa = v_empresa_id and fs.ativo and f.ativo and s.ativo and s.preco > 0
    and fs.id_funcionario <> v_funcionario_1
  order by f.id, s.id limit 1;

  select fs.id_funcionario, fs.id_servico, s.nome, s.preco
    into v_funcionario_3, v_servico_3, v_servico_nome_3, v_servico_preco_3
  from public.funcionarios_servicos fs
  join public.funcionarios f on f.id = fs.id_funcionario and f.id_empresa = fs.id_empresa
  join public.servicos s on s.id = fs.id_servico and s.id_empresa = fs.id_empresa
  where fs.id_empresa = v_empresa_id and fs.ativo and f.ativo and s.ativo and s.preco > 0
    and fs.id_funcionario not in (v_funcionario_1, v_funcionario_2)
  order by f.id, s.id limit 1;

  if v_cliente_id is null or v_funcionario_1 is null
     or v_funcionario_2 is null or v_funcionario_3 is null then
    raise exception 'Sao necessarios um cliente e tres profissionais com servicos ativos para os testes.';
  end if;

  -- 9. Regra geral de fallback.
  select id into v_regra_id
  from public.comissoes_regras
  where id_empresa = v_empresa_id
    and id_funcionario is null and tipo_item = 'todos'
    and id_servico is null and id_produto is null
    and vigente_de = date '2026-08-01'
  order by id limit 1;

  perform public.salvar_regra_comissao(
    v_regra_id, v_empresa_id, null, 'todos', null, null,
    'percentual', 7, null, 'liquido_desconto', 'fechamento_comanda',
    date '2026-08-01', null, 10, true
  );

  -- 10. Regra especifica percentual, liberada no fechamento.
  select id into v_regra_id
  from public.comissoes_regras
  where id_empresa = v_empresa_id and id_funcionario = v_funcionario_1
    and tipo_item = 'servico' and id_servico = v_servico_1
    and vigente_de = date '2026-08-01'
  order by id limit 1;

  perform public.salvar_regra_comissao(
    v_regra_id, v_empresa_id, v_funcionario_1, 'servico', v_servico_1, null,
    'percentual', 15, null, 'liquido_desconto', 'fechamento_comanda',
    date '2026-08-01', null, 900, true
  );

  -- 11. Regra especifica de valor fixo.
  select id into v_regra_id
  from public.comissoes_regras
  where id_empresa = v_empresa_id and id_funcionario = v_funcionario_2
    and tipo_item = 'servico' and id_servico = v_servico_2
    and vigente_de = date '2026-08-01'
  order by id limit 1;

  perform public.salvar_regra_comissao(
    v_regra_id, v_empresa_id, v_funcionario_2, 'servico', v_servico_2, null,
    'valor_fixo', null, 22.50, 'liquido_desconto', 'fechamento_comanda',
    date '2026-08-01', null, 900, true
  );

  -- 12. Regra que somente libera depois do pagamento do cliente.
  select id into v_regra_id
  from public.comissoes_regras
  where id_empresa = v_empresa_id and id_funcionario = v_funcionario_3
    and tipo_item = 'servico' and id_servico = v_servico_3
    and vigente_de = date '2026-08-01'
  order by id limit 1;

  perform public.salvar_regra_comissao(
    v_regra_id, v_empresa_id, v_funcionario_3, 'servico', v_servico_3, null,
    'percentual', 12, null, 'bruto', 'pagamento_cliente',
    date '2026-08-01', null, 900, true
  );

  -- 13. Comanda real que gera comissao liberada automaticamente.
  select id, status into v_comanda_id, v_status
  from public.comandas
  where id_empresa = v_empresa_id
    and observacoes = '[TESTE COMISSOES] Comanda com liberacao no fechamento'
  order by id limit 1;

  if v_comanda_id is null then
    v_comanda_id := public.salvar_comanda(
      null, v_empresa_id, v_cliente_id, v_funcionario_1, 0, 0,
      '[TESTE COMISSOES] Comanda com liberacao no fechamento',
      jsonb_build_array(jsonb_build_object(
        'tipo_item', 'servico', 'id_servico', v_servico_1,
        'id_produto', null, 'id_funcionario', v_funcionario_1,
        'descricao', v_servico_nome_1, 'quantidade', 1,
        'valor_unitario', v_servico_preco_1, 'desconto', 0
      ))
    );
    v_status := 'aberta';
  end if;

  if v_status = 'aberta' then
    perform public.fechar_comanda(v_comanda_id, v_empresa_id, current_date + 3);
  end if;

  -- 14. Comanda real cuja comissao permanece prevista.
  select id, status into v_comanda_id, v_status
  from public.comandas
  where id_empresa = v_empresa_id
    and observacoes = '[TESTE COMISSOES] Comanda aguardando pagamento do cliente'
  order by id limit 1;

  if v_comanda_id is null then
    v_comanda_id := public.salvar_comanda(
      null, v_empresa_id, v_cliente_id, v_funcionario_3, 0, 0,
      '[TESTE COMISSOES] Comanda aguardando pagamento do cliente',
      jsonb_build_array(jsonb_build_object(
        'tipo_item', 'servico', 'id_servico', v_servico_3,
        'id_produto', null, 'id_funcionario', v_funcionario_3,
        'descricao', v_servico_nome_3, 'quantidade', 1,
        'valor_unitario', v_servico_preco_3, 'desconto', 0
      ))
    );
    v_status := 'aberta';
  end if;

  if v_status = 'aberta' then
    perform public.fechar_comanda(v_comanda_id, v_empresa_id, current_date + 5);
  end if;

  -- 15. Ajustes manuais cobrindo liberada, parcial, paga, estornada e estorno de pagamento.
  select id into v_lancamento_parcial
  from public.lancamentos_comissao
  where id_empresa = v_empresa_id
    and descricao_snapshot = '[TESTE COMISSOES] Bonus com pagamento parcial'
  order by id limit 1;
  if v_lancamento_parcial is null then
    v_lancamento_parcial := public.criar_ajuste_comissao(
      v_empresa_id, v_funcionario_1,
      '[TESTE COMISSOES] Bonus com pagamento parcial', 120, current_date
    );
  end if;

  select id into v_lancamento_pago
  from public.lancamentos_comissao
  where id_empresa = v_empresa_id
    and descricao_snapshot = '[TESTE COMISSOES] Premio pago integralmente'
  order by id limit 1;
  if v_lancamento_pago is null then
    v_lancamento_pago := public.criar_ajuste_comissao(
      v_empresa_id, v_funcionario_2,
      '[TESTE COMISSOES] Premio pago integralmente', 80, current_date
    );
  end if;

  select id, status into v_lancamento_estornado, v_status
  from public.lancamentos_comissao
  where id_empresa = v_empresa_id
    and descricao_snapshot = '[TESTE COMISSOES] Ajuste posteriormente estornado'
  order by id limit 1;
  if v_lancamento_estornado is null then
    v_lancamento_estornado := public.criar_ajuste_comissao(
      v_empresa_id, v_funcionario_3,
      '[TESTE COMISSOES] Ajuste posteriormente estornado', 45, current_date
    );
    v_status := 'liberada';
  end if;
  if v_status <> 'estornada' then
    perform public.estornar_lancamento_comissao(
      v_empresa_id, v_lancamento_estornado,
      'Estorno proposital para validar o historico da comissao.'
    );
  end if;

  select id into v_lancamento_liberado
  from public.lancamentos_comissao
  where id_empresa = v_empresa_id
    and descricao_snapshot = '[TESTE COMISSOES] Bonus liberado para proximo pagamento'
  order by id limit 1;
  if v_lancamento_liberado is null then
    v_lancamento_liberado := public.criar_ajuste_comissao(
      v_empresa_id, v_funcionario_1,
      '[TESTE COMISSOES] Bonus liberado para proximo pagamento', 95, current_date
    );
  end if;

  select id into v_lancamento_pagamento_estornado
  from public.lancamentos_comissao
  where id_empresa = v_empresa_id
    and descricao_snapshot = '[TESTE COMISSOES] Pagamento posteriormente estornado'
  order by id limit 1;
  if v_lancamento_pagamento_estornado is null then
    v_lancamento_pagamento_estornado := public.criar_ajuste_comissao(
      v_empresa_id, v_funcionario_2,
      '[TESTE COMISSOES] Pagamento posteriormente estornado', 60, current_date
    );
  end if;

  if not exists (
    select 1 from public.pagamentos_comissao
    where id_empresa = v_empresa_id
      and observacoes = '[TESTE COMISSOES] Quitacao parcial em PIX'
  ) then
    perform public.registrar_pagamento_comissao(
      v_empresa_id, v_funcionario_1, v_forma_pix, null, now(),
      date_trunc('month', current_date)::date, current_date,
      '[TESTE COMISSOES] Quitacao parcial em PIX',
      jsonb_build_array(jsonb_build_object(
        'id_lancamento_comissao', v_lancamento_parcial, 'valor', 45
      ))
    );
  end if;

  if not exists (
    select 1 from public.pagamentos_comissao
    where id_empresa = v_empresa_id
      and observacoes = '[TESTE COMISSOES] Quitacao integral em dinheiro'
  ) then
    perform public.registrar_pagamento_comissao(
      v_empresa_id, v_funcionario_2, v_forma_dinheiro, v_sessao_id, now(),
      date_trunc('month', current_date)::date, current_date,
      '[TESTE COMISSOES] Quitacao integral em dinheiro',
      jsonb_build_array(jsonb_build_object(
        'id_lancamento_comissao', v_lancamento_pago, 'valor', 80
      ))
    );
  end if;

  select id, status into v_pagamento_comissao_id, v_status
  from public.pagamentos_comissao
  where id_empresa = v_empresa_id
    and observacoes = '[TESTE COMISSOES] Pagamento criado para testar estorno'
  order by id limit 1;

  if v_pagamento_comissao_id is null then
    v_pagamento_comissao_id := public.registrar_pagamento_comissao(
      v_empresa_id, v_funcionario_2, v_forma_pix, null, now(),
      date_trunc('month', current_date)::date, current_date,
      '[TESTE COMISSOES] Pagamento criado para testar estorno',
      jsonb_build_array(jsonb_build_object(
        'id_lancamento_comissao', v_lancamento_pagamento_estornado, 'valor', 60
      ))
    );
    v_status := 'confirmado';
  end if;

  if v_status = 'confirmado' then
    perform public.estornar_pagamento_comissao(
      v_empresa_id, v_pagamento_comissao_id,
      'Estorno proposital para validar financeiro e restauracao do saldo.'
    );
  end if;

  -- Testes negativos: todos precisam ser rejeitados sem deixar residuos.
  v_erro_esperado := false;
  begin
    select cp.id into v_parcela_id
    from public.contas_parcelas cp
    join public.contas c on c.id = cp.id_conta
    where c.id_empresa = v_empresa_id
      and c.descricao = '[TESTE FINANCEIRO] Pacote mensal de tratamentos'
    order by cp.numero_parcela limit 1;

    perform public.registrar_pagamento_financeiro(
      v_empresa_id, 'entrada', v_forma_pix, null, now(), 99999,
      '[TESTE NEGATIVO] Valor acima da parcela', null,
      jsonb_build_array(jsonb_build_object('id_parcela', v_parcela_id, 'valor', 99999))
    );
  exception when others then
    if sqlerrm ilike '%ultrapassa o saldo%' then
      v_erro_esperado := true;
    else
      raise;
    end if;
  end;
  if not v_erro_esperado then
    raise exception 'TESTE FALHOU: pagamento financeiro acima do saldo foi aceito.';
  end if;

  v_erro_esperado := false;
  begin
    perform public.registrar_pagamento_comissao(
      v_empresa_id, v_funcionario_1, v_forma_pix, null, now(),
      current_date, current_date, '[TESTE NEGATIVO] Comissao acima do saldo',
      jsonb_build_array(jsonb_build_object(
        'id_lancamento_comissao', v_lancamento_liberado, 'valor', 99999
      ))
    );
  exception when others then
    if sqlerrm ilike '%saldo%' or sqlerrm ilike '%ultrapassa%' then
      v_erro_esperado := true;
    else
      raise;
    end if;
  end;
  if not v_erro_esperado then
    raise exception 'TESTE FALHOU: pagamento de comissao acima do saldo foi aceito.';
  end if;

  v_erro_esperado := false;
  begin
    perform public.estornar_lancamento_comissao(
      v_empresa_id, v_lancamento_parcial,
      'Este estorno deve ser bloqueado porque existe pagamento parcial.'
    );
  exception when others then
    if sqlerrm ilike '%Estorne primeiro os pagamentos%' then
      v_erro_esperado := true;
    else
      raise;
    end if;
  end;
  if not v_erro_esperado then
    raise exception 'TESTE FALHOU: comissao parcialmente paga foi estornada diretamente.';
  end if;

  select id_pagamento into v_pagamento_id
  from public.pagamentos_comissao
  where id_empresa = v_empresa_id
    and observacoes = '[TESTE COMISSOES] Quitacao integral em dinheiro'
    and status = 'confirmado'
  order by id limit 1;

  v_erro_esperado := false;
  begin
    perform public.estornar_pagamento_financeiro(
      v_pagamento_id, v_empresa_id,
      'Este estorno deve ser bloqueado no Financeiro.'
    );
  exception when others then
    if sqlerrm ilike '%pertence a uma comissão%' then
      v_erro_esperado := true;
    else
      raise;
    end if;
  end;
  if not v_erro_esperado then
    raise exception 'TESTE FALHOU: pagamento de comissao foi estornado pelo modulo Financeiro.';
  end if;

  -- Assercoes finais de integridade financeira.
  if (select status from public.contas where id_empresa = v_empresa_id and descricao = '[TESTE FINANCEIRO] Venda corporativa parcelada') <> 'parcial' then
    raise exception 'TESTE FALHOU: conta parcialmente recebida nao ficou parcial.';
  end if;
  if (select status from public.contas where id_empresa = v_empresa_id and descricao = '[TESTE FINANCEIRO] Aluguel do espaco') <> 'vencida' then
    raise exception 'TESTE FALHOU: despesa vencida nao ficou vencida.';
  end if;
  if (select status from public.contas where id_empresa = v_empresa_id and descricao = '[TESTE FINANCEIRO] Receita recebida integralmente') <> 'paga' then
    raise exception 'TESTE FALHOU: receita quitada nao ficou paga.';
  end if;
  if (select status from public.contas where id_empresa = v_empresa_id and descricao = '[TESTE FINANCEIRO] Despesa cancelada de demonstracao') <> 'cancelada' then
    raise exception 'TESTE FALHOU: conta cancelada nao ficou cancelada.';
  end if;
  if (select status from public.pagamentos where id_empresa = v_empresa_id and referencia = '[TESTE FINANCEIRO] Recebimento posteriormente estornado') <> 'estornado' then
    raise exception 'TESTE FALHOU: pagamento financeiro nao ficou estornado.';
  end if;
  if (select status from public.movimentos_caixa where id = v_movimento_id) <> 'estornado' then
    raise exception 'TESTE FALHOU: movimento manual nao ficou estornado.';
  end if;

  select count(*) into v_relatorio_count
  from public.relatorio_fluxo_financeiro(
    v_empresa_id,
    (date_trunc('month', current_date) - interval '1 month')::date,
    (date_trunc('month', current_date) + interval '3 months - 1 day')::date
  );
  if v_relatorio_count <> 4 then
    raise exception 'TESTE FALHOU: relatorio financeiro nao retornou os quatro meses solicitados.';
  end if;

  -- Assercoes finais de integridade das comissoes.
  if not exists (
    select 1 from public.lancamentos_comissao lc
    join public.comandas c on c.id = lc.id_comanda
    where lc.id_empresa = v_empresa_id
      and c.observacoes = '[TESTE COMISSOES] Comanda com liberacao no fechamento'
      and lc.status = 'liberada' and lc.momento_liberacao = 'fechamento_comanda'
  ) then
    raise exception 'TESTE FALHOU: fechamento da comanda nao gerou comissao liberada.';
  end if;

  if not exists (
    select 1 from public.lancamentos_comissao lc
    join public.comandas c on c.id = lc.id_comanda
    where lc.id_empresa = v_empresa_id
      and c.observacoes = '[TESTE COMISSOES] Comanda aguardando pagamento do cliente'
      and lc.status = 'prevista' and lc.momento_liberacao = 'pagamento_cliente'
  ) then
    raise exception 'TESTE FALHOU: comissao aguardando pagamento nao ficou prevista.';
  end if;

  if (select status from public.lancamentos_comissao where id = v_lancamento_parcial) <> 'parcial' then
    raise exception 'TESTE FALHOU: comissao parcialmente paga nao ficou parcial.';
  end if;
  if (select valor_pago from public.lancamentos_comissao where id = v_lancamento_parcial) <> 45 then
    raise exception 'TESTE FALHOU: valor pago da comissao parcial esta incorreto.';
  end if;
  if (select status from public.lancamentos_comissao where id = v_lancamento_pago) <> 'paga' then
    raise exception 'TESTE FALHOU: comissao quitada nao ficou paga.';
  end if;
  if (select status from public.lancamentos_comissao where id = v_lancamento_estornado) <> 'estornada' then
    raise exception 'TESTE FALHOU: ajuste estornado nao ficou estornado.';
  end if;
  if (select status from public.lancamentos_comissao where id = v_lancamento_pagamento_estornado) <> 'liberada' then
    raise exception 'TESTE FALHOU: estorno do pagamento nao restaurou a comissao liberada.';
  end if;
  if (select status from public.pagamentos_comissao where id = v_pagamento_comissao_id) <> 'cancelado' then
    raise exception 'TESTE FALHOU: pagamento de comissao estornado nao ficou cancelado.';
  end if;
  if not exists (
    select 1 from public.pagamentos_comissao pc
    join public.pagamentos p on p.id = pc.id_pagamento and p.id_empresa = pc.id_empresa
    where pc.id_empresa = v_empresa_id
      and pc.observacoes = '[TESTE COMISSOES] Quitacao integral em dinheiro'
      and pc.status = 'confirmado' and p.status = 'confirmado'
      and p.tipo = 'saida' and p.id_sessao_caixa = v_sessao_id
  ) then
    raise exception 'TESTE FALHOU: pagamento de comissao nao integrou financeiro e caixa.';
  end if;

  select count(*) into v_relatorio_count
  from public.relatorio_comissoes_funcionario(
    v_empresa_id,
    (date_trunc('month', current_date) - interval '1 month')::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date
  ) r
  where r.comissoes_geradas > 0 or r.comissoes_pagas > 0 or r.saldo_a_pagar > 0;
  if v_relatorio_count < 3 then
    raise exception 'TESTE FALHOU: relatorio de comissoes nao consolidou os tres profissionais.';
  end if;

  raise notice 'Carga e testes das Fases 10 e 11 concluidos com sucesso para a empresa %.', v_empresa_id;
end;
$$;
