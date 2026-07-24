import type { ClienteType } from "./cliente";

export type OSFormValues = {
    idCliente: number;
    formaPagamento: string;
    veículo: string;
    motor: string;
    servicosRealizados: string;
    pecasTrocadas: string;
    obs: string;
    dataServico: string;
    dataVencimento: string;
    valorServico: number;
};

export type OSCreateInput = OSFormValues;
export type OSEditInput = OSFormValues & { id: number };

export type ItemOS = {
    id: number;
    id_os: number;
    id_servico: number | null;
    produto_estoque_id: number | null;
    quantidade: number;
    valor_unitario: number;
    descricao: string;
    tipo: "servico" | "peca";
    manual: boolean;
    Servicos?: {
      id: number;
      servico: string;
      valor: number | string;
      tipo: "servico" | "peca";
    } | null;
};

export type OsType = OSFormValues & {
    id: number;
    created_at?: string;
    Clientes: ClienteType;
    itensOS?: ItemOS[];
};
