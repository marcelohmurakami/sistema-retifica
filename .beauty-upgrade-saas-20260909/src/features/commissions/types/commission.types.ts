import type { Database } from "../../../types/database.types";

type Tables = Database["public"]["Tables"];

export type CommissionItemType = "todos" | "servico" | "produto";
export type CommissionCalculationType = "percentual" | "valor_fixo";
export type CommissionBase = "bruto" | "liquido_desconto";
export type CommissionReleaseMoment = "fechamento_comanda" | "pagamento_cliente";
export type CommissionLaunchStatus = "prevista" | "liberada" | "parcial" | "paga" | "estornada";
export type CommissionPaymentStatus = "rascunho" | "confirmado" | "cancelado";

export type EmployeeSummary = Pick<Tables["funcionarios"]["Row"], "id" | "nome" | "cargo" | "ativo">;
export type ServiceSummary = Pick<Tables["servicos"]["Row"], "id" | "nome" | "ativo">;
export type ProductSummary = Pick<Tables["produtos"]["Row"], "id" | "nome" | "codigo" | "ativo">;
export type PaymentMethodSummary = Pick<Tables["formas_pagamento"]["Row"], "id" | "nome" | "tipo" | "ativo">;
export type CashSessionSummary = Pick<Tables["sessoes_caixa"]["Row"], "id" | "status" | "saldo_esperado"> & { caixa: { id: number; nome: string } | null };

export type CommissionRule = Tables["comissoes_regras"]["Row"] & {
  funcionario: EmployeeSummary | null;
  servico: ServiceSummary | null;
  produto: ProductSummary | null;
};

export type CommissionLaunch = Tables["lancamentos_comissao"]["Row"] & {
  funcionario: EmployeeSummary | null;
  regra: { id: number } | null;
  comanda: { id: number; status: string } | null;
};

export type CommissionPaymentItem = Tables["pagamentos_comissao_itens"]["Row"] & {
  lancamento: Pick<CommissionLaunch, "id" | "descricao_snapshot" | "competencia" | "valor_comissao" | "valor_pago" | "status"> | null;
};

export type CommissionPayment = Tables["pagamentos_comissao"]["Row"] & {
  funcionario: EmployeeSummary | null;
  forma: PaymentMethodSummary | null;
  sessao: (Pick<Tables["sessoes_caixa"]["Row"], "id"> & { caixa: { id: number; nome: string } | null }) | null;
  itens: CommissionPaymentItem[];
};

export type CommissionCatalogs = {
  employees: EmployeeSummary[];
  services: ServiceSummary[];
  products: ProductSummary[];
  paymentMethods: PaymentMethodSummary[];
  cashSessions: CashSessionSummary[];
};

export type CommissionReportRow = Database["public"]["Functions"]["relatorio_comissoes_funcionario"]["Returns"][number];

export type RuleWriteInput = {
  ruleId?: number;
  companyId: number;
  employeeId: number | null;
  itemType: CommissionItemType;
  serviceId: number | null;
  productId: number | null;
  calculationType: CommissionCalculationType;
  percentage: number | null;
  fixedValue: number | null;
  base: CommissionBase;
  releaseMoment: CommissionReleaseMoment;
  deductPaymentFee: boolean;
  deductInputs: boolean;
  validFrom: string;
  validUntil: string | null;
  priority: number;
  active: boolean;
};

export type WeeklyCommissionSummary = Database["public"]["Functions"]["resumo_fechamento_semanal"]["Returns"][number];
export type WeeklyCloseInput = {
  companyId: number;
  start: string;
  end: string;
  paymentMethodId: number;
  cashSessionId: number | null;
  paidAt: string;
  notes: string;
};

export type CommissionAdjustmentInput = { companyId: number; employeeId: number; description: string; amount: number; competence: string };
export type CommissionReversalInput = { companyId: number; id: number; reason: string };
export type CommissionPaymentInput = {
  companyId: number;
  employeeId: number;
  paymentMethodId: number;
  cashSessionId: number | null;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string;
  items: Array<{ id_lancamento_comissao: number; valor: number }>;
};
