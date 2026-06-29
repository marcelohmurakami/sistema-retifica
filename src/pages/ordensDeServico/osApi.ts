import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import type { OsType } from "../../models/os";
import type { ServicoType } from "../../models/servico";
import { supabase } from "../../services/supabaseApi";
import { PAGE_SIZE } from "../../utils/pageSize";

export async function GetAllOs() {
  const empresaId = await getEmpresaIdAtual();

  const { data, error } = await supabase
    .from("OrdensDeServiço")
    .select(
      `
      *,
      Clientes!inner (*)
    `,
      { count: "exact" }
    )
    .eq('empresa_id', empresaId)
    .order("id", { ascending: false });

    if (error) throw new Error("Não foi possível carregar os dados das ordens de serviço.");

    return data ?? [];
}

export async function GetOS(
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
    .from("OrdensDeServiço")
    .select(
      `
      *,
      Clientes!inner (*)
    `,
      { count: "exact" }
    )
    .eq('empresa_id', empresaId)
    .order(sortBy, { ascending: direction });

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
  const empresaId = await getEmpresaIdAtual();

  const { data: itensEstoque, error: itensError } = await supabase
    .from("itensOS")
    .select("produto_estoque_id, quantidade")
    .eq("id_os", id)
    .eq("empresa_id", empresaId)
    .not("produto_estoque_id", "is", null);

  if (itensError) {
    throw new Error(itensError.message);
  }

  for (const item of itensEstoque ?? []) {
    const { data: produto, error: produtoError } = await supabase
      .from("Estoque")
      .select("id, qtdEstoque")
      .eq("id", item.produto_estoque_id)
      .eq("empresa_id", empresaId)
      .single();

    if (produtoError) {
      throw new Error(produtoError.message);
    }

    const novaQuantidade =
      Number(produto.qtdEstoque) + Number(item.quantidade);

    const { error: estoqueError } = await supabase
      .from("Estoque")
      .update({ qtdEstoque: novaQuantidade })
      .eq("id", item.produto_estoque_id)
      .eq("empresa_id", empresaId);

    if (estoqueError) {
      throw new Error(estoqueError.message);
    }
  }

  const { error: deleteItensError } = await supabase
    .from("itensOS")
    .delete()
    .eq("id_os", id)
    .eq("empresa_id", empresaId);

  if (deleteItensError) {
    throw new Error(deleteItensError.message);
  }

  const { error: deleteOSError } = await supabase
    .from("OrdensDeServiço")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (deleteOSError) {
    throw new Error(deleteOSError.message);
  }
}

export type OSCreateInput = Omit<OsType, "id" | "created_at">;
export type OSEditInput = Omit<OsType, "created_at">;

export type TipoItemOS = "servico" | "peca";

export type ServicoAdicionado = {
  servicoId?: number | null;
  descricao: string;
  valor: number;
  quantidade: number;
  tipo: TipoItemOS;
  manual: boolean;
  produtoEstoqueId?: number | null;
  origem?: "estoque" | "servicos";
};

type InsertOSParams = {
  os: OSCreateInput | OSEditInput;
  itens: ServicoAdicionado[];
  servicos: ServicoType[];
  id?: number;
};

type UpdateOSParams = {
  os: OSEditInput;
  itens: ServicoAdicionado[];
  servicos: ServicoType[];
};

export async function InsertOS({ os, itens, servicos }: InsertOSParams) {
  const empresaId = await getEmpresaIdAtual();

  const { data: osCriada, error: osError } = await supabase
    .from("OrdensDeServiço")
    .insert({
      ...os,
      empresa_id: empresaId,
    })
    .select()
    .single();

  if (osError) {
    throw new Error(osError.message);
  }

  const itensOS = itens.map((item) => {
    const servicoEncontrado = item.servicoId
      ? servicos.find((s) => s.id === item.servicoId)
      : null;

    return {
      id_os: osCriada.id,
      id_servico: item.servicoId ?? null,
      produto_estoque_id: item.produtoEstoqueId ?? null,
      quantidade: item.quantidade,
      valor_unitario: item.manual
        ? Number(item.valor)
        : Number(servicoEncontrado?.valor ?? item.valor),
      descricao: item.manual
        ? item.descricao
        : servicoEncontrado?.servico ?? item.descricao,
      tipo: item.tipo,
      manual: item.manual,
      empresa_id: empresaId,
    };
  });

  const { error: itensError } = await supabase.from("itensOS").insert(itensOS);

  if (itensError) {
    throw new Error(itensError.message);
  }

  const pecasDoEstoque = itens.filter(
    (item) => item.tipo === "peca" && item.produtoEstoqueId
  );

  for (const item of pecasDoEstoque) {
    const { data: produto, error: produtoError } = await supabase
      .from("Estoque")
      .select("id, qtdEstoque")
      .eq("id", item.produtoEstoqueId)
      .eq("empresa_id", empresaId)
      .single();

    if (produtoError) {
      throw new Error(produtoError.message);
    }

    if (Number(produto.qtdEstoque) < Number(item.quantidade)) {
      throw new Error(`Estoque insuficiente para ${item.descricao}`);
    }

    const novaQuantidade =
      Number(produto.qtdEstoque) - Number(item.quantidade);

    const { error: estoqueError } = await supabase
      .from("Estoque")
      .update({ qtdEstoque: novaQuantidade })
      .eq("id", item.produtoEstoqueId)
      .eq("empresa_id", empresaId);

    if (estoqueError) {
      throw new Error(estoqueError.message);
    }
  }

  return osCriada;
}

  function somarItensPorProduto(
    itens: { produto_estoque_id?: number | null; produtoEstoqueId?: number | null; quantidade: number }[]
  ) {
    return itens.reduce<Record<number, number>>((acc, item) => {
      const produtoId = item.produto_estoque_id ?? item.produtoEstoqueId;

      if (!produtoId) return acc;

      acc[produtoId] = (acc[produtoId] || 0) + Number(item.quantidade);

      return acc;
    }, {})
  }

