import type { Database } from "../../../types/database.types";

type Tables = Database["public"]["Tables"];

export type AccountType = "receber" | "pagar";
export type AccountStatus = "aberta" | "parcial" | "paga" | "vencida" | "cancelada";
export type InstallmentStatus = "aberta" | "parcial" | "paga" | "atrasada" | "cancelada";
export type PaymentType = "entrada" | "saida";
export type PaymentStatus = "pendente" | "confirmado" | "estornado";
export type CashSessionStatus = "aberta" | "fechada" | "cancelada";
export type CashMovementType = "entrada" | "saida" | "suprimento" | "sangria" | "ajuste_entrada" | "ajuste_saida";
export type FinancialCategoryType = "entrada" | "saida" | "ambos";
export type PaymentMethodType = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto" | "transferencia" | "outro";

export type FinancialCategory = Tables["categorias_financeiras"]["Row"];
export type PaymentMethod = Tables["formas_pagamento"]["Row"];
export type CashDrawer = Tables["caixas"]["Row"];
export type AccountInstallment = Tables["contas_parcelas"]["Row"];
export type CashMovement = Tables["movimentos_caixa"]["Row"] & {
  forma?: Pick<PaymentMethod, "id" | "nome" | "tipo"> | null;
};

export type FinancialAccount = Tables["contas"]["Row"] & {
  categoria: Pick<FinancialCategory, "id" | "nome" | "tipo"> | null;
  cliente: { id: number; nome: string } | null;
  fornecedor: { id: number; nome: string; nome_fantasia: string | null } | null;
  parcelas: AccountInstallment[];
};

export type PaymentAllocation = Tables["pagamentos_alocacoes"]["Row"] & {
  parcela: (AccountInstallment & {
    conta: Pick<FinancialAccount, "id" | "descricao" | "tipo"> | null;
  }) | null;
};

export type FinancialPayment = Tables["pagamentos"]["Row"] & {
  forma: Pick<PaymentMethod, "id" | "nome" | "tipo"> | null;
  sessao: (Pick<Tables["sessoes_caixa"]["Row"], "id"> & {
    caixa: Pick<CashDrawer, "id" | "nome"> | null;
  }) | null;
  alocacoes: PaymentAllocation[];
};

export type CashSession = Tables["sessoes_caixa"]["Row"] & {
  caixa: Pick<CashDrawer, "id" | "nome" | "codigo"> | null;
  movimentos: CashMovement[];
};

export type FinancialCatalogs = {
  categories: FinancialCategory[];
  paymentMethods: PaymentMethod[];
  cashDrawers: CashDrawer[];
  clients: Array<{ id: number; nome: string; ativo: boolean }>;
  suppliers: Array<{ id: number; nome: string; nome_fantasia: string | null; ativo: boolean }>;
};

export type FinancialReportRow = {
  mes: string;
  receitas_previstas: number;
  despesas_previstas: number;
  receitas_realizadas: number;
  despesas_realizadas: number;
};

export type AccountWriteInput = {
  accountId?: number;
  companyId: number;
  type: AccountType;
  categoryId: number | null;
  clientId: number | null;
  supplierId: number | null;
  description: string;
  document: string;
  issueDate: string;
  competence: string | null;
  total: number;
  installmentCount: number;
  firstDueDate: string;
  notes: string;
};

export type AccountCancelInput = { companyId: number; accountId: number; reason: string };

export type PaymentWriteInput = {
  companyId: number;
  type: PaymentType;
  paymentMethodId: number;
  cashSessionId: number | null;
  paidAt: string;
  amount: number;
  reference: string;
  notes: string;
  allocations: Array<{ id_parcela: number; valor: number }>;
};

export type ReversalInput = { companyId: number; id: number; reason: string };
export type CashOpenInput = { companyId: number; cashDrawerId: number; openingBalance: number; notes: string };
export type CashCloseInput = { companyId: number; sessionId: number; countedBalance: number; notes: string };
export type CashMovementInput = { companyId: number; sessionId: number; type: Exclude<CashMovementType, "entrada" | "saida">; amount: number; description: string };

export type CategoryWriteInput = Pick<FinancialCategory, "id_empresa" | "nome" | "tipo" | "ativo"> & { id?: number };
export type PaymentMethodWriteInput = Pick<PaymentMethod, "id_empresa" | "nome" | "tipo" | "permite_parcelamento" | "max_parcelas" | "taxa_percentual" | "prazo_recebimento_dias" | "ativo"> & { id?: number };
export type CashDrawerWriteInput = Pick<CashDrawer, "id_empresa" | "nome" | "codigo" | "descricao" | "localizacao" | "permite_saldo_negativo" | "ativo"> & { id?: number };

