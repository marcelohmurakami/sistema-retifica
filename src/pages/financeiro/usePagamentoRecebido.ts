import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePagamentoRecebido, getPagamentoRecebido } from "./pagamentoRecebidoApi";
import { useAuth } from "../../contexts/AuthContext";

export function useGetPagamentoRecebido() {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingPagamentoRecebido,
    error,
  } = useQuery<any>({
    queryKey: ["PagamentoRecebido", "lista", user?.id],
    queryFn: getPagamentoRecebido,
    enabled: !!user?.id,
  });

  console.log(data)

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
    },

    onError: (error) => {
      console.log("Erro ao excluir pagamento recebido:", error);
      alert("Erro ao excluir pagamento recebido");
    },
  });

  return { mutate, isPending };
}