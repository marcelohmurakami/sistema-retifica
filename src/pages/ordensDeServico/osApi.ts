import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import type { OSCreateInput, OSEditInput, OsType } from "../../models/os";
import { supabase } from "../../services/supabaseApi";
import type { Json } from "../../types/database.types";
import { PAGE_SIZE } from "../../utils/pageSize";
import { getPaginationRange, parseSort } from "../../utils/queryPagination";

const OS_SORT_FIELDS = new Set(["id", "valorServico", "dataServico", "motor"]);

export async function GetAllOs(): Promise<{ data: OsType[]; count: number }> {
  const empresaId = await getEmpresaIdAtual();
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setMonth(inicio.getMonth() - 11);
  const dataInicio = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-01`;

  const [listaResult, countResult] = await Promise.all([
    supabase
      .from("OrdensDeServiço")
      .select(`*, Clientes!inner (*)`)
      .eq("empresa_id", empresaId)
      .gte("dataServico", dataInicio)
      .order("id", { ascending: false }),
    supabase
      .from("OrdensDeServiço")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId),
  ]);

  if (listaResult.error || countResult.error) {
    throw new Error("Não foi possível carregar os dados das ordens de serviço.");
  }

  return {
    data: (listaResult.data ?? []) as OsType[],
    count: countResult.count ?? 0,
  };
}

export async function GetOS(
  sortByString: string,
  page: number,
  searchTerm = ""
) {
  const empresaId = await getEmpresaIdAtual();  
  const { field: sortBy, ascending } = parseSort(
    sortByString,
    OS_SORT_FIELDS,
  );
  const { from, to } = getPaginationRange(page, PAGE_SIZE);

  let query = supabase
    .from("OrdensDeServiço")
    .select(
      `
      *,
      Clientes!inner (*)
    `,
      { count: "exact" }
    )
    .eq('empresa_id', empresaId)
    .order(sortBy, { ascending });

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

export async function DeleteOS(id: number) {
  const { error } = await supabase.rpc("excluir_ordem_servico", {
    p_os_id: id,
  });

  if (error) throw new Error(error.message);
}

export type TipoItemOS = "servico" | "peca";

export type ServicoAdicionado = {
  servicoId?: number | null;
  descricao: string;
  valor: number;
  quantidade: number;
  tipo: TipoItemOS;
  manual: boolean;
  produtoEstoqueId?: number | null;
};

type InsertOSParams = {
  os: OSCreateInput | OSEditInput;
  itens: ServicoAdicionado[];
};

type UpdateOSParams = {
  os: OSEditInput;
  itens: ServicoAdicionado[];
};

function normalizarOsParaRpc(os: OSCreateInput): Json {
  return {
    idCliente: os.idCliente,
    formaPagamento: os.formaPagamento,
    veículo: os.veículo,
    motor: os.motor,
    servicosRealizados: os.servicosRealizados,
    pecasTrocadas: os.pecasTrocadas,
    obs: os.obs,
    dataServico: os.dataServico,
    dataVencimento: os.dataVencimento,
    valorServico: os.valorServico,
  };
}

function normalizarItensParaRpc(itens: ServicoAdicionado[]): Json {
  return itens.map((item) => ({
    servicoId: item.servicoId ?? null,
    produtoEstoqueId: item.produtoEstoqueId ?? null,
    descricao: item.descricao,
    valor: Number(item.valor),
    quantidade: Number(item.quantidade),
    tipo: item.tipo,
    manual: item.manual,
  }));
}

export async function InsertOS({ os, itens }: InsertOSParams) {
  const { data, error } = await supabase.rpc("salvar_ordem_servico", {
    p_os: normalizarOsParaRpc(os),
    p_itens: normalizarItensParaRpc(itens),
    p_os_id: null,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function EditOS({ os, itens }: UpdateOSParams) {
  const { id, ...osData } = os;
  const { data, error } = await supabase.rpc("salvar_ordem_servico", {
    p_os: normalizarOsParaRpc(osData),
    p_itens: normalizarItensParaRpc(itens),
    p_os_id: id,
  });

  if (error) throw new Error(error.message);
  return data;
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

export async function getFullDetailsOs (id: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
  .from("OrdensDeServiço")
  .select(`
    *,
    Clientes (*),
    itensOS (
      *,
      Servicos (*)
    )
  `)
  .eq("id", id)
  .eq('empresa_id', empresaId)
  .single()

  if (error) throw new Error ("Não foi possível consultar os dados")

  return data;
}

export async function getItensOS(idOS: number) {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("itensOS")
    .select(`
      *,
      Servicos (*)
    `)
    .eq("id_os", idOS)
    .eq('empresa_id', empresaId);

  if (error) {
    throw new Error("Não foi possível carregar os itens da OS.");
  }

  return data;
}
