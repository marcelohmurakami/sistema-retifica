import { supabase } from "../../services/supabaseApi";
import { getEmpresaIdAtual } from "../empresas/empresasApi";

type AccountsReceivablePayload = {
  descricao: string;
  valor: number;
  valorRecebido: number;
  dataPagamento: string;
  status: string;
  osId: number;
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

export type AccountsPayableFormData = {
  descricao: string;
  valor: number;
  valor_parcial_pago?: number;
  dataVencimento: string;
  status: string;
  categoria: string;
};

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

export type ReceivedPaymentFormData = {
  idPagamentoQuit: number | null;
  valor: number;
  dataPagamento: string;
  formaPagamento: string;
  observacoes: string;
};

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

export type PaidPaymentFormData = {
  idPagamentoQuit?: number | null;
  idContaReceber?: number | null;
  valor?: number | undefined;
  formaPagamento?: string;
  dataRecebimento?: string;
  dataPagamento?: string | Date;
  observacoes?: string;
  metodoPag?: string;
  taxaMaquina?: number;
};

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