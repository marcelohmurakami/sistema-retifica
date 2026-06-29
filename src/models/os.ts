import type { OSCreateInput, ServicoAdicionado } from "../pages/ordensDeServico/osApi";
import type { ClienteType } from "./cliente";
import type { ServicoType } from "./servico";

type InsertOSParams = {
  os: OSCreateInput
  itens: ServicoAdicionado[]
  Servicos: ServicoType[]
}

export type OsType = {
    id: number,
    idCliente: number,
    formaPagamento: string,
    veículo: string,
    motor: string,
    servicosRealizados: string,
    pecasTrocadas: string,
    obs: string,
    dataServico: string,
    dataVencimento: string,
    valorServico: number,

    Clientes: ClienteType,
    itensOS: InsertOSParams[] | ServicoType[],
}   