import { supabase } from "../../../supabase/supabaseApi";
import type { AccountCancelInput, AccountWriteInput, CashCloseInput, CashDrawer, CashDrawerWriteInput, CashMovementInput, CashOpenInput, CashSession, CategoryWriteInput, FinancialAccount, FinancialCatalogs, FinancialCategory, FinancialPayment, FinancialReportRow, PaymentMethod, PaymentMethodWriteInput, PaymentWriteInput, ReversalInput } from "../types/finance.types";

function financeError(message: string, cause: unknown) {
  const details = cause && typeof cause === "object" && "message" in cause ? String(cause.message) : "";
  const known = ["permissão", "inválid", "Informe", "não pode", "ultrapassa", "insuficiente", "aberta", "fechada", "estorn", "pagamento", "parcela", "saldo", "corresponde"];
  if (known.some((term) => details.toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR")))) return new Error(details, { cause });
  return new Error(message, { cause });
}

export async function getFinancialCatalogs(companyId: number): Promise<FinancialCatalogs> {
  const [categories, methods, drawers, clients, suppliers] = await Promise.all([
    supabase.from("categorias_financeiras").select("*").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("formas_pagamento").select("*").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("caixas").select("*").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("clientes").select("id,nome,ativo").eq("id_empresa", companyId).order("nome"),
    supabase.from("fornecedores").select("id,nome,nome_fantasia,ativo").eq("id_empresa", companyId).order("nome"),
  ]);
  const error = categories.error ?? methods.error ?? drawers.error ?? clients.error ?? suppliers.error;
  if (error) throw financeError("Não foi possível carregar os cadastros financeiros.", error);
  return { categories: categories.data ?? [], paymentMethods: methods.data ?? [], cashDrawers: drawers.data ?? [], clients: clients.data ?? [], suppliers: suppliers.data ?? [] };
}

export async function listFinancialAccounts(companyId: number): Promise<FinancialAccount[]> {
  const refresh = await supabase.rpc("atualizar_vencimentos_financeiros", { p_id_empresa: companyId });
  if (refresh.error) throw financeError("Não foi possível atualizar os vencimentos.", refresh.error);
  const { data, error } = await supabase
    .from("contas")
    .select("*, categoria:categorias_financeiras!contas_categoria_empresa_fkey(id,nome,tipo), cliente:clientes!contas_cliente_empresa_fkey(id,nome), fornecedor:fornecedores!contas_fornecedor_empresa_fkey(id,nome,nome_fantasia), parcelas:contas_parcelas(*)")
    .eq("id_empresa", companyId)
    .order("data_emissao", { ascending: false })
    .order("id", { ascending: false })
    .limit(1000);
  if (error) throw financeError("Não foi possível carregar as contas.", error);
  return (data ?? []).map((account) => ({ ...account, parcelas: [...(account.parcelas ?? [])].sort((a, b) => a.numero_parcela - b.numero_parcela) })) as unknown as FinancialAccount[];
}

export async function listFinancialPayments(companyId: number): Promise<FinancialPayment[]> {
  const { data, error } = await supabase
    .from("pagamentos")
    .select("*, forma:formas_pagamento!pagamentos_forma_empresa_fkey(id,nome,tipo), sessao:sessoes_caixa!pagamentos_sessao_empresa_fkey(id,caixa:caixas!sessoes_caixa_caixa_empresa_fkey(id,nome)), alocacoes:pagamentos_alocacoes(*,parcela:contas_parcelas!pagamentos_alocacoes_parcela_empresa_fkey(*,conta:contas!contas_parcelas_conta_empresa_fkey(id,descricao,tipo)))")
    .eq("id_empresa", companyId)
    .order("data_pagamento", { ascending: false })
    .limit(1000);
  if (error) throw financeError("Não foi possível carregar os pagamentos.", error);
  return (data ?? []) as unknown as FinancialPayment[];
}

export async function listCashSessions(companyId: number): Promise<CashSession[]> {
  const { data, error } = await supabase
    .from("sessoes_caixa")
    .select("*, caixa:caixas!sessoes_caixa_caixa_empresa_fkey(id,nome,codigo), movimentos:movimentos_caixa(*,forma:formas_pagamento!movimentos_caixa_forma_empresa_fkey(id,nome,tipo))")
    .eq("id_empresa", companyId)
    .order("aberta_em", { ascending: false })
    .limit(250);
  if (error) throw financeError("Não foi possível carregar as sessões de caixa.", error);
  return (data ?? []).map((session) => ({ ...session, movimentos: [...(session.movimentos ?? [])].sort((a, b) => b.ocorrido_em.localeCompare(a.ocorrido_em)) })) as unknown as CashSession[];
}

export async function getFinancialReport(companyId: number, start: string, end: string): Promise<FinancialReportRow[]> {
  const { data, error } = await supabase.rpc("relatorio_fluxo_financeiro", { p_id_empresa: companyId, p_data_inicio: start, p_data_fim: end });
  if (error) throw financeError("Não foi possível gerar o relatório financeiro.", error);
  return data ?? [];
}

export async function saveFinancialAccount(input: AccountWriteInput) {
  const { data, error } = await supabase.rpc("salvar_conta_financeira", {
    p_conta_id: (input.accountId ?? null) as unknown as number,
    p_id_empresa: input.companyId,
    p_tipo: input.type,
    p_id_categoria: input.categoryId as unknown as number,
    p_id_cliente: input.clientId as unknown as number,
    p_id_fornecedor: input.supplierId as unknown as number,
    p_descricao: input.description,
    p_documento: input.document,
    p_data_emissao: input.issueDate,
    p_competencia: input.competence as unknown as string,
    p_valor_total: input.total,
    p_numero_parcelas: input.installmentCount,
    p_primeiro_vencimento: input.firstDueDate,
    p_observacoes: input.notes,
  });
  if (error) throw financeError(input.accountId ? "Não foi possível atualizar a conta." : "Não foi possível criar a conta.", error);
  return data;
}

export async function cancelFinancialAccount(input: AccountCancelInput) {
  const { data, error } = await supabase.rpc("cancelar_conta_financeira", { p_conta_id: input.accountId, p_id_empresa: input.companyId, p_motivo: input.reason });
  if (error) throw financeError("Não foi possível cancelar a conta.", error);
  return data;
}

export async function registerFinancialPayment(input: PaymentWriteInput) {
  const { data, error } = await supabase.rpc("registrar_pagamento_financeiro", {
    p_id_empresa: input.companyId,
    p_tipo: input.type,
    p_id_forma_pagamento: input.paymentMethodId,
    p_id_sessao_caixa: input.cashSessionId as unknown as number,
    p_data_pagamento: new Date(input.paidAt).toISOString(),
    p_valor: input.amount,
    p_referencia: input.reference,
    p_observacoes: input.notes,
    p_alocacoes: input.allocations,
  });
  if (error) throw financeError("Não foi possível registrar o pagamento.", error);
  return data;
}

export async function reverseFinancialPayment(input: ReversalInput) {
  const { data, error } = await supabase.rpc("estornar_pagamento_financeiro", { p_pagamento_id: input.id, p_id_empresa: input.companyId, p_motivo: input.reason });
  if (error) throw financeError("Não foi possível estornar o pagamento.", error);
  return data;
}

export async function openCashSession(input: CashOpenInput) {
  const { data, error } = await supabase.rpc("abrir_sessao_caixa", { p_id_empresa: input.companyId, p_id_caixa: input.cashDrawerId, p_saldo_inicial: input.openingBalance, p_observacoes: input.notes });
  if (error) throw financeError("Não foi possível abrir o caixa.", error);
  return data;
}

export async function closeCashSession(input: CashCloseInput) {
  const { data, error } = await supabase.rpc("fechar_sessao_caixa", { p_sessao_id: input.sessionId, p_id_empresa: input.companyId, p_saldo_contado: input.countedBalance, p_observacoes: input.notes });
  if (error) throw financeError("Não foi possível fechar o caixa.", error);
  return data;
}

export async function createCashMovement(input: CashMovementInput) {
  const { data, error } = await supabase.rpc("movimentar_caixa_manual", { p_id_empresa: input.companyId, p_id_sessao_caixa: input.sessionId, p_tipo: input.type, p_valor: input.amount, p_descricao: input.description });
  if (error) throw financeError("Não foi possível movimentar o caixa.", error);
  return data;
}

export async function reverseCashMovement(input: ReversalInput) {
  const { data, error } = await supabase.rpc("estornar_movimento_caixa", { p_movimento_id: input.id, p_id_empresa: input.companyId, p_motivo: input.reason });
  if (error) throw financeError("Não foi possível estornar o movimento.", error);
  return data;
}

export async function saveFinancialCategory(input: CategoryWriteInput): Promise<FinancialCategory> {
  const query = input.id
    ? supabase.from("categorias_financeiras").update({ nome: input.nome, tipo: input.tipo, ativo: input.ativo }).eq("id_empresa", input.id_empresa).eq("id", input.id)
    : supabase.from("categorias_financeiras").insert({ id_empresa: input.id_empresa, nome: input.nome, tipo: input.tipo, ativo: input.ativo });
  const { data, error } = await query.select("*").single();
  if (error) throw financeError("Não foi possível salvar a categoria.", error);
  return data;
}

export async function savePaymentMethod(input: PaymentMethodWriteInput): Promise<PaymentMethod> {
  const values = { nome: input.nome, tipo: input.tipo, permite_parcelamento: input.permite_parcelamento, max_parcelas: input.permite_parcelamento ? input.max_parcelas : 1, taxa_percentual: input.taxa_percentual, prazo_recebimento_dias: input.prazo_recebimento_dias, ativo: input.ativo };
  const query = input.id
    ? supabase.from("formas_pagamento").update(values).eq("id_empresa", input.id_empresa).eq("id", input.id)
    : supabase.from("formas_pagamento").insert({ id_empresa: input.id_empresa, ...values });
  const { data, error } = await query.select("*").single();
  if (error) throw financeError("Não foi possível salvar a forma de pagamento.", error);
  return data;
}

export async function saveCashDrawer(input: CashDrawerWriteInput): Promise<CashDrawer> {
  const values = { nome: input.nome, codigo: input.codigo || null, descricao: input.descricao || null, localizacao: input.localizacao || null, permite_saldo_negativo: input.permite_saldo_negativo, ativo: input.ativo };
  const query = input.id
    ? supabase.from("caixas").update(values).eq("id_empresa", input.id_empresa).eq("id", input.id)
    : supabase.from("caixas").insert({ id_empresa: input.id_empresa, ...values });
  const { data, error } = await query.select("*").single();
  if (error) throw financeError("Não foi possível salvar o caixa.", error);
  return data;
}
