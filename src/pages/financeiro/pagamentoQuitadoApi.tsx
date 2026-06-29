import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";

export async function getPagamentoQuitado() {
    const empresaId = await getEmpresaIdAtual();

    let { data: PagamentoQuitado, error } = await supabase
    .from('PagamentoQuitado')
    .select('*')
    .eq('empresa_id', empresaId)

    if (error) throw new Error("Não foi possível carregar as contas a pagar.");

    return PagamentoQuitado;
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