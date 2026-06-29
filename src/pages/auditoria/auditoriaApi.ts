import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";

export async function getAuditoria() {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("auditoria_com_usuario")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return data;
}
