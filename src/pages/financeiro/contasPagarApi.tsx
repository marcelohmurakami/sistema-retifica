import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";

export async function getContasAPagar() {
    const empresaId = await getEmpresaIdAtual();
    let { data: ContasPagar, error } = await supabase
    .from('ContasPagar')
    .select('*')
    .eq('empresa_id', empresaId)

    if (error) throw new Error("Não foi possível carregar as contas a pagar.");

    console.log(ContasPagar)

    return ContasPagar;
}

export async function getContasAtrasadas() {
    const empresaId = await getEmpresaIdAtual();
    const { data: ContasAtrasadas, error } = await supabase
    .from('vw_contas_pagar')
    .select('*')
    .eq('status_calculado', 'atrasado')
    .eq('empresa_id', empresaId);

    if (error) throw new Error("Não foi possível carregar as contas a pagar.");

    return ContasAtrasadas;
}

export async function deleteContasPagar(id: number) {
    const empresaId = await getEmpresaIdAtual();
   const { data, error } = await supabase
  .from('ContasPagar')
  .delete()
  .eq('id', id)
  .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível deletar a conta a pagar.");

  return data;
}