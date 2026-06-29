import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";
import { PAGE_SIZE } from "../../utils/pageSize";

export async function getEstoque(sortByString: string, page: number, searchInput: string = "") {
  const empresaId = await getEmpresaIdAtual();
  const sortBy = sortByString.split('-')[0];
  const direction = sortByString.split('-')[1] === "asc" || sortBy === 'id' ? true : false;

  const from = Math.max((page - 1) * PAGE_SIZE, 0);
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("Estoque")
    .select("*", { count: "exact" })
    .order(sortBy, {ascending: direction})
    .eq("empresa_id", empresaId);

  if (searchInput.trim()) {
    query = query.ilike(
      "nome",
      `%${searchInput.trim()}%`
    );
  }

  const { data, count, error } = await query.range(from, to)

  if (error) throw new Error("Não foi possível carregar os dados dos clientes.");

  return {
    data: data ?? [],
    count: count ?? 0,
  };
}

export async function getEstoqueWithoutPage() {
  const empresaId = await getEmpresaIdAtual();

  let { data, error } = await supabase
  .from('Estoque')
  .select('*')
  .eq("empresa_id", empresaId)

  if (error) throw new Error("Não foi possível carregar os dados do cliente.");

  return data;
}

export async function deleteEstoque(id: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from('Estoque')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível excluir o cadastro do cliente.");

  return data;
}

export async function insertEstoque(estoque: any) {
  const empresaId = await getEmpresaIdAtual();
  const { data, error } = await supabase
  .from('Estoque')
  .insert({
    ...estoque,
    empresa_id: empresaId,
  })
  .select()

  if (error) throw new Error ("Não foi possível editar os dados do cliente!");

  return data;
}

export async function updateEstoque(estoque: any) {
  const empresaId = await getEmpresaIdAtual();
  const { id, ...estoqueData } = estoque;

  const { data, error } = await supabase
  .from('Estoque')
  .update(estoqueData)
  .eq('id', id)
  .eq('empresa_id', empresaId)  
  .select()
  .single()

  if (error) throw new Error ("Não foi possível editar os dados do cliente!");

  return data;
}