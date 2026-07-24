import { z } from "zod";
import type { clienteSchema } from "../components/createForms/ClienteSchema";
import type { EstoqueFormData } from "../models/estoque";

type ClienteFormData = z.infer<typeof clienteSchema>;

export function normalizeCliente(data: ClienteFormData) {
  return {
    ...data,
    cpfcnpj: data.cpfcnpj === "" ? null : data.cpfcnpj,
    telefone1: data.telefone1 === "" ? null : data.telefone1,
    telefone2: data.telefone2 === "" ? null : data.telefone2,
    endereco: data.endereco === "" ? null : data.endereco,
    oficina: data.oficina === "" ? null : data.oficina,
  };
}

export function makeUpdateClientePayload(
  id: number,
  data: ReturnType<typeof normalizeCliente>
) {
  return {
    id,
    cliente: data.cliente,
    cpfcnpj: data.cpfcnpj ?? "",
    endereco: data.endereco ?? "",
    telefone1: data.telefone1 ?? "",
    telefone2: data.telefone2 ?? "",
    oficina: data.oficina ?? "",
  };
}

export function makeUpdateEstoquePayload(
  id: number,
  data: EstoqueFormData,
) {
  return {
    id,
    nome: data.nome,
    custo: Number(data.custo),
    valor: Number(data.valor),
    qtdEstoque: Number(data.qtdEstoque),
  };
}
