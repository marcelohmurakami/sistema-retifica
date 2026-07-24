import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";
import type { PagamentoRecebido } from "../../models/financeiro";

export async function getPagamentoRecebido(): Promise<PagamentoRecebido[]> {
  const empresaId = await getEmpresaIdAtual();
    
  const { data, error } = await supabase
    .from('PagamentoRecebido')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('dataRecebimento', { ascending: false });

  if (error) throw new Error("Não foi possível carregar os pagamentos recebidos.");

  return data ?? [];
}

export async function deletePagamentoRecebido(id: number) {
  const empresaId = await getEmpresaIdAtual();

   const { data, error } = await supabase
  .from('PagamentoRecebido')
  .delete()
  .eq('id', id)
  .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível deletar o pagamento recebido.");

  return data;
}
