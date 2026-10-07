import type { AccountInstallment, AccountStatus, AccountType, CashMovementType, FinancialAccount, FinancialReportRow, InstallmentStatus, PaymentMethodType, PaymentStatus } from "../types/finance.types";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = { receber: "A receber", pagar: "A pagar" };
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = { aberta: "Em aberto", parcial: "Parcial", paga: "Paga", vencida: "Vencida", cancelada: "Cancelada" };
export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = { aberta: "Em aberto", parcial: "Parcial", paga: "Paga", atrasada: "Atrasada", cancelada: "Cancelada" };
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = { pendente: "Pendente", confirmado: "Confirmado", estornado: "Estornado" };
export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = { dinheiro: "Dinheiro", pix: "PIX", cartao_credito: "Cartão de crédito", cartao_debito: "Cartão de débito", boleto: "Boleto", transferencia: "Transferência", outro: "Outro" };
export const CASH_MOVEMENT_LABELS: Record<CashMovementType, string> = { entrada: "Recebimento", saida: "Pagamento", suprimento: "Suprimento", sangria: "Sangria", ajuste_entrada: "Ajuste de entrada", ajuste_saida: "Ajuste de saída" };

export function formatFinancialCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

export function formatFinancialDate(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatFinancialDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function formatMonth(value: string) {
  const [year, month] = value.slice(0, 7).split("-");
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(new Date(Number(year), Number(month) - 1, 1)).replace(" de ", "/");
}

export function localDateInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function localDateTimeInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function installmentBalance(installment: AccountInstallment) {
  return Math.max(Number(installment.valor_parcela) - Number(installment.valor_pago), 0);
}

export function accountBalance(account: FinancialAccount) {
  return account.parcelas.filter((item) => item.status !== "cancelada").reduce((sum, item) => sum + installmentBalance(item), 0);
}

export function nextOpenInstallment(account: FinancialAccount) {
  return [...account.parcelas]
    .filter((item) => !["paga", "cancelada"].includes(item.status) && installmentBalance(item) > 0)
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))[0] ?? null;
}

export function accountCounterparty(account: FinancialAccount) {
  return account.tipo === "receber"
    ? account.cliente?.nome ?? "Sem cliente"
    : account.fornecedor?.nome_fantasia ?? account.fornecedor?.nome ?? "Sem fornecedor";
}

export function reportTotals(rows: FinancialReportRow[]) {
  return rows.reduce((total, row) => ({
    expectedIncome: total.expectedIncome + Number(row.receitas_previstas),
    expectedExpense: total.expectedExpense + Number(row.despesas_previstas),
    received: total.received + Number(row.receitas_realizadas),
    paid: total.paid + Number(row.despesas_realizadas),
  }), { expectedIncome: 0, expectedExpense: 0, received: 0, paid: 0 });
}

