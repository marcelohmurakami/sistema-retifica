import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteContasPagar, getContasAPagar, getContasAtrasadas } from "./contasPagarApi";
import { useAuth } from "../../contexts/AuthContext";
import type { ContaPagar } from "../../models/financeiro";

export function useGetContasPagar() {
    const { user } = useAuth()

    const { data = [], isLoading: isLoadingContasPagar, error } = useQuery<ContaPagar[]>({
        queryKey: ["ContasPagar", "lista", user?.id],
        queryFn: getContasAPagar,
        enabled: !!user?.id,
    });
    
    return { data, isLoadingContasPagar, error };
};

export function useGetContasAtrasadas() {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingContasAtrasadas,
    error,
  } = useQuery<ContaPagar[]>({
    queryKey: ["ContasPagar", "atrasadas", user?.id],
    enabled: !!user?.id,
    queryFn: getContasAtrasadas,
  });

  return { data, isLoadingContasAtrasadas, error };
}

export function useDeleteContasPagar() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => deleteContasPagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ContasPagar"],
      });

    },
  });

  return { mutate, isPending };
}
