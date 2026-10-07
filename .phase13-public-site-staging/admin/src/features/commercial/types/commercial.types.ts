import type { Tables } from "../../../types/database.types";

export type ClientSummary = Pick<Tables<"clientes">, "id" | "nome" | "telefone_principal" | "ativo">;
export type ServiceSummary = Pick<Tables<"servicos">, "id" | "nome" | "preco" | "ativo">;
export type ProductSummary = Pick<Tables<"produtos">, "id" | "nome" | "codigo" | "preco_venda" | "estoque_atual" | "unidade_medida" | "controla_estoque" | "ativo">;
export type EmployeeSummary = Pick<Tables<"funcionarios">, "id" | "nome" | "cargo" | "ativo" | "atende_clientes">;
export type EmployeeService = Pick<Tables<"funcionarios_servicos">, "id_funcionario" | "id_servico" | "ativo">;
export type PaymentMethodSummary = Pick<Tables<"formas_pagamento">, "id" | "nome" | "tipo" | "ativo">;
export type CashSessionSummary = Pick<Tables<"sessoes_caixa">, "id" | "status" | "saldo_esperado"> & {
  caixa: Pick<Tables<"caixas">, "id" | "nome"> | null;
};

export type QuoteItem = Tables<"orcamentos_itens">;
export type Quote = Tables<"orcamentos"> & {
  cliente: ClientSummary | null;
  itens: QuoteItem[];
};

export type CommandItem = Tables<"comandas_itens"> & {
  funcionario: Pick<EmployeeSummary, "id" | "nome"> | null;
};
export type CommandAccount = Pick<Tables<"contas">, "id" | "status" | "valor_total" | "valor_pago"> & {
  parcelas: Array<Pick<Tables<"contas_parcelas">, "id" | "numero_parcela" | "data_vencimento" | "valor_parcela" | "valor_pago" | "status">>;
};
export type Command = Tables<"comandas"> & {
  condicao_pagamento: PaymentSituation;
  cliente: ClientSummary | null;
  responsavel: Pick<EmployeeSummary, "id" | "nome"> | null;
  itens: CommandItem[];
  conta: CommandAccount | null;
};

export type CommercialCatalogs = {
  clients: ClientSummary[];
  services: ServiceSummary[];
  products: ProductSummary[];
  employees: EmployeeSummary[];
  employeeServices: EmployeeService[];
  paymentMethods: PaymentMethodSummary[];
  cashSessions: CashSessionSummary[];
};

export type CommercialItemType = "servico" | "produto" | "outro";

export type CommercialItemForm = {
  key: string;
  type: CommercialItemType;
  catalogId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  employeeId: string;
  notes: string;
  sourceItemId?: number;
};

export type QuoteFormValues = {
  clientId: string;
  validity: string;
  discount: string;
  surcharge: string;
  notes: string;
  items: CommercialItemForm[];
};

export type CommandFormValues = {
  clientId: string;
  responsibleEmployeeId: string;
  paymentCondition: CommandPaymentCondition;
  discount: string;
  surcharge: string;
  notes: string;
  items: CommercialItemForm[];
};

export type CommercialItemPayload = {
  tipo_item: CommercialItemType;
  id_servico: number | null;
  id_produto: number | null;
  id_funcionario?: number | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  observacoes: string;
};

export type QuoteWriteInput = {
  quoteId?: number;
  companyId: number;
  clientId: number;
  validity: string | null;
  discount: number;
  surcharge: number;
  notes: string;
  items: CommercialItemPayload[];
};

export type CommandWriteInput = {
  commandId?: number;
  companyId: number;
  clientId: number;
  responsibleEmployeeId: number | null;
  paymentCondition: CommandPaymentCondition;
  discount: number;
  surcharge: number;
  notes: string;
  items: CommercialItemPayload[];
};

export type QuoteStatus = "rascunho" | "enviado" | "aprovado" | "recusado" | "expirado" | "convertido" | "cancelado";
export type CommandStatus = "aberta" | "fechada" | "cancelada";
export type PaymentSituation = "a_receber" | "parcial" | "pago";
export type CommandPaymentCondition = Exclude<PaymentSituation, "parcial">;
export type CommandPaymentDisplayStatus = PaymentSituation | "vencido" | "cancelado" | "sem_cobranca" | "receber_no_fechamento";

export type QuoteStatusInput = {
  companyId: number;
  quoteId: number;
  status: QuoteStatus;
  observation?: string;
};

export type QuoteConversionInput = {
  companyId: number;
  quoteId: number;
  responsibleEmployeeId: number | null;
  serviceEmployees: Record<string, number>;
  notes: string;
};

export type CloseCommandInput = {
  companyId: number;
  commandId: number;
  dueDate: string;
  paymentSituation: PaymentSituation;
  paymentMethodId: number | null;
  cashSessionId: number | null;
  paidAt: string | null;
  amount: number | null;
  reference: string;
  notes: string;
};

export type CancelCommandInput = {
  companyId: number;
  commandId: number;
  reason: string;
};
