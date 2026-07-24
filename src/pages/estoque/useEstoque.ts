import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getEstoque, getEstoqueWithoutPage, insertEstoque, updateEstoque } from "./estoqueApi";
import { useAuth } from "../../contexts/AuthContext";
import type { EstoqueFormData, EstoqueItem, EstoqueUpdate } from "../../models/estoque";
import type { UseFormReset } from "react-hook-form";
import type { Dispatch, SetStateAction } from "react";

export function useGetEstoque() {
  const { user } = useAuth();

  const {
    data: estoque = [],
    isLoading: isLoadingEstoque,
    error,
  } = useQuery<EstoqueItem[]>({
    queryKey: ["Estoque", "lista", user?.id],
    enabled: !!user?.id,
    queryFn: getEstoqueWithoutPage,
  });

  return { estoque, isLoadingEstoque, error };
}

export function useGetEstoqueWithPagination(
  sortBy: string,
  page: number,
  searchInput: string = ""
) {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingEstoque,
    error,
  } = useQuery<{ data: EstoqueItem[]; count: number }>({
    queryKey: ["Estoque", "paginado", user?.id, sortBy, page, searchInput],
    enabled: !!user?.id,
    queryFn: () => getEstoque(sortBy, page, searchInput),
  });

  const estoque = data?.data;
  const count = data?.count;

  return { estoque, isLoadingEstoque, error, count };
}

export function useInsertEstoque(
  reset: UseFormReset<EstoqueFormData>,
  setIsCreateOpen: Dispatch<SetStateAction<boolean>>,
) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: insertEstoque,
    onSuccess: () => {
      toast.success("Produto adicionado com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ["Estoque"],
      });

      reset();
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Não foi possível criar o produto"),
  });

  return { mutate, isPending };
}

export function useEditEstoque(
  reset: UseFormReset<EstoqueFormData>,
  setIsCreateOpen: Dispatch<SetStateAction<boolean>>,
) {
  const queryClient = useQueryClient();

  const {
    mutate: mutateEstoque,
    isPending: isPendingEstoque,
  } = useMutation({
    mutationFn: (data: EstoqueUpdate) => updateEstoque(data),
    onSuccess: () => {
      toast.success("Produto editado com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ["Estoque"],
      });

      reset();
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Não foi possível editar o produto"),
  });

  return { mutateEstoque, isPendingEstoque };
}
