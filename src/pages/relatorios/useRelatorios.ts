import { useQuery } from "@tanstack/react-query";
import { getFaturamentoOS, getPagamentosQuitadosPeriodo, getRecebimentosPeriodo, getTopClientesFaturamento, getTopClientesQuantidade, getTopPecasFaturamento, getTopServicosFaturamento, getTopServicosQuantidade } from "./relatoriosApi";
import { useAuth } from "../../contexts/AuthContext";

type PeriodoRelatorio =
  | "mes_atual"
  | "ultimos_3_meses"
  | "ultimos_6_meses"
  | "ultimo_ano"
  | "ultimos_3_anos";

export function useGetOrdensDeServico(periodo: PeriodoRelatorio) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relatorios", user?.id, periodo],
    enabled: !!user?.id,
    staleTime: 0,
    queryFn: async () => {
      const resultado = await getFaturamentoOS(periodo);
      return resultado;
    },
  });
}

export function useGetRecebimentosPeriodo(periodo: PeriodoRelatorio, enabled = true) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["relatoriosRecebimentos", user?.id, periodo],
        enabled: !!user?.id && enabled,
        staleTime: 0,
        queryFn: async () => {
            const recebimentos = await getRecebimentosPeriodo(periodo);
            return recebimentos;
        }
    })
}

export function useGetPagamentosPeriodo(periodo: PeriodoRelatorio, enabled = true) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["relatoriosPagamentos", user?.id, periodo],
        enabled: !!user?.id && enabled,
        staleTime: 0,
        queryFn: async () => {
            const pagamentos = await getPagamentosQuitadosPeriodo(periodo);
            return pagamentos;
        }
    })
}

export function useTopServicosFaturamento(periodo: PeriodoRelatorio) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relatorios", "top-servicos-faturamento", user?.id, periodo],
    queryFn: () => getTopServicosFaturamento(periodo),
    enabled: !!user?.id,
  });
}

export function useTopProdutosFaturamento(periodo: PeriodoRelatorio) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relatorios", "top-itens-faturamento", user?.id, periodo],
    queryFn: () => getTopPecasFaturamento(periodo),
    enabled: !!user?.id,
  });
}

export function useTopClientesFaturamento(periodo: PeriodoRelatorio) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relatorios", "top-clientes-faturamento", user?.id, periodo],
    queryFn: () => getTopClientesFaturamento(periodo),
    enabled: !!user?.id,
  });
}

export function useTopClienteQuantidade(periodo: PeriodoRelatorio) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relatorios", "top-clientes-quantidade", user?.id, periodo],
    queryFn: () => getTopClientesQuantidade(periodo),
    enabled: !!user?.id,
  });
}

export function useTopServicoQuantidade(periodo: PeriodoRelatorio) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relatorios", "top-servicos-quantidade", user?.id, periodo],
    queryFn: () => getTopServicosQuantidade(periodo),
    enabled: !!user?.id,
  });
}
