-- Fase 10: operacoes atomicas de contas, pagamentos, caixa e relatorios.
-- Os triggers privados existentes continuam sendo a fonte de verdade para
-- saldos, baixas de parcelas, movimentos de caixa e auditoria.

create or replace function private.configurar_financeiro_padrao(p_id_empresa bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categorias_financeiras (id_empresa, nome, tipo, ativo)
  select p_id_empresa, v.nome, v.tipo, true
  from (values
    ('Serviços', 'entrada'),
    ('Venda de produtos', 'entrada'),
    ('Fornecedores', 'saida'),
    ('Despesas operacionais', 'saida'),
    ('Salários e comissões', 'saida'),
    ('Impostos e taxas', 'saida'),
    ('Outros', 'ambos')
  ) as v(nome, tipo)
  where not exists (
    select 1
    from public.categorias_financeiras c
    where c.id_empresa = p_id_empresa
      and lower(btrim(c.nome)) = lower(v.nome)
  );

  insert into public.formas_pagamento (
    id_empresa, nome, tipo, permite_parcelamento, max_parcelas,
    taxa_percentual, prazo_recebimento_dias, ativo
  )
  select p_id_empresa, v.nome, v.tipo, v.parcela, v.maximo, v.taxa, v.prazo, true
  from (values
    ('Dinheiro', 'dinheiro', false, 1::smallint, 0::numeric, 0),
    ('PIX', 'pix', false, 1::smallint, 0::numeric, 0),
    ('Cartão de débito', 'cartao_debito', false, 1::smallint, 1.50::numeric, 1),
    ('Cartão de crédito', 'cartao_credito', true, 12::smallint, 3.50::numeric, 30),
    ('Transferência', 'transferencia', false, 1::smallint, 0::numeric, 0),
    ('Boleto', 'boleto', true, 12::smallint, 0::numeric, 1)
  ) as v(nome, tipo, parcela, maximo, taxa, prazo)
  where not exists (
    select 1
    from public.formas_pagamento f
    where f.id_empresa = p_id_empresa
      and lower(btrim(f.nome)) = lower(v.nome)
  );

  insert into public.caixas (
    id_empresa, nome, codigo, descricao, localizacao,
    permite_saldo_negativo, ativo
  )
  select p_id_empresa, 'Caixa principal', 'CX-01',
         'Caixa padrão da empresa', 'Recepção', false, true
  where not exists (
    select 1 from public.caixas c
    where c.id_empresa = p_id_empresa
  );
end;
$$;

create or replace function private.configurar_financeiro_nova_empresa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.configurar_financeiro_padrao(new.id);
  return new;
end;
$$;

drop trigger if exists empresas_configurar_financeiro_padrao on public.empresas;
create trigger empresas_configurar_financeiro_padrao
after insert on public.empresas
for each row execute function private.configurar_financeiro_nova_empresa();

do $$
declare
  v_empresa record;
begin
  for v_empresa in select id from public.empresas
  loop
    perform private.configurar_financeiro_padrao(v_empresa.id);
  end loop;
end;
$$;

-- Impede que alocacoes de pagamentos estornados bloqueiem um novo pagamento
-- da mesma parcela e serializa alteracoes concorrentes na parcela.
create or replace function private.validar_alocacao_pagamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empresa_pagamento bigint;
  v_tipo_pagamento text;
  v_valor_pagamento numeric;
  v_empresa_parcela bigint;
  v_tipo_conta text;
  v_valor_parcela numeric;
  v_soma_pagamento numeric;
  v_soma_parcela numeric;
begin
  if tg_op = 'UPDATE' and (
    new.id_pagamento is distinct from old.id_pagamento
    or new.id_parcela is distinct from old.id_parcela
  ) then
    raise exception 'Não é permitido trocar o pagamento ou a parcela de uma alocação.';
  end if;

  select p.id_empresa, p.tipo, p.valor
    into v_empresa_pagamento, v_tipo_pagamento, v_valor_pagamento
  from public.pagamentos p
  where p.id = new.id_pagamento and p.status <> 'estornado';
  if not found then raise exception 'Pagamento inexistente ou estornado.'; end if;

  select cp.id_empresa, c.tipo, cp.valor_parcela
    into v_empresa_parcela, v_tipo_conta, v_valor_parcela
  from public.contas_parcelas cp
  join public.contas c on c.id = cp.id_conta
  where cp.id = new.id_parcela
    and cp.status <> 'cancelada'
    and c.status <> 'cancelada'
  for update of cp;
  if not found then raise exception 'Parcela ou conta inexistente ou cancelada.'; end if;

  if v_empresa_pagamento <> v_empresa_parcela then
    raise exception 'Pagamento e parcela pertencem a empresas diferentes.';
  end if;
  if (v_tipo_pagamento = 'entrada' and v_tipo_conta <> 'receber')
     or (v_tipo_pagamento = 'saida' and v_tipo_conta <> 'pagar') then
    raise exception 'O tipo do pagamento não corresponde ao tipo da conta.';
  end if;

  select coalesce(sum(pa.valor), 0) into v_soma_pagamento
  from public.pagamentos_alocacoes pa
  where pa.id_pagamento = new.id_pagamento
    and pa.id <> coalesce(new.id, -1);

  select coalesce(sum(pa.valor), 0) into v_soma_parcela
  from public.pagamentos_alocacoes pa
  join public.pagamentos p on p.id = pa.id_pagamento and p.status <> 'estornado'
  where pa.id_parcela = new.id_parcela
    and pa.id <> coalesce(new.id, -1);

  if v_soma_pagamento + new.valor > v_valor_pagamento then
    raise exception 'As alocações ultrapassam o valor do pagamento.';
  end if;
  if v_soma_parcela + new.valor > v_valor_parcela then
    raise exception 'Os pagamentos ultrapassam o valor da parcela.';
  end if;

  new.id_empresa := v_empresa_pagamento;
  return new;
end;
$$;

-- As tabelas transacionais ficam somente leitura pelo cliente. Todas as
-- mutacoes passam pelas funcoes atomicas abaixo.
drop policy if exists contas_equipe_insere on public.contas;
drop policy if exists contas_equipe_atualiza on public.contas;
drop policy if exists contas_parcelas_equipe_insere on public.contas_parcelas;
drop policy if exists contas_parcelas_equipe_atualiza on public.contas_parcelas;
drop policy if exists pagamentos_equipe_insere on public.pagamentos;
drop policy if exists pagamentos_equipe_atualiza on public.pagamentos;
drop policy if exists pagamentos_alocacoes_equipe_insere on public.pagamentos_alocacoes;
drop policy if exists pagamentos_alocacoes_equipe_atualiza on public.pagamentos_alocacoes;
drop policy if exists sessoes_caixa_equipe_insere on public.sessoes_caixa;
drop policy if exists sessoes_caixa_equipe_atualiza on public.sessoes_caixa;
drop policy if exists movimentos_caixa_equipe_insere on public.movimentos_caixa;
drop policy if exists movimentos_caixa_equipe_atualiza on public.movimentos_caixa;

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

create or replace function public.cancelar_conta_financeira(
  p_conta_id bigint,
  p_id_empresa bigint,
  p_motivo text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conta record;
begin
  select c.* into v_conta
  from public.contas c
  where c.id = p_conta_id and c.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Conta não encontrada.'; end if;
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      v_conta.tipo = 'receber'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para cancelar esta conta.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do cancelamento.';
  end if;
  if v_conta.status = 'cancelada' then return 'cancelada'; end if;
  if exists (
    select 1
    from public.contas_parcelas cp
    join public.pagamentos_alocacoes pa on pa.id_parcela = cp.id
    join public.pagamentos p on p.id = pa.id_pagamento and p.status = 'confirmado'
    where cp.id_conta = p_conta_id
  ) then
    raise exception 'A conta possui pagamentos confirmados. Estorne-os antes de cancelar.';
  end if;

  update public.contas_parcelas
     set status = 'cancelada', paga_em = null
   where id_conta = p_conta_id and id_empresa = p_id_empresa;

  update public.contas
     set status = 'cancelada', cancelada_em = now(),
         motivo_cancelamento = btrim(p_motivo),
         valor_total = v_conta.valor_total,
         valor_pago = v_conta.valor_pago
   where id = p_conta_id and id_empresa = p_id_empresa;

  return 'cancelada';
end;
$$;

create or replace function public.atualizar_vencimentos_financeiros(
  p_id_empresa bigint
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quantidade integer;
  v_conta_id bigint;
begin
  if not private.usuario_pertence_empresa(p_id_empresa) then
    raise exception 'Você não possui acesso a esta empresa.';
  end if;

  update public.contas_parcelas cp
     set status = case
       when cp.data_vencimento < current_date then 'atrasada'
       else 'aberta'
     end,
     updated_at = now()
   where cp.id_empresa = p_id_empresa
     and cp.valor_pago = 0
     and cp.status in ('aberta', 'atrasada');
  get diagnostics v_quantidade = row_count;

  for v_conta_id in
    select c.id from public.contas c
    where c.id_empresa = p_id_empresa
      and c.status in ('aberta', 'vencida')
  loop
    perform private.recalcular_conta(v_conta_id);
  end loop;

  return v_quantidade;
end;
$$;

create or replace function public.registrar_pagamento_financeiro(
  p_id_empresa bigint,
  p_tipo text,
  p_id_forma_pagamento bigint,
  p_id_sessao_caixa bigint,
  p_data_pagamento timestamptz,
  p_valor numeric,
  p_referencia text,
  p_observacoes text,
  p_alocacoes jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento_id bigint;
  v_forma_tipo text;
  v_item jsonb;
  v_parcela_id bigint;
  v_valor_alocacao numeric(14,2);
  v_saldo_parcela numeric(14,2);
  v_tipo_conta text;
  v_total_alocado numeric(14,2) := 0;
begin
  if p_tipo not in ('entrada', 'saida') then
    raise exception 'Tipo de pagamento inválido.';
  end if;
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      p_tipo = 'entrada'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para registrar este pagamento.';
  end if;
  if coalesce(p_valor, 0) <= 0 then
    raise exception 'O valor do pagamento deve ser maior que zero.';
  end if;
  if p_alocacoes is null
     or jsonb_typeof(p_alocacoes) <> 'array'
     or jsonb_array_length(p_alocacoes) = 0 then
    raise exception 'Selecione pelo menos uma parcela para o pagamento.';
  end if;

  select f.tipo into v_forma_tipo
  from public.formas_pagamento f
  where f.id = p_id_forma_pagamento
    and f.id_empresa = p_id_empresa
    and f.ativo;
  if not found then raise exception 'Forma de pagamento inválida ou inativa.'; end if;

  if p_id_sessao_caixa is not null then
    if v_forma_tipo <> 'dinheiro' then
      raise exception 'Somente pagamentos em dinheiro movimentam o caixa físico.';
    end if;
    if not exists (
      select 1 from public.sessoes_caixa s
      where s.id = p_id_sessao_caixa
        and s.id_empresa = p_id_empresa
        and s.status = 'aberta'
    ) then
      raise exception 'Sessão de caixa inválida ou fechada.';
    end if;
  end if;

  for v_item in select value from jsonb_array_elements(p_alocacoes)
  loop
    v_parcela_id := nullif(v_item->>'id_parcela', '')::bigint;
    v_valor_alocacao := nullif(v_item->>'valor', '')::numeric;
    if v_parcela_id is null or coalesce(v_valor_alocacao, 0) <= 0 then
      raise exception 'Revise as parcelas e os valores do pagamento.';
    end if;

    select cp.valor_parcela - cp.valor_pago, c.tipo
      into v_saldo_parcela, v_tipo_conta
    from public.contas_parcelas cp
    join public.contas c on c.id = cp.id_conta and c.id_empresa = cp.id_empresa
    where cp.id = v_parcela_id
      and cp.id_empresa = p_id_empresa
      and cp.status <> 'cancelada'
      and c.status <> 'cancelada'
    for update of cp;

    if not found then raise exception 'Parcela inválida ou cancelada.'; end if;
    if (p_tipo = 'entrada' and v_tipo_conta <> 'receber')
       or (p_tipo = 'saida' and v_tipo_conta <> 'pagar') then
      raise exception 'O tipo do pagamento não corresponde ao tipo da conta.';
    end if;
    if v_valor_alocacao > v_saldo_parcela then
      raise exception 'O pagamento ultrapassa o saldo da parcela.';
    end if;
    v_total_alocado := v_total_alocado + v_valor_alocacao;
  end loop;

  if round(v_total_alocado, 2) <> round(p_valor, 2) then
    raise exception 'O valor do pagamento deve corresponder à soma das parcelas.';
  end if;

  insert into public.pagamentos (
    id_empresa, tipo, id_forma_pagamento, id_sessao_caixa,
    data_pagamento, valor, valor_alocado, status,
    referencia, observacoes, criado_por
  ) values (
    p_id_empresa, p_tipo, p_id_forma_pagamento, p_id_sessao_caixa,
    coalesce(p_data_pagamento, now()), p_valor, 0, 'confirmado',
    nullif(btrim(p_referencia), ''), nullif(btrim(p_observacoes), ''), auth.uid()
  ) returning id into v_pagamento_id;

  for v_item in select value from jsonb_array_elements(p_alocacoes)
  loop
    insert into public.pagamentos_alocacoes (
      id_empresa, id_pagamento, id_parcela, valor
    ) values (
      p_id_empresa, v_pagamento_id,
      (v_item->>'id_parcela')::bigint,
      (v_item->>'valor')::numeric
    );
  end loop;

  return v_pagamento_id;
end;
$$;

create or replace function public.estornar_pagamento_financeiro(
  p_pagamento_id bigint,
  p_id_empresa bigint,
  p_motivo text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento record;
begin
  select p.* into v_pagamento
  from public.pagamentos p
  where p.id = p_pagamento_id and p.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Pagamento não encontrado.'; end if;
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      v_pagamento.tipo = 'entrada'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para estornar este pagamento.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;
  if v_pagamento.status = 'estornado' then return 'estornado'; end if;
  if v_pagamento.status <> 'confirmado' then
    raise exception 'Somente pagamentos confirmados podem ser estornados.';
  end if;

  update public.pagamentos
     set status = 'estornado', estornado_em = now(),
         estornado_por = auth.uid(), motivo_estorno = btrim(p_motivo)
   where id = p_pagamento_id and id_empresa = p_id_empresa;

  return 'estornado';
end;
$$;

create or replace function public.abrir_sessao_caixa(
  p_id_empresa bigint,
  p_id_caixa bigint,
  p_saldo_inicial numeric,
  p_observacoes text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios, 'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para abrir o caixa.';
  end if;
  if coalesce(p_saldo_inicial, -1) < 0 then
    raise exception 'O saldo inicial não pode ser negativo.';
  end if;
  if not exists (
    select 1 from public.caixas c
    where c.id = p_id_caixa and c.id_empresa = p_id_empresa and c.ativo
  ) then
    raise exception 'Caixa inválido ou inativo.';
  end if;
  if exists (
    select 1 from public.sessoes_caixa s
    where s.id_empresa = p_id_empresa
      and s.id_caixa = p_id_caixa
      and s.status = 'aberta'
  ) then
    raise exception 'Este caixa já possui uma sessão aberta.';
  end if;

  insert into public.sessoes_caixa (
    id_empresa, id_caixa, status, saldo_inicial,
    observacoes_abertura, aberta_por
  ) values (
    p_id_empresa, p_id_caixa, 'aberta', p_saldo_inicial,
    nullif(btrim(p_observacoes), ''), auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.fechar_sessao_caixa(
  p_sessao_id bigint,
  p_id_empresa bigint,
  p_saldo_contado numeric,
  p_observacoes text
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sessao record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios, 'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para fechar o caixa.';
  end if;
  if coalesce(p_saldo_contado, -1) < 0 then
    raise exception 'O saldo contado não pode ser negativo.';
  end if;

  select s.* into v_sessao
  from public.sessoes_caixa s
  where s.id = p_sessao_id and s.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Sessão de caixa não encontrada.'; end if;
  if v_sessao.status <> 'aberta' then
    raise exception 'Somente sessões abertas podem ser fechadas.';
  end if;

  update public.sessoes_caixa
     set status = 'fechada', saldo_final_informado = p_saldo_contado,
         observacoes_fechamento = nullif(btrim(p_observacoes), '')
   where id = p_sessao_id and id_empresa = p_id_empresa;

  select s.* into v_sessao
  from public.sessoes_caixa s
  where s.id = p_sessao_id and s.id_empresa = p_id_empresa;
  return v_sessao.diferenca;
end;
$$;

create or replace function public.movimentar_caixa_manual(
  p_id_empresa bigint,
  p_id_sessao_caixa bigint,
  p_tipo text,
  p_valor numeric,
  p_descricao text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios, 'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para movimentar o caixa.';
  end if;
  if p_tipo not in ('suprimento', 'sangria', 'ajuste_entrada', 'ajuste_saida') then
    raise exception 'Tipo de movimento manual inválido.';
  end if;
  if coalesce(p_valor, 0) <= 0 then
    raise exception 'O valor do movimento deve ser maior que zero.';
  end if;
  if nullif(btrim(p_descricao), '') is null then
    raise exception 'Informe a descrição do movimento.';
  end if;

  insert into public.movimentos_caixa (
    id_empresa, id_caixa, id_sessao_caixa, tipo, origem,
    status, valor, descricao, ocorrido_em, criado_por
  ) values (
    p_id_empresa, 0, p_id_sessao_caixa, p_tipo, 'manual',
    'ativo', p_valor, btrim(p_descricao), now(), auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.estornar_movimento_caixa(
  p_movimento_id bigint,
  p_id_empresa bigint,
  p_motivo text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_movimento record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios, 'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para estornar este movimento.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;

  select m.* into v_movimento
  from public.movimentos_caixa m
  where m.id = p_movimento_id and m.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Movimento de caixa não encontrado.'; end if;
  if v_movimento.origem <> 'manual' then
    raise exception 'Movimentos de pagamentos devem ser estornados pelo pagamento.';
  end if;
  if v_movimento.status = 'estornado' then return 'estornado'; end if;

  update public.movimentos_caixa
     set status = 'estornado', motivo_estorno = btrim(p_motivo),
         estornado_em = now(), estornado_por = auth.uid()
   where id = p_movimento_id and id_empresa = p_id_empresa;
  return 'estornado';
end;
$$;

create or replace function public.relatorio_fluxo_financeiro(
  p_id_empresa bigint,
  p_data_inicio date,
  p_data_fim date
)
returns table (
  mes date,
  receitas_previstas numeric,
  despesas_previstas numeric,
  receitas_realizadas numeric,
  despesas_realizadas numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fuso text;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para visualizar relatórios financeiros.';
  end if;
  if p_data_inicio is null or p_data_fim is null or p_data_fim < p_data_inicio then
    raise exception 'Período do relatório inválido.';
  end if;
  if p_data_fim > p_data_inicio + interval '24 months' then
    raise exception 'O relatório está limitado a 24 meses por consulta.';
  end if;

  select coalesce(e.fuso_horario, 'America/Sao_Paulo') into v_fuso
  from public.empresas e where e.id = p_id_empresa;

  return query
  with meses as (
    select generate_series(
      date_trunc('month', p_data_inicio::timestamp),
      date_trunc('month', p_data_fim::timestamp),
      interval '1 month'
    )::date as mes
  ), previsto as (
    select date_trunc('month', cp.data_vencimento::timestamp)::date as mes,
           coalesce(sum(cp.valor_parcela) filter (where c.tipo = 'receber'), 0) as receitas,
           coalesce(sum(cp.valor_parcela) filter (where c.tipo = 'pagar'), 0) as despesas
    from public.contas_parcelas cp
    join public.contas c on c.id = cp.id_conta and c.id_empresa = cp.id_empresa
    where cp.id_empresa = p_id_empresa
      and cp.data_vencimento between p_data_inicio and p_data_fim
      and cp.status <> 'cancelada' and c.status <> 'cancelada'
    group by 1
  ), realizado as (
    select date_trunc('month', p.data_pagamento at time zone v_fuso)::date as mes,
           coalesce(sum(p.valor) filter (where p.tipo = 'entrada'), 0) as receitas,
           coalesce(sum(p.valor) filter (where p.tipo = 'saida'), 0) as despesas
    from public.pagamentos p
    where p.id_empresa = p_id_empresa
      and (p.data_pagamento at time zone v_fuso)::date between p_data_inicio and p_data_fim
      and p.status = 'confirmado'
    group by 1
  )
  select m.mes,
         coalesce(pr.receitas, 0)::numeric,
         coalesce(pr.despesas, 0)::numeric,
         coalesce(re.receitas, 0)::numeric,
         coalesce(re.despesas, 0)::numeric
  from meses m
  left join previsto pr on pr.mes = m.mes
  left join realizado re on re.mes = m.mes
  order by m.mes;
end;
$$;

revoke all on function public.salvar_conta_financeira(bigint,bigint,text,bigint,bigint,bigint,text,text,date,date,numeric,integer,date,text) from public;
grant execute on function public.salvar_conta_financeira(bigint,bigint,text,bigint,bigint,bigint,text,text,date,date,numeric,integer,date,text) to authenticated;
revoke all on function public.cancelar_conta_financeira(bigint,bigint,text) from public;
grant execute on function public.cancelar_conta_financeira(bigint,bigint,text) to authenticated;
revoke all on function public.atualizar_vencimentos_financeiros(bigint) from public;
grant execute on function public.atualizar_vencimentos_financeiros(bigint) to authenticated;
revoke all on function public.registrar_pagamento_financeiro(bigint,text,bigint,bigint,timestamptz,numeric,text,text,jsonb) from public;
grant execute on function public.registrar_pagamento_financeiro(bigint,text,bigint,bigint,timestamptz,numeric,text,text,jsonb) to authenticated;
revoke all on function public.estornar_pagamento_financeiro(bigint,bigint,text) from public;
grant execute on function public.estornar_pagamento_financeiro(bigint,bigint,text) to authenticated;
revoke all on function public.abrir_sessao_caixa(bigint,bigint,numeric,text) from public;
grant execute on function public.abrir_sessao_caixa(bigint,bigint,numeric,text) to authenticated;
revoke all on function public.fechar_sessao_caixa(bigint,bigint,numeric,text) from public;
grant execute on function public.fechar_sessao_caixa(bigint,bigint,numeric,text) to authenticated;
revoke all on function public.movimentar_caixa_manual(bigint,bigint,text,numeric,text) from public;
grant execute on function public.movimentar_caixa_manual(bigint,bigint,text,numeric,text) to authenticated;
revoke all on function public.estornar_movimento_caixa(bigint,bigint,text) from public;
grant execute on function public.estornar_movimento_caixa(bigint,bigint,text) to authenticated;
revoke all on function public.relatorio_fluxo_financeiro(bigint,date,date) from public;
grant execute on function public.relatorio_fluxo_financeiro(bigint,date,date) to authenticated;

comment on function public.salvar_conta_financeira(bigint,bigint,text,bigint,bigint,bigint,text,text,date,date,numeric,integer,date,text)
  is 'Cria ou edita conta e parcelas atomicamente.';
comment on function public.registrar_pagamento_financeiro(bigint,text,bigint,bigint,timestamptz,numeric,text,text,jsonb)
  is 'Registra pagamento, aloca parcelas e movimenta caixa atomicamente.';
comment on function public.estornar_pagamento_financeiro(bigint,bigint,text)
  is 'Estorna pagamento, parcelas e movimento de caixa relacionado.';
comment on function public.relatorio_fluxo_financeiro(bigint,date,date)
  is 'Retorna fluxo mensal previsto e realizado para o período.';
