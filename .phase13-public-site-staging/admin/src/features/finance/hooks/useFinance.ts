import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "../../../components_shared";
import { cancelFinancialAccount, closeCashSession, createCashMovement, getFinancialCatalogs, getFinancialReport, listCashSessions, listFinancialAccounts, listFinancialPayments, openCashSession, registerFinancialPayment, reverseCashMovement, reverseFinancialPayment, saveCashDrawer, saveFinancialAccount, saveFinancialCategory, savePaymentMethod } from "../api/finance.api";
import type { AccountCancelInput, AccountWriteInput, CashCloseInput, CashDrawerWriteInput, CashMovementInput, CashOpenInput, CategoryWriteInput, PaymentMethodWriteInput, PaymentWriteInput, ReversalInput } from "../types/finance.types";
import { financeKeys } from "./finance.keys";

const showError = (error: unknown) => toast.error(getErrorMessage(error));

function useInvalidateFinance(companyId: number) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: financeKeys.all(companyId) });
}

export function useFinancialCatalogs(companyId: number) { return useQuery({ queryKey: financeKeys.catalogs(companyId), queryFn: () => getFinancialCatalogs(companyId), enabled: companyId > 0 }); }
export function useFinancialAccounts(companyId: number) { return useQuery({ queryKey: financeKeys.accounts(companyId), queryFn: () => listFinancialAccounts(companyId), enabled: companyId > 0 }); }
export function useFinancialPayments(companyId: number) { return useQuery({ queryKey: financeKeys.payments(companyId), queryFn: () => listFinancialPayments(companyId), enabled: companyId > 0 }); }
export function useCashSessions(companyId: number) { return useQuery({ queryKey: financeKeys.sessions(companyId), queryFn: () => listCashSessions(companyId), enabled: companyId > 0 }); }
export function useFinancialReport(companyId: number, start: string, end: string) { return useQuery({ queryKey: financeKeys.report(companyId, start, end), queryFn: () => getFinancialReport(companyId, start, end), enabled: companyId > 0 && Boolean(start && end) }); }

export function useSaveFinancialAccount(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: AccountWriteInput) => saveFinancialAccount(input), onSuccess: async (_, input) => { await invalidate(); toast.success(input.accountId ? "Conta atualizada." : "Conta e parcelas criadas."); }, onError: showError }); }
export function useCancelFinancialAccount(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: AccountCancelInput) => cancelFinancialAccount(input), onSuccess: async () => { await invalidate(); toast.success("Conta cancelada."); }, onError: showError }); }
export function useRegisterPayment(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: PaymentWriteInput) => registerFinancialPayment(input), onSuccess: async () => { await invalidate(); toast.success("Pagamento confirmado e parcela atualizada."); }, onError: showError }); }
export function useReversePayment(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: ReversalInput) => reverseFinancialPayment(input), onSuccess: async () => { await invalidate(); toast.success("Pagamento estornado e saldo restaurado."); }, onError: showError }); }
export function useOpenCashSession(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: CashOpenInput) => openCashSession(input), onSuccess: async () => { await invalidate(); toast.success("Caixa aberto com sucesso."); }, onError: showError }); }
export function useCloseCashSession(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: CashCloseInput) => closeCashSession(input), onSuccess: async (_, input) => { await invalidate(); toast.success(`Caixa fechado. Saldo contado: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(input.countedBalance)}.`); }, onError: showError }); }
export function useCreateCashMovement(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: CashMovementInput) => createCashMovement(input), onSuccess: async (_, input) => { await invalidate(); toast.success(input.type === "sangria" ? "Sangria registrada." : input.type === "suprimento" ? "Suprimento registrado." : "Ajuste registrado."); }, onError: showError }); }
export function useReverseCashMovement(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: ReversalInput) => reverseCashMovement(input), onSuccess: async () => { await invalidate(); toast.success("Movimento de caixa estornado."); }, onError: showError }); }
export function useSaveFinancialCategory(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: CategoryWriteInput) => saveFinancialCategory(input), onSuccess: async () => { await invalidate(); toast.success("Categoria salva."); }, onError: showError }); }
export function useSavePaymentMethod(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: PaymentMethodWriteInput) => savePaymentMethod(input), onSuccess: async () => { await invalidate(); toast.success("Forma de pagamento salva."); }, onError: showError }); }
export function useSaveCashDrawer(companyId: number) { const invalidate = useInvalidateFinance(companyId); return useMutation({ mutationFn: (input: CashDrawerWriteInput) => saveCashDrawer(input), onSuccess: async () => { await invalidate(); toast.success("Caixa salvo."); }, onError: showError }); }
