import type {
  Command,
  CommandFormValues,
  CommandPaymentDisplayStatus,
  CommercialItemForm,
  CommercialItemPayload,
  Quote,
  QuoteFormValues,
  QuoteStatus,
} from "../types/commercial.types";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Expirado",
  convertido: "Convertido",
  cancelado: "Cancelado",
};

export const COMMAND_STATUS_LABELS = {
  aberta: "Aberta",
  fechada: "Fechada",
  cancelada: "Cancelada",
} as const;

export const COMMAND_PAYMENT_STATUS_LABELS: Record<CommandPaymentDisplayStatus, string> = {
  a_receber: "A receber",
  parcial: "Parcial",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
  sem_cobranca: "Sem cobrança",
  receber_no_fechamento: "Receber no fechamento",
};

export const COMMERCIAL_ITEM_LABELS = {
  servico: "Serviço",
  produto: "Produto",
  outro: "Item avulso",
} as const;

export function formatCommercialCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

export function formatCommercialNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(value ?? 0));
}

export function formatCommercialDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export function formatCommercialDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function localDate(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function localDateTime(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return localDate(next);
}

export function createCommercialItem(type: CommercialItemForm["type"] = "servico"): CommercialItemForm {
  const key = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return { key, type, catalogId: "", description: "", quantity: "1", unitPrice: "0", discount: "0", employeeId: "", notes: "" };
}

export function getEmptyQuoteFormValues(): QuoteFormValues {
  return { clientId: "", validity: addDays(new Date(), 15), discount: "0", surcharge: "0", notes: "", items: [createCommercialItem()] };
}

export function getEmptyCommandFormValues(): CommandFormValues {
  return { clientId: "", responsibleEmployeeId: "", paymentCondition: "a_receber", discount: "0", surcharge: "0", notes: "", items: [createCommercialItem()] };
}

function databaseItemToForm(item: Quote["itens"][number] | Command["itens"][number]): CommercialItemForm {
  return {
    ...createCommercialItem(item.tipo_item as CommercialItemForm["type"]),
    catalogId: String(item.id_servico ?? item.id_produto ?? ""),
    description: item.descricao_snapshot,
    quantity: String(item.quantidade),
    unitPrice: String(item.valor_unitario_snapshot),
    discount: String(item.desconto),
    employeeId: "id_funcionario" in item && item.id_funcionario ? String(item.id_funcionario) : "",
    notes: item.observacoes ?? "",
    sourceItemId: item.id,
  };
}

export function quoteToFormValues(quote: Quote): QuoteFormValues {
  return { clientId: String(quote.id_cliente), validity: quote.validade ?? "", discount: String(quote.desconto), surcharge: String(quote.acrescimo), notes: quote.observacoes ?? "", items: quote.itens.map(databaseItemToForm) };
}

export function commandToFormValues(command: Command): CommandFormValues {
  return { clientId: String(command.id_cliente), responsibleEmployeeId: command.id_funcionario_responsavel ? String(command.id_funcionario_responsavel) : "", paymentCondition: command.condicao_pagamento === "pago" ? "pago" : "a_receber", discount: String(command.desconto), surcharge: String(command.acrescimo), notes: command.observacoes ?? "", items: command.itens.map(databaseItemToForm) };
}

export function commandPaymentDisplay(command: Command) {
  const total = Number(command.valor_total ?? 0);
  if (command.status === "cancelada") return { status: "cancelado" as const, label: COMMAND_PAYMENT_STATUS_LABELS.cancelado, paid: 0, balance: 0, dueDate: null };
  if (total <= 0) return { status: "sem_cobranca" as const, label: COMMAND_PAYMENT_STATUS_LABELS.sem_cobranca, paid: 0, balance: 0, dueDate: null };
  if (command.status === "aberta") {
    const status = command.condicao_pagamento === "pago" ? "receber_no_fechamento" as const : "a_receber" as const;
    return { status, label: COMMAND_PAYMENT_STATUS_LABELS[status], paid: 0, balance: total, dueDate: null };
  }

  const account = command.conta;
  if (!account) return { status: "a_receber" as const, label: COMMAND_PAYMENT_STATUS_LABELS.a_receber, paid: 0, balance: total, dueDate: null };
  const status = account.status === "paga" ? "pago" : account.status === "vencida" ? "vencido" : account.status === "cancelada" ? "cancelado" : account.status === "parcial" ? "parcial" : "a_receber";
  const paid = Number(account.valor_pago ?? 0);
  const dueDate = [...account.parcelas].filter((item) => item.status !== "cancelada").sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))[0]?.data_vencimento ?? null;
  return { status, label: COMMAND_PAYMENT_STATUS_LABELS[status], paid, balance: Math.max(Number(account.valor_total) - paid, 0), dueDate };
}

export function commercialItemsSubtotal(items: CommercialItemForm[]) {
  return items.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
}

export function commercialItemsDiscount(items: CommercialItemForm[]) {
  return items.reduce((total, item) => total + Number(item.discount || 0), 0);
}

export function commercialDocumentTotal(values: Pick<QuoteFormValues, "items" | "discount" | "surcharge">) {
  return Math.max(commercialItemsSubtotal(values.items) - commercialItemsDiscount(values.items) - Number(values.discount || 0) + Number(values.surcharge || 0), 0);
}

export function commercialItemsToPayload(items: CommercialItemForm[], includeEmployee: boolean): CommercialItemPayload[] {
  return items.map((item) => ({
    tipo_item: item.type,
    id_servico: item.type === "servico" ? Number(item.catalogId) : null,
    id_produto: item.type === "produto" ? Number(item.catalogId) : null,
    ...(includeEmployee ? { id_funcionario: item.employeeId ? Number(item.employeeId) : null } : {}),
    descricao: item.description.trim(),
    quantidade: Number(item.quantity),
    valor_unitario: Number(item.unitPrice),
    desconto: Number(item.discount || 0),
    observacoes: item.notes.trim(),
  }));
}

export function quoteEffectiveStatus(quote: Pick<Quote, "status" | "validade">): QuoteStatus {
  if (["rascunho", "enviado"].includes(quote.status) && quote.validade && quote.validade < localDate()) return "expirado";
  return quote.status as QuoteStatus;
}

export function quoteCanEdit(quote: Quote) { return ["rascunho", "enviado"].includes(quoteEffectiveStatus(quote)); }
export function quoteCanConvert(quote: Quote) { return quoteEffectiveStatus(quote) === "aprovado"; }
