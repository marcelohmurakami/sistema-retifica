import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditOrcamento, GetOrcamentos, InsertOrcamento, updateSituacaoOrcamento } from "../../pages/orcamentos/Orcamento";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import type { UseFormReset } from "react-hook-form";
import type { OrcamentoFormData, OrcamentoType } from "../../models/orcamento";

type OrcamentosResponse = { data: OrcamentoType[]; count: number };

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
  } = useQuery<OrcamentosResponse>({
    queryKey: ["Orcamentos", "lista", user?.id, sortBy, page, searchInput],
    enabled: !!user?.id,
    queryFn: () => GetOrcamentos(sortBy, page, searchInput),
  });

  const orcamentos = data?.data;
  const count = data?.count;

  return { orcamentos, isLoadingOrcamentos, error, count };
}

export function useInsertOrcamentos() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: InsertOrcamento,
    onSuccess: () => {
      toast.success("Orçamento criado com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ["Orcamentos"],
      });
    },

    onError: () => {
      toast.error("Não foi possível criar o orçamento");
    },
  });

  return { mutate, isPending };
}

export function useEditOrcamento(
  reset: UseFormReset<OrcamentoFormData>,
  setIsCreateOpen?: React.Dispatch<React.SetStateAction<boolean>>
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
      setIsCreateOpen?.(false);
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


