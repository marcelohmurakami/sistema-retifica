import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createAccountsPayable,
  createAccountsReceivable,
  createPaidPayment,
  createReceivedPayment,
  updateAccountsPayable,
  updateAccountsReceivable,
  updatePaidPayment,
  updateReceivedPayment
} from "./apiFinanceForms";

type AccountsReceivablePayload = {
  descricao: string;
  valor: number;
  valorRecebido: number;
  dataPagamento: string;
  status: string;
  osId: number;
};

type AccountsPayablePayload = {
  descricao: string;
  valor: number;
  valor_parcial_pago?: number;
  dataVencimento: string;
  status: string;
  categoria: string;
}

type PaidPaymentPayload = {
  descricao: string;
  idContaReceber?: number | null;
  valor?: number | undefined;
  formaPagamento?: string;
  dataRecebimento?: string;
  dataPagamento?: string | Date;
  observacoes?: string;
  metodoPag?: string;
  taxaMaquina?: number;
};

type ReceivedPaymentPayload = any;

export function useAccountsReceivableForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: number;
      data: AccountsReceivablePayload;
    }) => {
      if (id) {
        return updateAccountsReceivable(id, data);
      }

      return createAccountsReceivable(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ContasReceber"],
      });
    },
  });
}

export function useContasPagarForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: number;
      data: AccountsPayablePayload;
    }) => {
      if (id) {
        return updateAccountsPayable(id, data);
      }

      return createAccountsPayable(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ContasPagar"],
      });
    },
  });
}

export function usePagamentosRecebidosForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      id?: number;
      data: ReceivedPaymentPayload;
    }) => {
      if (id) {
        return updateReceivedPayment(id, data);
      }

      return createReceivedPayment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["PagamentoRecebido"],
      });
    },
  });
}

export function usePagamentosQuitadosForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      id?: number;
      data: PaidPaymentPayload;
    }) => {
      if (id) {
        return updatePaidPayment(id, data);
      }

      return createPaidPayment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["PagamentoQuitado"],
      });
    },
  });
}