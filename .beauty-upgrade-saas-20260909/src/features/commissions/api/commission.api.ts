import { supabase } from "../../../supabase/supabaseApi";
import type { CommissionAdjustmentInput, CommissionCatalogs, CommissionLaunch, CommissionPayment, CommissionPaymentInput, CommissionReportRow, CommissionReversalInput, CommissionRule, RuleWriteInput, WeeklyCloseInput, WeeklyCommissionSummary } from "../types/commission.types";

function commissionError(message: string, cause: unknown) {
  const details = cause && typeof cause === "object" && "message" in cause ? String(cause.message) : "";
  const known = ["permissão", "inválid", "Informe", "não pode", "maior", "menor", "vigência", "regra", "comissão", "pagamento", "caixa", "sessão", "funcionário", "mesmo escopo", "duas vezes"];
  if (known.some((term) => details.toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR")))) return new Error(details, { cause });
  return new Error(message, { cause });
}

export async function getCommissionCatalogs(companyId: number): Promise<CommissionCatalogs> {
  const [employees, services, products, methods, sessions] = await Promise.all([
    supabase.from("funcionarios").select("id,nome,cargo,ativo").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("servicos").select("id,nome,ativo").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("produtos").select("id,nome,codigo,ativo").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("formas_pagamento").select("id,nome,tipo,ativo").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("sessoes_caixa").select("id,status,saldo_esperado,caixa:caixas!sessoes_caixa_caixa_empresa_fkey(id,nome)").eq("id_empresa", companyId).eq("status", "aberta").order("aberta_em", { ascending: false }),
  ]);
  const error = employees.error ?? services.error ?? products.error ?? methods.error ?? sessions.error;
  if (error) throw commissionError("Não foi possível carregar os cadastros de comissão.", error);
  return { employees: employees.data ?? [], services: services.data ?? [], products: products.data ?? [], paymentMethods: methods.data ?? [], cashSessions: (sessions.data ?? []) as unknown as CommissionCatalogs["cashSessions"] };
}

export async function listCommissionRules(companyId: number): Promise<CommissionRule[]> {
  const { data, error } = await supabase.from("comissoes_regras").select("*, funcionario:funcionarios!comissoes_regras_funcionario_empresa_fkey(id,nome,cargo,ativo), servico:servicos!comissoes_regras_servico_empresa_fkey(id,nome,ativo), produto:produtos!comissoes_regras_produto_empresa_fkey(id,nome,codigo,ativo)").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("prioridade", { ascending: false }).order("vigente_de", { ascending: false }).limit(1000);
  if (error) throw commissionError("Não foi possível carregar as regras de comissão.", error);
  return (data ?? []) as unknown as CommissionRule[];
}

export async function listCommissionLaunches(companyId: number): Promise<CommissionLaunch[]> {
  const { data, error } = await supabase.from("lancamentos_comissao").select("*, funcionario:funcionarios!lancamentos_comissao_funcionario_empresa_fkey(id,nome,cargo,ativo), regra:comissoes_regras!lancamentos_comissao_regra_empresa_fkey(id), comanda:comandas!lancamentos_comissao_comanda_empresa_fkey(id,status)").eq("id_empresa", companyId).order("competencia", { ascending: false }).order("id", { ascending: false }).limit(2000);
  if (error) throw commissionError("Não foi possível carregar os lançamentos de comissão.", error);
  return (data ?? []) as unknown as CommissionLaunch[];
}

export async function listCommissionPayments(companyId: number): Promise<CommissionPayment[]> {
  const { data, error } = await supabase.from("pagamentos_comissao").select("*, funcionario:funcionarios!pagamentos_comissao_funcionario_empresa_fkey(id,nome,cargo,ativo), forma:formas_pagamento!pagamentos_comissao_forma_empresa_fkey(id,nome,tipo,ativo), sessao:sessoes_caixa!pagamentos_comissao_sessao_empresa_fkey(id,caixa:caixas!sessoes_caixa_caixa_empresa_fkey(id,nome)), itens:pagamentos_comissao_itens(*,lancamento:lancamentos_comissao!pagamentos_comissao_itens_lancamento_empresa_fkey(id,descricao_snapshot,competencia,valor_comissao,valor_pago,status))").eq("id_empresa", companyId).order("pago_em", { ascending: false, nullsFirst: false }).order("id", { ascending: false }).limit(1000);
  if (error) throw commissionError("Não foi possível carregar os pagamentos de comissão.", error);
  return (data ?? []) as unknown as CommissionPayment[];
}

export async function getCommissionReport(companyId: number, start: string, end: string): Promise<CommissionReportRow[]> {
  const { data, error } = await supabase.rpc("relatorio_comissoes_funcionario", { p_id_empresa: companyId, p_data_inicio: start, p_data_fim: end });
  if (error) throw commissionError("Não foi possível gerar o relatório de comissões.", error);
  return data ?? [];
}

export async function getWeeklyCommissionSummary(companyId: number, start: string, end: string): Promise<WeeklyCommissionSummary[]> {
  const { data, error } = await supabase.rpc("resumo_fechamento_semanal", { p_id_empresa: companyId, p_data_inicio: start, p_data_fim: end });
  if (error) throw commissionError("Não foi possível preparar o fechamento semanal.", error);
  return data ?? [];
}

export async function registerWeeklyClose(input: WeeklyCloseInput) {
  const { data, error } = await supabase.rpc("registrar_fechamento_semanal", {
    p_id_empresa: input.companyId,
    p_data_inicio: input.start,
    p_data_fim: input.end,
    p_id_forma_pagamento: input.paymentMethodId,
    p_id_sessao_caixa: input.cashSessionId as unknown as number,
    p_pago_em: new Date(input.paidAt).toISOString(),
    p_observacoes: input.notes,
  });
  if (error) throw commissionError("Não foi possível registrar o fechamento semanal.", error);
  return data;
}

export async function saveCommissionRule(input: RuleWriteInput) {
  const { data, error } = await supabase.rpc("salvar_regra_comissao_beauty", {
    p_regra_id: (input.ruleId ?? null) as unknown as number,
    p_id_empresa: input.companyId,
    p_id_funcionario: input.employeeId as unknown as number,
    p_tipo_item: input.itemType,
    p_id_servico: input.serviceId as unknown as number,
    p_id_produto: input.productId as unknown as number,
    p_tipo_calculo: input.calculationType,
    p_percentual: input.percentage as unknown as number,
    p_valor_fixo: input.fixedValue as unknown as number,
    p_base_calculo: input.base,
    p_momento_liberacao: input.releaseMoment,
    p_descontar_taxa_pagamento: input.deductPaymentFee,
    p_descontar_insumos: input.deductInputs,
    p_vigente_de: input.validFrom,
    p_vigente_ate: input.validUntil as unknown as string,
    p_prioridade: input.priority,
    p_ativo: input.active,
  });
  if (error) throw commissionError(input.ruleId ? "Não foi possível atualizar a regra." : "Não foi possível criar a regra.", error);
  return data;
}

export async function createCommissionAdjustment(input: CommissionAdjustmentInput) {
  const { data, error } = await supabase.rpc("criar_ajuste_comissao", { p_id_empresa: input.companyId, p_id_funcionario: input.employeeId, p_descricao: input.description, p_valor: input.amount, p_competencia: input.competence });
  if (error) throw commissionError("Não foi possível criar o ajuste de comissão.", error);
  return data;
}

export async function registerCommissionPayment(input: CommissionPaymentInput) {
  const { data, error } = await supabase.rpc("registrar_pagamento_comissao", { p_id_empresa: input.companyId, p_id_funcionario: input.employeeId, p_id_forma_pagamento: input.paymentMethodId, p_id_sessao_caixa: input.cashSessionId as unknown as number, p_pago_em: new Date(input.paidAt).toISOString(), p_periodo_inicio: input.periodStart as unknown as string, p_periodo_fim: input.periodEnd as unknown as string, p_observacoes: input.notes, p_itens: input.items });
  if (error) throw commissionError("Não foi possível registrar o pagamento de comissão.", error);
  return data;
}

export async function reverseCommissionLaunch(input: CommissionReversalInput) {
  const { data, error } = await supabase.rpc("estornar_lancamento_comissao", { p_id_empresa: input.companyId, p_lancamento_id: input.id, p_motivo: input.reason });
  if (error) throw commissionError("Não foi possível estornar a comissão.", error);
  return data;
}

export async function reverseCommissionPayment(input: CommissionReversalInput) {
  const { data, error } = await supabase.rpc("estornar_pagamento_comissao", { p_id_empresa: input.companyId, p_pagamento_comissao_id: input.id, p_motivo: input.reason });
  if (error) throw commissionError("Não foi possível estornar o pagamento de comissão.", error);
  return data;
}
