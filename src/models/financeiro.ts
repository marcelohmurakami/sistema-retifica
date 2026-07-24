import type { ClienteType } from "./cliente";

export type FinanceStatus = "pendente" | "parcial" | "pago" | "atrasado";

export type ContaPagar = {
  id: number;
  descricao: string;
  fornecedor?: string | null;
  valor: number;
  valor_parcial_pago: number;
  dataVencimento: string;
  status: FinanceStatus;
  categoria: string;
};

export type OrdemContaReceber = {
  id?: number;
  dataVencimento?: string | null;
  valorServico?: number | null;
  Clientes?: ClienteType | null;
};

export type ContaReceber = {
  id: number;
  descricao: string;
  valor: number;
  valorRecebido: number;
  dataPagamento: string;
  status: FinanceStatus;
  osId: number;
  categoria?: string | null;
  OrdensServico?: OrdemContaReceber | null;
};

export type PagamentoQuitado = {
  id: number;
  descricao: string;
  valor: number;
  formaPagamento: string;
  dataPagamento: string;
  observacoes?: string | null;
  idContaPagar?: number | null;
};

export type PagamentoRecebido = {
  id: number;
  descricao: string;
  valor: number;
  metodoPag: string;
  taxaMaquina: number;
  dataRecebimento: string;
  observacoes?: string | null;
  idContaReceber?: number | null;
  ContasReceber?: {
    OrdensServico?: OrdemContaReceber | null;
  } | null;
};
