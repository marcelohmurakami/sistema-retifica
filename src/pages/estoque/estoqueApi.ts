import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";
import { PAGE_SIZE } from "../../utils/pageSize";
import type { EstoqueFormData, EstoqueItem, EstoqueUpdate } from "../../models/estoque";
import { getPaginationRange, parseSort } from "../../utils/queryPagination";
import { sortByName } from "../../utils/sortByName";

const ALLOWED_SORT_FIELDS = new Set(["id", "nome", "custo", "valor", "qtdEstoque"]);

export async function getEstoque(sortByString: string, page: number, searchInput: string = "") {
  const empresaId = await getEmpresaIdAtual();
  const { field: sortBy, ascending } = parseSort(
    sortByString,
    ALLOWED_SORT_FIELDS,
  );
  const { from, to } = getPaginationRange(page, PAGE_SIZE);

  let query = supabase
    .from("Estoque")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending })
    .eq("empresa_id", empresaId);

  if (searchInput.trim()) {
    query = query.ilike(
      "nome",
      `%${searchInput.trim()}%`
    );
  }

  const { data, count, error } = await query.range(from, to)

  if (error) throw new Error("Não foi possível carregar os produtos do estoque.");

  return {
    data: data ?? [],
    count: count ?? 0,
  };
}

export async function getEstoqueWithoutPage(): Promise<EstoqueItem[]> {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("Estoque")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true, nullsFirst: false });

  if (error) throw new Error("Não foi possível carregar os produtos do estoque.");

  return sortByName(data ?? [], (produto) => produto.nome);
}

export async function deleteEstoque(id: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from('Estoque')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível excluir o produto.");

  return data;
}

export async function insertEstoque(estoque: EstoqueFormData) {
  const empresaId = await getEmpresaIdAtual();
  const { data, error } = await supabase
  .from('Estoque')
  .insert({
    ...estoque,
    custo: Number(estoque.custo),
    valor: Number(estoque.valor),
    qtdEstoque: Number(estoque.qtdEstoque),
    empresa_id: empresaId,
  })
  .select()

  if (error) throw new Error ("Não foi possível cadastrar o produto.");

  return data;
}

export async function updateEstoque(estoque: EstoqueUpdate) {
  const empresaId = await getEmpresaIdAtual();
  const { id, ...estoqueData } = estoque;

  const { data, error } = await supabase
  .from('Estoque')
  .update(estoqueData)
  .eq('id', id)
  .eq('empresa_id', empresaId)  
  .select()
  .single()

  if (error) throw new Error ("Não foi possível editar o produto.");

  return data;
}
