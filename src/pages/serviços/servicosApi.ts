import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import type { ServicoType } from "../../models/servico";
import { supabase } from "../../services/supabaseApi";
import { PAGE_SIZE } from "../../utils/pageSize";
import { getPaginationRange, parseSort } from "../../utils/queryPagination";

const SERVICE_SORT_FIELDS = new Set(["id", "servico", "valor", "linha", "tipo"]);

export async function getServicos(): Promise<ServicoType[]> {
  const empresaId = await getEmpresaIdAtual();
  const { data, error } = await supabase
    .from("Servicos")
    .select("*")
    .order("servico", { ascending: true })
    .eq('empresa_id', empresaId)

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

type ServicosPaginationResponse = {
  data: ServicoType[];
  count: number;
};

export async function getServicosWithPagination(sortByString: string, page: number, searchInput: string = "", tipo: "servico" | "peca"): Promise<ServicosPaginationResponse> {
  const empresaId = await getEmpresaIdAtual();
  const { field: sortBy, ascending } = parseSort(
    sortByString,
    SERVICE_SORT_FIELDS,
  );
  const { from, to } = getPaginationRange(page, PAGE_SIZE);
  
  let query = supabase
    .from("Servicos")
    .select("*", { count: "exact" })
    .eq("tipo", tipo)
    .order(sortBy, { ascending })
    .eq('empresa_id', empresaId);

  if (searchInput.trim()) {
    query = query.ilike(
      "servico",
      `%${searchInput.trim()}%`
    );
  }

  const { data, count, error } = await query.range(from, to)

  if (error) throw new Error("Não foi possível carregar os dados dos serviços.");
  return {
    data: data ?? [],
    count: count ?? 0,
  };
}

export async function deleteServicos (id: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
  .from('Servicos')
  .delete()
  .eq('id', id)
  .eq('empresa_id', empresaId)

  if (error) throw new Error ('Não foi possível deletar o serviço!')
    return data;
}

export async function insertServicos (servico: ServicoType) {
  const empresaId = await getEmpresaIdAtual();
  const { data, error } = await supabase
  .from('Servicos')
  .insert({
    ...servico,
    empresa_id: empresaId
  })
  .select()

  if (error) throw new Error ('Não foi possível criar o novo!')
    return data;
}

type UpdateServicoInput = {
  id?: number;
  servico: string;
  valor: number;
  linha: string;
  tipo: string;
};

export async function updateServicos({
  id,
  servico,
  valor,
  linha,
  tipo,
}: UpdateServicoInput) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("Servicos")
    .update({
      servico,
      valor,
      linha,
      tipo,
    })
    .eq("id", id)
    .eq('empresa_id', empresaId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
