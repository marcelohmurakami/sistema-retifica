import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "../../../components_shared";
import { createCommissionAdjustment, getCommissionCatalogs, getCommissionReport, listCommissionLaunches, listCommissionPayments, listCommissionRules, registerCommissionPayment, reverseCommissionLaunch, reverseCommissionPayment, saveCommissionRule } from "../api/commission.api";
import type { CommissionAdjustmentInput, CommissionPaymentInput, CommissionReversalInput, RuleWriteInput } from "../types/commission.types";
import { commissionKeys } from "./commission.keys";

const showError = (error: unknown) => toast.error(getErrorMessage(error));
function useInvalidateCommissions(companyId: number) { const client = useQueryClient(); return () => client.invalidateQueries({ queryKey: commissionKeys.all(companyId) }); }

export function useCommissionCatalogs(companyId: number) { return useQuery({ queryKey: commissionKeys.catalogs(companyId), queryFn: () => getCommissionCatalogs(companyId), enabled: companyId > 0 }); }
export function useCommissionRules(companyId: number) { return useQuery({ queryKey: commissionKeys.rules(companyId), queryFn: () => listCommissionRules(companyId), enabled: companyId > 0 }); }
export function useCommissionLaunches(companyId: number) { return useQuery({ queryKey: commissionKeys.launches(companyId), queryFn: () => listCommissionLaunches(companyId), enabled: companyId > 0 }); }
export function useCommissionPayments(companyId: number) { return useQuery({ queryKey: commissionKeys.payments(companyId), queryFn: () => listCommissionPayments(companyId), enabled: companyId > 0 }); }
export function useCommissionReport(companyId: number, start: string, end: string) { return useQuery({ queryKey: commissionKeys.report(companyId, start, end), queryFn: () => getCommissionReport(companyId, start, end), enabled: companyId > 0 && Boolean(start && end) }); }

export function useSaveCommissionRule(companyId: number) { const invalidate = useInvalidateCommissions(companyId); return useMutation({ mutationFn: (input: RuleWriteInput) => saveCommissionRule(input), onSuccess: async (_, input) => { await invalidate(); toast.success(input.ruleId ? "Regra atualizada." : "Regra de comissão criada."); }, onError: showError }); }
export function useCreateCommissionAdjustment(companyId: number) { const invalidate = useInvalidateCommissions(companyId); return useMutation({ mutationFn: (input: CommissionAdjustmentInput) => createCommissionAdjustment(input), onSuccess: async () => { await invalidate(); toast.success("Ajuste de comissão liberado."); }, onError: showError }); }
export function useRegisterCommissionPayment(companyId: number) { const invalidate = useInvalidateCommissions(companyId); return useMutation({ mutationFn: (input: CommissionPaymentInput) => registerCommissionPayment(input), onSuccess: async () => { await invalidate(); toast.success("Pagamento de comissão confirmado e enviado ao financeiro."); }, onError: showError }); }
export function useReverseCommissionLaunch(companyId: number) { const invalidate = useInvalidateCommissions(companyId); return useMutation({ mutationFn: (input: CommissionReversalInput) => reverseCommissionLaunch(input), onSuccess: async () => { await invalidate(); toast.success("Lançamento de comissão estornado."); }, onError: showError }); }
export function useReverseCommissionPayment(companyId: number) { const invalidate = useInvalidateCommissions(companyId); return useMutation({ mutationFn: (input: CommissionReversalInput) => reverseCommissionPayment(input), onSuccess: async () => { await invalidate(); toast.success("Pagamento estornado e comissões restauradas."); }, onError: showError }); }
