import { formatDateValue } from "./formatDate";
import type { OSCreateInput, OSEditInput } from "../models/os";

const hoje = new Date();

const vencimento = new Date();
vencimento.setMonth(vencimento.getMonth() + 1);

export const defaultValues: OSCreateInput = {
      idCliente: 0,
      dataServico: formatDateValue(hoje),
      dataVencimento: formatDateValue(vencimento),
      formaPagamento: "Carteira",
      veículo: "",
      motor: "",
      servicosRealizados: "",
      pecasTrocadas: "",
      obs: "Sem observações",
      valorServico: 0,
}


export function editDefaultValues(osSelecionada: OSEditInput): OSCreateInput {
      const values = {
            idCliente: osSelecionada.idCliente,
            dataServico: osSelecionada?.dataServico || formatDateValue(hoje),
            dataVencimento: osSelecionada?.dataVencimento || formatDateValue(vencimento),
            formaPagamento: osSelecionada.formaPagamento ?? "Carteira",
            veículo: osSelecionada.veículo ?? "",
            motor: osSelecionada.motor ?? "",
            servicosRealizados: osSelecionada.servicosRealizados ?? "",
            pecasTrocadas: osSelecionada.pecasTrocadas ?? "",
            obs: osSelecionada.obs ?? "Sem observações",
            valorServico: Number(osSelecionada.valorServico) || 0,
      }

      return values;
}
            
