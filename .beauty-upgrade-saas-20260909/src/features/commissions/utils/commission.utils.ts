import type { CommissionLaunch, CommissionReportRow, CommissionRule } from "../types/commission.types";

export const COMMISSION_ITEM_LABELS = { todos: "Todos os itens", servico: "Serviços", produto: "Produtos" } as const;
export const COMMISSION_CALCULATION_LABELS = { percentual: "Percentual", valor_fixo: "Valor fixo" } as const;
export const COMMISSION_BASE_LABELS = { bruto: "Valor bruto", liquido_desconto: "Após descontos" } as const;
export const COMMISSION_RELEASE_LABELS = { fechamento_comanda: "Ao fechar a comanda", pagamento_cliente: "Após pagamento do cliente" } as const;
export const COMMISSION_STATUS_LABELS = { prevista: "Prevista", liberada: "Liberada", parcial: "Parcial", paga: "Paga", estornada: "Estornada" } as const;
export const COMMISSION_PAYMENT_STATUS_LABELS = { rascunho: "Rascunho", confirmado: "Confirmado", cancelado: "Estornado" } as const;

export function formatCommissionCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

export function formatCommissionDate(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatCommissionDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function localCommissionDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function localCommissionDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function commissionBalance(launch: CommissionLaunch) {
  return Math.max(Number(launch.valor_comissao) - Number(launch.valor_pago), 0);
}

export function ruleScope(rule: CommissionRule) {
  const employee = rule.funcionario?.nome ?? "Toda a equipe";
  const item = rule.servico?.nome ?? rule.produto?.nome ?? COMMISSION_ITEM_LABELS[rule.tipo_item as keyof typeof COMMISSION_ITEM_LABELS] ?? rule.tipo_item;
  return `${employee} · ${item}`;
}

export function ruleCalculation(rule: CommissionRule) {
  return rule.tipo_calculo === "percentual"
    ? `${Number(rule.percentual).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`
    : formatCommissionCurrency(rule.valor_fixo);
}

export function commissionReportTotals(rows: CommissionReportRow[]) {
  return rows.reduce((total, row) => ({
    generated: total.generated + Number(row.comissoes_geradas),
    expected: total.expected + Number(row.comissoes_previstas),
    released: total.released + Number(row.comissoes_liberadas),
    paid: total.paid + Number(row.comissoes_pagas),
    reversed: total.reversed + Number(row.comissoes_estornadas),
    adjustments: total.adjustments + Number(row.ajustes_manuais),
    balance: total.balance + Number(row.saldo_a_pagar),
  }), { generated: 0, expected: 0, released: 0, paid: 0, reversed: 0, adjustments: 0, balance: 0 });
}
