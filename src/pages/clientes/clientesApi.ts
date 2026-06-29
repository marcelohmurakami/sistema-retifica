import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import type { ClienteType } from "../../models/cliente";
import { supabase } from "../../services/supabaseApi";
import { PAGE_SIZE } from "../../utils/pageSize";

type InsertClienteProps = {
  cliente: string;
  cpfcnpj?: string | null;
  endereco?: string | null;
  telefone1?: string | null;
  telefone2?: string | null;
  oficina?: string | null;
};

type UpdateClienteProps = Omit<ClienteType, "created_at">;

export async function getAllClientes() {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("Clientes")
    .select("*")
    .eq("empresa_id", empresaId)
    
    if (error) throw new Error("Não foi possível carregar os dados dos clientes.");

    return data ?? [];
}

export async function getClientes(sortByString: string, page: number, searchInput: string = "") {
  const empresaId = await getEmpresaIdAtual();

  const sortBy = sortByString.split('-')[0];
  const direction = sortByString.split('-')[1] === "asc" || sortBy === 'id' ? true : false;

  const from = Math.max((page - 1) * PAGE_SIZE, 0);
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("Clientes")
    .select("*", { count: "exact" })
    .eq("empresa_id", empresaId)
    .order(sortBy, {ascending: direction});

  if (searchInput.trim()) {
    query = query.ilike(
      "cliente",
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

export async function getCliente(id: Number) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("Clientes")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .single()

  if (error) throw new Error("Não foi possível carregar os dados do cliente.");

  return data;
}

export async function getClientesOS(id: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data: clientesOS, error } = await supabase
    .from("OrdensDeServiço")
    .select(`
      *,
      Clientes(*)
      `)
    .eq("idCliente", id)
    .eq("empresa_id", empresaId)
    .order("dataServico", { ascending: false })
    .limit(10);

    if (error) throw new Error("Não foi possível carregar os OS's do cliente.");

    return clientesOS;
}

export async function deleteClientes(id: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from('Clientes')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId)

  if (error) throw new Error("Não foi possível excluir o cadastro do cliente.");

  return data;
}

export async function insertClientes(cliente:InsertClienteProps) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
  .from('Clientes')
  .insert({
    ...cliente,
    empresa_id: empresaId,
  })
  .select()

  if (error) throw new Error ("Não foi possível editar os dados do cliente!");

  return data;
}

export async function updateClientes(cliente: UpdateClienteProps) {
  const empresaId = await getEmpresaIdAtual();
  const { id, ...clienteData } = cliente;

  const { data, error } = await supabase
  .from('Clientes')
  .update(clienteData)
  .eq('id', id)
  .eq('empresa_id', empresaId)
  .select()
  .single()

  if (error) throw new Error ("Não foi possível editar os dados do cliente!");

  return data;
}