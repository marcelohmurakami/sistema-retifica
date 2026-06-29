import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteContasReceber, getContasAReceber } from "./contasReceber";
import { useAuth } from "../../contexts/AuthContext";

export function useGetContasReceber() {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingContasReceber,
    error,
  } = useQuery<any>({
    queryKey: ["ContasReceber", "lista", user?.id],
    enabled: !!user?.id,
    queryFn: getContasAReceber,
  });

  return { data, isLoadingContasReceber, error };
}

export function useDeleteContasReceber() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => deleteContasReceber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ContasReceber"],
      });
    },
  });

  return { mutate, isPending };
}