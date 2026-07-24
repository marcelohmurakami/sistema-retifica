import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePagamentoRecebido, getPagamentoRecebido } from "./pagamentoRecebidoApi";
import { useAuth } from "../../contexts/AuthContext";
import type { PagamentoRecebido } from "../../models/financeiro";
import toast from "react-hot-toast";

export function useGetPagamentoRecebido() {
  const { user } = useAuth();

  const {
    data = [],
    isLoading: isLoadingPagamentoRecebido,
    error,
  } = useQuery<PagamentoRecebido[]>({
    queryKey: ["PagamentoRecebido", "lista", user?.id],
    queryFn: getPagamentoRecebido,
    enabled: !!user?.id,
  });

  return { data, isLoadingPagamentoRecebido, error };
}

export function useDeletePagamentoRecebido() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => deletePagamentoRecebido(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["PagamentoRecebido"],
      });
      queryClient.invalidateQueries({ queryKey: ["relatoriosRecebimentos"] });
    },

    onError: () => {
      toast.error("Não foi possível excluir o pagamento recebido.");
    },
  });

  return { mutate, isPending };
}
