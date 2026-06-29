import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteContasPagar, getContasAPagar, getContasAtrasadas } from "./contasPagarApi";
import { useAuth } from "../../contexts/AuthContext";

export function useGetContasPagar() {
    const user = useAuth()

    const { data, isLoading: isLoadingContasPagar, error } = useQuery<any>({
        queryKey: ["ContasPagar", "lista", user?.id],
        queryFn: getContasAPagar,
        enabled: !!user?.id,
    });

    console.log(data)
    
    return { data, isLoadingContasPagar, error };
};

export function useGetContasAtrasadas() {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingContasAtrasadas,
    error,
  } = useQuery<any>({
    queryKey: ["ContasPagar", "atrasadas", user?.id],
    enabled: !!user?.id,
    queryFn: getContasAtrasadas,
  });

  return { data, isLoadingContasAtrasadas, error };
}

export function useDeleteContasPagar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => deleteContasPagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ContasPagar"],
      });

      queryClient.invalidateQueries({
        queryKey: ["ContasPagar", "lista", user?.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["ContasPagar", "atrasadas", user?.id],
      });
    },
  });

  return { mutate, isPending };
}