import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type AccountsPayableFormData,
  type AccountsReceivablePayload,
  type PaidPaymentFormData,
  type ReceivedPaymentFormData,
    createAccountsPayable,
  createAccountsReceivable,
  createPaidPayment,
  createReceivedPayment,
  updateAccountsPayable,
  updateAccountsReceivable,
  updatePaidPayment,
  updateReceivedPayment
} from "./apiFinanceForms";

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
      data: AccountsPayableFormData;
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
      data: ReceivedPaymentFormData;
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
      queryClient.invalidateQueries({ queryKey: ["relatoriosRecebimentos"] });
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
      data: PaidPaymentFormData;
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
      queryClient.invalidateQueries({ queryKey: ["relatoriosPagamentos"] });
    },
  });
}
