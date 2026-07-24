import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";
import type { ContaPagar } from "../../models/financeiro";

export async function getContasAPagar(): Promise<ContaPagar[]> {
    const empresaId = await getEmpresaIdAtual();
    const { data: ContasPagar, error } = await supabase
    .from('ContasPagar')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('dataVencimento', { ascending: true })

    if (error) throw new Error("Não foi possível carregar as contas a pagar.");

    return ContasPagar ?? [];
}

export async function getContasAtrasadas(): Promise<ContaPagar[]> {
    const empresaId = await getEmpresaIdAtual();
    const { data: ContasAtrasadas, error } = await supabase
    .from('vw_contas_pagar')
    .select('*')
    .eq('status_calculado', 'atrasado')
    .eq('empresa_id', empresaId);

    if (error) throw new Error("Não foi possível carregar as contas a pagar.");

    return ContasAtrasadas ?? [];
}

export async function deleteContasPagar(id: number) {
    const empresaId = await getEmpresaIdAtual();

  const { data: pagamentos, error: pagamentosError } = await supabase
    .from("PagamentoQuitado")
    .select("id")
    .eq("idContaPagar", id)
    .eq("empresa_id", empresaId)
    .limit(1);

  if (pagamentosError) throw new Error("Não foi possível verificar os pagamentos vinculados.");
  if (pagamentos?.length) {
    throw new Error("Não é possível excluir: existe pagamento vinculado.");
  }

   const { data, error } = await supabase
  .from('ContasPagar')
  .delete()
  .eq('id', id)
  .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível deletar a conta a pagar.");

  return data;
}
