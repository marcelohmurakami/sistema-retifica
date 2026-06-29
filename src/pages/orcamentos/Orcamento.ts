import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import type { OsType } from "../../models/os";
import { supabase } from "../../services/supabaseApi";
import { PAGE_SIZE } from "../../utils/pageSize";

export async function GetOrcamentos(
  sortByString: string,
  page: number,
  searchTerm = ""
) {
  const empresaId = await getEmpresaIdAtual();
  const sortBy = sortByString.split("-")[0];

  const direction =
    sortByString.split("-")[1] === "asc";

  const from = Math.max((page - 1) * PAGE_SIZE, 0);
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("Orcamentos")
    .select(
      `
      *,
      Clientes!inner (*)
    `,
      { count: "exact" }
    )
    .order(sortBy, { ascending: direction })
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

export async function getOrcamentoById(id: number) {
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

export async function InsertOrcamento(orcamento: any) {
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
    console.error("Erro real:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Nenhum dado retornado");
  }

  return data;
}

export async function EditOrcamento({ id, orcamento }: any) {
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

export async function getOSById(id: number): Promise<OsType> {
  const empresaId = await getEmpresaIdAtual();
  const { data, error } = await supabase
    .from("OrdensDeServiço")
    .select(`
      *,
      Clientes(*)
    `)
    .eq("id", id)
    .eq('empresa_id', empresaId)
    .single()

  if (error) {
    throw new Error(error.message)
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
  const { data, error } = await supabase
    .from("Orcamentos")
    .update({ situacao })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}