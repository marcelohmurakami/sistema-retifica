import { supabase } from "../../services/supabaseApi";
import { getEmpresaIdAtual } from "../empresas/empresasApi";
import type { ContaPagar, ContaReceber, PagamentoQuitado, PagamentoRecebido } from "../../models/financeiro";

export type AccountsReceivablePayload = Pick<
  ContaReceber,
  "descricao" | "valor" | "valorRecebido" | "dataPagamento" | "status" | "osId"
>;

export type AccountsPayableFormData = Pick<
  ContaPagar,
  "descricao" | "valor" | "valor_parcial_pago" | "dataVencimento" | "status" | "categoria"
>;

export type ReceivedPaymentFormData = Pick<
  PagamentoRecebido,
  "descricao" | "valor" | "metodoPag" | "taxaMaquina" | "dataRecebimento"
> & {
  idContaReceber?: number | null;
  observacoes?: string;
};

export type PaidPaymentFormData = Pick<
  PagamentoQuitado,
  "descricao" | "valor" | "formaPagamento" | "dataPagamento"
> & {
  idContaPagar?: number | null;
  observacoes?: string;
};

export async function createAccountsReceivable(
  data: AccountsReceivablePayload
) {
  const empresaId = await getEmpresaIdAtual();

  const { data: result, error } = await supabase
    .from("ContasReceber")
    .insert({
      ...data,
      empresa_id: empresaId,
    })
    .select()
    .single();

  if (error) throw error;

  return result;
}

export async function updateAccountsReceivable(
  id: number,
  data: AccountsReceivablePayload
) {
  const empresaId = await getEmpresaIdAtual();
  const { data: result, error } = await supabase
    .from("ContasReceber")
    .update(data)
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select()
    .single();

  if (error) throw error;

  return result;
}

export async function createAccountsPayable(
  data: AccountsPayableFormData
) {
  const empresaId = await getEmpresaIdAtual();
  const { data: result, error } = await supabase
    .from("ContasPagar")
    .insert({
      ...data,
      empresa_id: empresaId
    })
    .select()
    .single();

  if (error) throw error;

  return result;
}

export async function updateAccountsPayable(
  id: number,
  data: AccountsPayableFormData
) {
  const empresaId = await getEmpresaIdAtual();
  const { data: result, error } = await supabase
    .from("ContasPagar")
    .update(data)
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select()
    .single();

  if (error) throw error;

  return result;
}

export async function createReceivedPayment(
  data: ReceivedPaymentFormData
) {
  const empresaId = await getEmpresaIdAtual();
  const { data: result, error } = await supabase
    .from("PagamentoRecebido")
    .insert({
      ...data,
      empresa_id: empresaId
    })
    .select()
    .single();

  if (error) throw error;

  return result;
}

export async function updateReceivedPayment(
  id: number,
  data: ReceivedPaymentFormData
) {
  const empresaId = await getEmpresaIdAtual();
  const { data: result, error } = await supabase
    .from("PagamentoRecebido")
    .update(data)
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select()
    .single();

  if (error) throw error;

  return result;
}

export async function createPaidPayment(
  data: PaidPaymentFormData
) {
  const empresaId = await getEmpresaIdAtual();
  const { data: result, error } = await supabase
    .from("PagamentoQuitado")
    .insert({
      ...data,
      empresa_id: empresaId
    })
    .select()
    .single();

  if (error) throw error;

  return result;
}

export async function updatePaidPayment(
  id: number,
  data: PaidPaymentFormData
) {
  const empresaId = await getEmpresaIdAtual();
  const { data: result, error } = await supabase
    .from("PagamentoQuitado")
    .update(data)
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select()
    .single();

  if (error) throw error;

  return result;
}
