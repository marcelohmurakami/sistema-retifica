import type { ClienteType } from "./cliente";

export type SituacaoOrcamento =
  | "analise"
  | "aguardando"
  | "aguardandoPecas"
  | "producao"
  | "pronto"
  | "cancelado";

export type OrcamentoFormData = {
  idCliente: number;
  motor: string;
  orcamento: string;
  obs?: string;
  situacao: SituacaoOrcamento;
};

export type OrcamentoType = OrcamentoFormData & {
  id: number;
  created_at?: string;
  Clientes: ClienteType;
};

export type EditOrcamentoInput = {
  id: number;
  orcamento: OrcamentoFormData;
};
