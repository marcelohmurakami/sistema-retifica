import { supabase } from "../../../supabase/supabaseApi";
import type {
  CancelCommandInput,
  CloseCommandInput,
  Command,
  CommandWriteInput,
  CommercialCatalogs,
  Quote,
  QuoteConversionInput,
  QuoteStatusInput,
  QuoteWriteInput,
} from "../types/commercial.types";

function commercialError(message: string, cause: unknown) {
  const details = cause && typeof cause === "object" && "message" in cause ? String(cause.message) : "";
  if (details.includes("Estoque insuficiente") || details.includes("permissão") || details.includes("não pode") || details.includes("inválid") || details.includes("Informe") || details.includes("Adicione") || details.includes("Selecione") || details.includes("vencido") || details.includes("pagamentos")) return new Error(details, { cause });
  if (details.includes("comandas_empresa_orcamento_unique")) return new Error("Este orçamento já foi convertido em comanda.", { cause });
  return new Error(message, { cause });
}

export async function getCommercialCatalogs(companyId: number): Promise<CommercialCatalogs> {
  const [clients, services, products, employees, employeeServices, paymentMethods, cashSessions] = await Promise.all([
    supabase.from("clientes").select("id,nome,telefone_principal,ativo").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("servicos").select("id,nome,preco,ativo").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("produtos").select("id,nome,codigo,preco_venda,estoque_atual,unidade_medida,controla_estoque,ativo").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("funcionarios").select("id,nome,cargo,ativo,atende_clientes").eq("id_empresa", companyId).order("ativo", { ascending: false }).order("nome"),
    supabase.from("funcionarios_servicos").select("id_funcionario,id_servico,ativo").eq("id_empresa", companyId),
    supabase.from("formas_pagamento").select("id,nome,tipo,ativo").eq("id_empresa", companyId).eq("ativo", true).order("nome"),
    supabase.from("sessoes_caixa").select("id,status,saldo_esperado,caixa:caixas!sessoes_caixa_caixa_empresa_fkey(id,nome)").eq("id_empresa", companyId).eq("status", "aberta").order("aberta_em", { ascending: false }),
  ]);
  const error = clients.error ?? services.error ?? products.error ?? employees.error ?? employeeServices.error ?? paymentMethods.error ?? cashSessions.error;
  if (error) throw commercialError("Não foi possível carregar os dados comerciais.", error);
  return { clients: clients.data ?? [], services: services.data ?? [], products: products.data ?? [], employees: employees.data ?? [], employeeServices: employeeServices.data ?? [], paymentMethods: paymentMethods.data ?? [], cashSessions: cashSessions.data ?? [] };
}

export async function listQuotes(companyId: number): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*, cliente:clientes!orcamentos_cliente_empresa_fkey(id,nome,telefone_principal,ativo), itens:orcamentos_itens(*)")
    .eq("id_empresa", companyId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw commercialError("Não foi possível carregar os orçamentos.", error);
  return (data ?? []) as unknown as Quote[];
}

export async function saveQuote(input: QuoteWriteInput) {
  const { data, error } = await supabase.rpc("salvar_orcamento", {
    p_orcamento_id: (input.quoteId ?? null) as unknown as number,
    p_id_empresa: input.companyId,
    p_id_cliente: input.clientId,
    p_validade: input.validity as unknown as string,
    p_desconto: input.discount,
    p_acrescimo: input.surcharge,
    p_observacoes: input.notes,
    p_itens: input.items,
  });
  if (error) throw commercialError(input.quoteId ? "Não foi possível atualizar o orçamento." : "Não foi possível criar o orçamento.", error);
  return data;
}

export async function changeQuoteStatus(input: QuoteStatusInput) {
  const { data, error } = await supabase.rpc("alterar_status_orcamento", {
    p_orcamento_id: input.quoteId,
    p_id_empresa: input.companyId,
    p_status: input.status,
    p_observacao: input.observation ?? undefined,
  });
  if (error) throw commercialError("Não foi possível alterar o orçamento.", error);
  return data;
}

export async function convertQuote(input: QuoteConversionInput) {
  const { data, error } = await supabase.rpc("converter_orcamento_em_comanda", {
    p_orcamento_id: input.quoteId,
    p_id_empresa: input.companyId,
    p_id_funcionario_responsavel: input.responsibleEmployeeId as unknown as number,
    p_funcionarios_servicos: input.serviceEmployees,
    p_observacoes: input.notes,
  });
  if (error) throw commercialError("Não foi possível converter o orçamento.", error);
  return data;
}

export async function listCommands(companyId: number): Promise<Command[]> {
  const { data, error } = await supabase
    .from("comandas")
    .select("*, cliente:clientes!comandas_cliente_empresa_fkey(id,nome,telefone_principal,ativo), responsavel:funcionarios!comandas_funcionario_empresa_fkey(id,nome), itens:comandas_itens(*, funcionario:funcionarios!comandas_itens_funcionario_empresa_fkey(id,nome)), conta:contas!contas_comanda_empresa_fkey(id,status,valor_total,valor_pago,parcelas:contas_parcelas(id,numero_parcela,data_vencimento,valor_parcela,valor_pago,status))")
    .eq("id_empresa", companyId)
    .order("aberta_em", { ascending: false })
    .limit(500);
  if (error) throw commercialError("Não foi possível carregar as comandas.", error);
  return (data ?? []).map((command) => ({ ...command, conta: Array.isArray(command.conta) ? command.conta[0] ?? null : command.conta })) as unknown as Command[];
}

export async function saveCommand(input: CommandWriteInput) {
  const { data, error } = await supabase.rpc("salvar_comanda_com_pagamento", {
    p_comanda_id: (input.commandId ?? null) as unknown as number,
    p_id_empresa: input.companyId,
    p_id_cliente: input.clientId,
    p_id_funcionario_responsavel: input.responsibleEmployeeId as unknown as number,
    p_desconto: input.discount,
    p_acrescimo: input.surcharge,
    p_observacoes: input.notes,
    p_itens: input.items,
    p_condicao_pagamento: input.paymentCondition,
  });
  if (error) throw commercialError(input.commandId ? "Não foi possível atualizar a comanda." : "Não foi possível abrir a comanda.", error);
  return data;
}

export async function closeCommand(input: CloseCommandInput) {
  const { data, error } = await supabase.rpc("fechar_comanda_com_pagamento", {
    p_comanda_id: input.commandId,
    p_id_empresa: input.companyId,
    p_data_vencimento: input.dueDate,
    p_situacao_pagamento: input.paymentSituation,
    ...(input.paymentMethodId !== null ? { p_id_forma_pagamento: input.paymentMethodId } : {}),
    ...(input.cashSessionId !== null ? { p_id_sessao_caixa: input.cashSessionId } : {}),
    ...(input.paidAt ? { p_data_pagamento: new Date(input.paidAt).toISOString() } : {}),
    ...(input.amount !== null ? { p_valor_pagamento: input.amount } : {}),
    p_referencia: input.reference,
    p_observacoes_pagamento: input.notes,
  });
  if (error) throw commercialError("Não foi possível fechar a comanda.", error);
  return data;
}

export async function cancelCommand(input: CancelCommandInput) {
  const { data, error } = await supabase.rpc("cancelar_comanda", {
    p_comanda_id: input.commandId,
    p_id_empresa: input.companyId,
    p_motivo: input.reason,
  });
  if (error) throw commercialError("Não foi possível cancelar a comanda.", error);
  return data;
}
