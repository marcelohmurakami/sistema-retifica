import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "../../../components_shared";
import { cancelCommand, changeQuoteStatus, closeCommand, convertQuote, getCommercialCatalogs, listCommands, listQuotes, saveCommand, saveQuote } from "../api/commercial.api";
import type { CancelCommandInput, CloseCommandInput, CommandWriteInput, QuoteConversionInput, QuoteStatusInput, QuoteWriteInput } from "../types/commercial.types";
import { commercialKeys } from "./commercial.keys";

export function useCommercialCatalogs(companyId: number) {
  return useQuery({ queryKey: commercialKeys.catalogs(companyId), queryFn: () => getCommercialCatalogs(companyId), enabled: companyId > 0, staleTime: 60_000 });
}
export function useQuotes(companyId: number) {
  return useQuery({ queryKey: commercialKeys.quotes(companyId), queryFn: () => listQuotes(companyId), enabled: companyId > 0 });
}
export function useCommands(companyId: number) {
  return useQuery({ queryKey: commercialKeys.commands(companyId), queryFn: () => listCommands(companyId), enabled: companyId > 0 });
}

function useInvalidateCommercial(companyId: number) {
  const client = useQueryClient();
  return async (includeRelated = false) => {
    await client.invalidateQueries({ queryKey: commercialKeys.all(companyId) });
    if (includeRelated) await Promise.all([
      client.invalidateQueries({ queryKey: ["inventory", companyId] }),
      client.invalidateQueries({ queryKey: ["finance", companyId] }),
      client.invalidateQueries({ queryKey: ["commissions", companyId] }),
    ]);
  };
}
function showError(error: unknown) { toast.error(getErrorMessage(error, "Não foi possível concluir a operação.")); }

export function useSaveQuote(companyId: number) {
  const invalidate = useInvalidateCommercial(companyId);
  return useMutation({ mutationFn: (input: QuoteWriteInput) => saveQuote(input), onSuccess: async (_, input) => { await invalidate(); toast.success(input.quoteId ? "Orçamento atualizado." : "Orçamento criado."); }, onError: showError });
}
export function useChangeQuoteStatus(companyId: number) {
  const invalidate = useInvalidateCommercial(companyId);
  return useMutation({ mutationFn: (input: QuoteStatusInput) => changeQuoteStatus(input), onSuccess: async (_, input) => { await invalidate(); const labels: Record<string, string> = { enviado: "Orçamento marcado como enviado.", aprovado: "Orçamento aprovado.", recusado: "Orçamento recusado.", cancelado: "Orçamento cancelado.", expirado: "Orçamento marcado como expirado." }; toast.success(labels[input.status] ?? "Orçamento atualizado."); }, onError: showError });
}
export function useConvertQuote(companyId: number) {
  const invalidate = useInvalidateCommercial(companyId);
  return useMutation({ mutationFn: (input: QuoteConversionInput) => convertQuote(input), onSuccess: async () => { await invalidate(); toast.success("Orçamento convertido em comanda aberta."); }, onError: showError });
}
export function useSaveCommand(companyId: number) {
  const invalidate = useInvalidateCommercial(companyId);
  return useMutation({ mutationFn: (input: CommandWriteInput) => saveCommand(input), onSuccess: async (_, input) => { await invalidate(); toast.success(input.commandId ? "Comanda atualizada." : "Comanda aberta com sucesso."); }, onError: showError });
}
export function useCloseCommand(companyId: number) {
  const invalidate = useInvalidateCommercial(companyId);
  return useMutation({ mutationFn: (input: CloseCommandInput) => closeCommand(input), onSuccess: async (_, input) => { await invalidate(true); const messages = { a_receber: "Comanda fechada e conta a receber criada.", parcial: "Comanda fechada com pagamento parcial registrado.", pago: "Comanda fechada e pagamento integral registrado." }; toast.success(messages[input.paymentSituation]); }, onError: showError });
}
export function useCancelCommand(companyId: number) {
  const invalidate = useInvalidateCommercial(companyId);
  return useMutation({ mutationFn: (input: CancelCommandInput) => cancelCommand(input), onSuccess: async () => { await invalidate(true); toast.success("Comanda cancelada e lançamentos estornados."); }, onError: showError });
}
