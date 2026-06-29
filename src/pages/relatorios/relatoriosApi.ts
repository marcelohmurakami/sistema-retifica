import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";

type PeriodoRelatorio =
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

function aplicarFiltroPeriodo<T extends { gte: any; lt: any }>(
  query: T,
  colunaData: string,
  periodo: PeriodoFiltro
) {
  let queryFiltrada = query.gte(colunaData, periodo.inicio);

  if (periodo.fim) {
    queryFiltrada = queryFiltrada.lt(colunaData, periodo.fim);
  }

  return queryFiltrada;
}

export async function getFaturamentoOS(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const periodoFiltro = getPeriodoRelatorio(periodo);

  const query = supabase
    .from("OrdensDeServiço")
    .select(`
      *,
      Clientes!inner (*)
    `)
    .eq("empresa_id", empresaId);

  const { data, error } = await aplicarFiltroPeriodo(
    query,
    "dataServico",
    periodoFiltro
  );

  if (error) {
    throw new Error("Erro ao buscar faturamento: " + error.message);
  }

  return data ?? [];
}

export async function getRecebimentosPeriodo(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const periodoFiltro = getPeriodoRelatorio(periodo);

  const query = supabase
    .from("PagamentoRecebido")
    .select("*")
    .eq("empresa_id", empresaId);

  const { data, error } = await aplicarFiltroPeriodo(
    query,
    "dataRecebimento",
    periodoFiltro
  );

  if (error) {
    throw new Error("Erro ao buscar recebimentos: " + error.message);
  }

  return data ?? [];
}

export async function getPagamentosQuitadosPeriodo(periodo: PeriodoRelatorio) {
  const empresaId = await getEmpresaIdAtual();
  const periodoFiltro = getPeriodoRelatorio(periodo);

  const query = supabase
    .from("PagamentoQuitado")
    .select("*")
    .eq("empresa_id", empresaId);

  const { data, error } = await aplicarFiltroPeriodo(
    query,
    "dataPagamento",
    periodoFiltro
  );

  if (error) {
    throw new Error("Erro ao buscar pagamentos: " + error.message);
  }

  return data ?? [];
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

  return (data ?? []).map((item: any) => ({
    nome: item.descricao,
    quantidade: Number(item.quantidade_total || 0),
    total: Number(item.faturamento_total || 0),
  }));
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

  return (data ?? []).map((item: any) => ({
    nome: item.descricao,
    quantidade: Number(item.quantidade_total || 0),
    total: Number(item.faturamento_total || 0),
  }));
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

  return (data ?? []).map((item: any) => ({
    nome: item.cliente,
    quantidade: Number(item.total_os || 0),
    total: Number(item.faturamento_total || 0),
  }));
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

  return (data ?? []).map((item: any) => ({
    nome: item.cliente,
    quantidade: Number(item.total_os || 0),
    total: Number(item.faturamento_total || 0),
  }));
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

  return (data ?? []).map((item: any) => ({
    nome: item.descricao,
    quantidade: Number(item.quantidade_total || 0),
    total: Number(item.faturamento_total || 0),
  }));
}