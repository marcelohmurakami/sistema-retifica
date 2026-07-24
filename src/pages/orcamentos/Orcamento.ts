import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";
import { PAGE_SIZE } from "../../utils/pageSize";
import type { EditOrcamentoInput, OrcamentoFormData, OrcamentoType } from "../../models/orcamento";
import { getPaginationRange, parseSort } from "../../utils/queryPagination";

const BUDGET_SORT_FIELDS = new Set(["id", "motor", "situacao", "created_at"]);

export async function GetOrcamentos(
  sortByString: string,
  page: number,
  searchTerm = ""
) {
  const empresaId = await getEmpresaIdAtual();
  const { field: sortBy, ascending } = parseSort(
    sortByString,
    BUDGET_SORT_FIELDS,
  );
  const { from, to } = getPaginationRange(page, PAGE_SIZE);

  let query = supabase
    .from("Orcamentos")
    .select(
      `
      *,
      Clientes!inner (*)
    `,
      { count: "exact" }
    )
    .order(sortBy, { ascending })
    .eq('empresa_id', empresaId);

  // 🔍 aplica busca se tiver texto
  if (searchTerm.trim()) {
    query = query.ilike(
      "Clientes.cliente",
      `%${searchTerm.trim()}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error)
    throw new Error(
      "Não foi possível carregar os dados das ordens de serviço"
    );

  return {
    data: data ?? [],
    count: count ?? 0,
  };
}

export async function getOrcamentoById(id: number): Promise<OrcamentoType | null> {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("Orcamentos")
    .select(`
      *,
      Clientes(*)
    `)
    .eq("id", id)
    .eq('empresa_id', empresaId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteOrcamento(id: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from('Orcamentos')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível excluir o cadastro do cliente.");

  return data;
}

export async function InsertOrcamento(orcamento: OrcamentoFormData) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("Orcamentos")
    .insert({
      ...orcamento,
      empresa_id: empresaId
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Nenhum dado retornado");
  }

  return data;
}

export async function EditOrcamento({ id, orcamento }: EditOrcamentoInput) {
  const empresaId = await getEmpresaIdAtual();

  const { data , error: osError } = await supabase
    .from("Orcamentos")
    .update(orcamento)
    .eq("id", id)
    .eq('empresa_id', empresaId)
    .select()
    .single()

  if (osError) {
    throw new Error(osError.message)
  }

  return data
}

export async function updateSituacaoOrcamento({
  id,
  situacao,
}: {
  id: number;
  situacao: string;
}) {
  const empresaId = await getEmpresaIdAtual();
  const { data, error } = await supabase
    .from("Orcamentos")
    .update({ situacao })
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
