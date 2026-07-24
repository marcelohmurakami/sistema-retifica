import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";
import type { PagamentoQuitado } from "../../models/financeiro";

export async function getPagamentoQuitado(): Promise<PagamentoQuitado[]> {
    const empresaId = await getEmpresaIdAtual();

    const { data: PagamentoQuitado, error } = await supabase
    .from('PagamentoQuitado')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('dataPagamento', { ascending: false })

    if (error) throw new Error("Não foi possível carregar as contas a pagar.");

    return PagamentoQuitado ?? [];
}

export async function deletePagamentoQuitado(id: number) {
    const empresaId = await getEmpresaIdAtual();

   const { data, error } = await supabase
  .from('PagamentoQuitado')
  .delete()
  .eq('id', id)
  .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível deletar o pagamento quitado.");

  return data;
}
