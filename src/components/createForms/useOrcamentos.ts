import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditOrcamento, getOrcamentoById, GetOrcamentos, InsertOrcamento, updateSituacaoOrcamento } from "../../pages/orcamentos/Orcamento";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

export function useGetOrcamentos(
  sortBy: string,
  page: number,
  searchInput: string = ""
) {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingOrcamentos,
    error,
  } = useQuery<any>({
    queryKey: ["Orcamentos", "lista", user?.id, sortBy, page, searchInput],
    enabled: !!user?.id,
    queryFn: () => GetOrcamentos(sortBy, page, searchInput),
  });

  const orcamentos = data?.data;
  const count = data?.count;

  return { orcamentos, isLoadingOrcamentos, error, count };
}

export function useGetOrcamentoById(id: number) {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingOrcamento,
    error,
  } = useQuery({
    queryKey: ["Orcamentos", "detalhe", user?.id, id],
    queryFn: () => getOrcamentoById(id),
    enabled: !!user?.id && !!id,
  });

  const orcamento = data?.data;
  const count = data?.count;

  return { orcamento, isLoadingOrcamento, error, count };
}

export function useInsertOrcamentos() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: InsertOrcamento,
    onSuccess: (data) => {
      console.log("SUCCESS:", data);
      toast.success("Orçamento criado com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ["Orcamentos"],
      });
    },

    onError: (error) => {
      console.log("ERROR:", error);
      toast.error("Não foi possível criar o orçamento");
    },
  });

  return { mutate, isPending };
}

export function useEditOrcamento(
  reset: any,
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
  const queryClient = useQueryClient();

  const {
    mutate: mutateOrcamento,
    isPending: isPendingOrcamento,
  } = useMutation({
    mutationFn: EditOrcamento,
    onSuccess: () => {
      toast.success("Orçamento editado com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ["Orcamentos"],
      });

      reset();
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Não foi possível editar o orçamento"),
  });

  return { mutateOrcamento, isPendingOrcamento };
}

export function useUpdateSituacaoOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSituacaoOrcamento,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["Orcamentos"],
      });

      toast.success("Situação atualizada");
    },
    onError: () => {
      toast.error("Não foi possível atualizar a situação");
    },
  });
}


