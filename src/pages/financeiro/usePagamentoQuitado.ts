import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePagamentoQuitado, getPagamentoQuitado } from "./pagamentoQuitadoApi";
import { useAuth } from "../../contexts/AuthContext";
import type { PagamentoQuitado } from "../../models/financeiro";

export function useGetPagamentoQuitado() {
  const { user } = useAuth();

  const {
    data = [],
    isLoading: isLoadingPagamentoQuitado,
    error,
  } = useQuery<PagamentoQuitado[]>({
    queryKey: ["PagamentoQuitado", "lista", user?.id],
    enabled: !!user?.id,
    queryFn: getPagamentoQuitado,
  });

  return { data, isLoadingPagamentoQuitado, error };
}

export function useDeletePagamentoQuitado() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => deletePagamentoQuitado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["PagamentoQuitado"],
      });
      queryClient.invalidateQueries({ queryKey: ["relatoriosPagamentos"] });
    },
  });

  return { mutate, isPending };
}
