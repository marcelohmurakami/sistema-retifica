import { formatDateValue } from "./formatDate";

const hoje = new Date();

const vencimento = new Date();
vencimento.setMonth(vencimento.getMonth() + 1);

export const defaultValues: any = {
      idCliente: null,
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


export function editDefaultValues(osSelecionada: any) {
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
            valorServico: Number(osSelecionada.valorServico) ?? 0,
      }

      return values;
}
            
