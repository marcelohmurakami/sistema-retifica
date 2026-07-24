import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";

export type PeriodoRelatorio =
  | "mes_atual"
  | "ultimos_3_meses"
  | "ultimos_6_meses"
  | "ultimo_ano"
  | "ultimos_3_anos";

type PeriodoFiltro = {
  inicio: string;
  fim: string | null;
};

function formatDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getPeriodoRelatorio(periodo: PeriodoRelatorio): PeriodoFiltro {
  const inicio = new Date();
  const fim = new Date();

  inicio.setHours(0, 0, 0, 0);
  fim.setHours(0, 0, 0, 0);

  if (periodo === "mes_atual") {
    inicio.setDate(1);

    fim.setMonth(inicio.getMonth() + 1);
    fim.setDate(1);

    return {
      inicio: formatDateLocal(inicio),
      fim: formatDateLocal(fim),
    };
  }

  if (periodo === "ultimos_3_meses") {
    inicio.setMonth(inicio.getMonth() - 3);
  } else if (periodo === "ultimos_6_meses") {
    inicio.setMonth(inicio.getMonth() - 6);
  } else if (periodo === "ultimo_ano") {
    inicio.setFullYear(inicio.getFullYear() - 1);
  } else {
    inicio.setFullYear(inicio.getFullYear() - 3);
  }

  return {
    inicio: formatDateLocal(inicio),
    fim: null,
  };
}

export type OSResumoRelatorio = { valorServico: number | string | null };
export type MovimentoResumoRelatorio = { valor: number | string | null };
export type RankingRelatorio = { nome: string; quantidade: number; total: number };

function normalizarRanking(
  data: unknown,
  nomeCampo: "descricao" | "cliente",
  quantidadeCampo: "quantidade_total" | "total_os",
): RankingRelatorio[] {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      nome: String(row[nomeCampo] ?? "Sem identificação"),
      quantidade: Number(row[quantidadeCampo] ?? 0),
      total: Number(row.faturamento_total ?? 0),
    };
  });
}

export async function getFaturamentoOS(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const periodoFiltro = getPeriodoRelatorio(periodo);

  let query = supabase
    .from("OrdensDeServiço")
    .select("valorServico")
    .eq("empresa_id", empresaId)
    .gte("dataServico", periodoFiltro.inicio);

  if (periodoFiltro.fim) query = query.lt("dataServico", periodoFiltro.fim);
  const { data, error } = await query;

  if (error) {
    throw new Error("Erro ao buscar faturamento: " + error.message);
  }

  return (data ?? []) as OSResumoRelatorio[];
}

export async function getRecebimentosPeriodo(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const periodoFiltro = getPeriodoRelatorio(periodo);

  let query = supabase
    .from("PagamentoRecebido")
    .select("valor")
    .eq("empresa_id", empresaId)
    .gte("dataRecebimento", periodoFiltro.inicio);

  if (periodoFiltro.fim) query = query.lt("dataRecebimento", periodoFiltro.fim);
  const { data, error } = await query;

  if (error) {
    throw new Error("Erro ao buscar recebimentos: " + error.message);
  }

  return (data ?? []) as MovimentoResumoRelatorio[];
}

export async function getPagamentosQuitadosPeriodo(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const periodoFiltro = getPeriodoRelatorio(periodo);

  let query = supabase
    .from("PagamentoQuitado")
    .select("valor")
    .eq("empresa_id", empresaId)
    .gte("dataPagamento", periodoFiltro.inicio);

  if (periodoFiltro.fim) query = query.lt("dataPagamento", periodoFiltro.fim);
  const { data, error } = await query;

  if (error) {
    throw new Error("Erro ao buscar pagamentos: " + error.message);
  }

  return (data ?? []) as MovimentoResumoRelatorio[];
}

export async function getTopServicosFaturamento(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const { inicio } = getPeriodoRelatorio(periodo);

  const { data, error } = await supabase.rpc("get_top_servicos_faturamento", {
    p_empresa_id: empresaId,
    p_data_inicio: inicio,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizarRanking(data, "descricao", "quantidade_total");
}

export async function getTopPecasFaturamento(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const { inicio } = getPeriodoRelatorio(periodo);

  const { data, error } = await supabase.rpc("get_top_pecas_faturamento", {
    p_empresa_id: empresaId,
    p_data_inicio: inicio,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizarRanking(data, "descricao", "quantidade_total");
}

export async function getTopClientesFaturamento(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const { inicio } = getPeriodoRelatorio(periodo);

  const { data, error } = await supabase.rpc("get_top_clientes_faturamento", {
    p_empresa_id: empresaId,
    p_data_inicio: inicio,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizarRanking(data, "cliente", "total_os");
}

export async function getTopClientesQuantidade(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const { inicio } = getPeriodoRelatorio(periodo);

  const { data, error } = await supabase.rpc("get_top_clientes_quantidade_os", {
    p_empresa_id: empresaId,
    p_data_inicio: inicio,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizarRanking(data, "cliente", "total_os");
}

export async function getTopServicosQuantidade(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const { inicio } = getPeriodoRelatorio(periodo);

  const { data, error } = await supabase.rpc("get_top_servicos_quantidade", {
    p_empresa_id: empresaId,
    p_data_inicio: inicio,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizarRanking(data, "descricao", "quantidade_total");
}