export async function EditOS({ os, itens, servicos }: UpdateOSParams) {
  const empresaId = await getEmpresaIdAtual();
  const { id, ...osData } = os;

  const { data: osEditada, error: osError } = await supabase
    .from("OrdensDeServiço")
    .update(osData)
    .eq("id", id)
    .eq('empresa_id', empresaId)
    .select()
    .single();

  if (osError) {
    throw new Error(osError.message);
  }

  const { data: itensAntigos, error: itensAntigosError } = await supabase
  .from("itensOS")
  .select("produto_estoque_id, quantidade")
  .eq("id_os", id)
  .eq("empresa_id", empresaId)
  .not("produto_estoque_id", "is", null);

  if (itensAntigosError) {
    throw new Error(itensAntigosError.message);
  }

const estoqueAntigo = somarItensPorProduto(itensAntigos ?? []);

const estoqueNovo = somarItensPorProduto(
  itens.filter((item) => item.tipo === "peca" && item.produtoEstoqueId)
);

const produtosIds = new Set([
  ...Object.keys(estoqueAntigo),
  ...Object.keys(estoqueNovo),
]);

for (const produtoIdTexto of produtosIds) {
  const produtoId = Number(produtoIdTexto);

  const quantidadeAntiga = estoqueAntigo[produtoId] ?? 0;
  const quantidadeNova = estoqueNovo[produtoId] ?? 0;

  const diferenca = quantidadeNova - quantidadeAntiga;

  if (diferenca === 0) continue;

  const { data: produto, error: produtoError } = await supabase
    .from("Estoque")
    .select("id, qtdEstoque")
    .eq("id", produtoId)
    .eq("empresa_id", empresaId)
    .single();

  if (produtoError) {
    throw new Error(produtoError.message);
  }

  const novaQuantidadeEstoque = Number(produto.qtdEstoque) - diferenca;

  if (novaQuantidadeEstoque < 0) {
    throw new Error("Estoque insuficiente para atualizar a OS");
  }

  const { error: estoqueError } = await supabase
    .from("Estoque")
    .update({ qtdEstoque: novaQuantidadeEstoque })
    .eq("id", produtoId)
    .eq("empresa_id", empresaId);

  if (estoqueError) {
    throw new Error(estoqueError.message);
  }
}

  const { error: deleteItensError } = await supabase
    .from("itensOS")
    .delete()
    .eq("id_os", id);

  if (deleteItensError) {
    throw new Error(deleteItensError.message);
  }

  const itensOS = itens.map((item) => {
    const servicoEncontrado = item.servicoId
      ? servicos.find((s) => s.id === item.servicoId)
      : null;

      return {
        id_os: osEditada.id,
        id_servico: item.servicoId ?? null,
        produto_estoque_id: item.produtoEstoqueId ?? null,
        quantidade: item.quantidade,
        valor_unitario: item.manual
          ? Number(item.valor)
          : Number(servicoEncontrado?.valor ?? item.valor),
        descricao: item.manual
          ? item.descricao
          : servicoEncontrado?.servico ?? item.descricao,
        tipo: item.tipo,
        manual: item.manual,
        empresa_id: empresaId,
      };
  });

  const { error: itensError } = await supabase
    .from("itensOS")
    .insert(itensOS);

  if (itensError) {
    throw new Error(itensError.message);
  }

  return osEditada;
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