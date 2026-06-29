import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";

export async function getContasAReceber() {
    const empresaId = await getEmpresaIdAtual();
    let { data, error } = await supabase
    .from('ContasReceber')
    .select(`
        *,
        OrdensServico:osId (
            *,
            Clientes:idCliente (*)
        )
    `)
    .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível carregar as contas a receber.");

  return data;
}

export async function deleteContasReceber(id: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data: pagamentos } = await supabase
    .from("PagamentoQuitado")
    .select("id")
    .eq("idPagamentoQuit", id)
    .eq("empresa_id", empresaId);

  if (pagamentos && pagamentos.length > 0) {
    throw new Error("Não é possível excluir: existe pagamento vinculado.");
  }

  const { error } = await supabase
    .from("ContasReceber")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw error;
}