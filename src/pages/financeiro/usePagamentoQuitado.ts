import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePagamentoQuitado, getPagamentoQuitado } from "./pagamentoQuitadoApi";
import { useAuth } from "../../contexts/AuthContext";

export function useGetPagamentoQuitado() {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingPagamentoQuitado,
    error,
  } = useQuery<any>({
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
    },
  });

  return { mutate, isPending };
}