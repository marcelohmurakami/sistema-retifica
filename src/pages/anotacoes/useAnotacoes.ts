import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAnotacoesDiarias, createAnotacoesGerais, deleteAnotacoesDiarias, deleteAnotacoesGerais, getAnotacoesDiarias, getAnotacoesGerais, updateAnotacoesDiarias, updateAnotacoesGerais, updateStatusAnotacaoDiaria } from "./anotacoesApi";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

export function useGetAnotacoesDiarias() {
  const { user } = useAuth();

  const {
    data: anotacoes_diarias = [],
    isLoading: isLoadingAnotacoesDiarias,
    error,
  } = useQuery({
    queryKey: ["anotacoes_diarias", user?.id],
    enabled: !!user?.id,
    queryFn: getAnotacoesDiarias,
  });

  return { anotacoes_diarias, isLoadingAnotacoesDiarias, error };
}

export function useGetAnotacoesGerais() {
  const { user } = useAuth();

  const {
    data: anotacoes_gerais = [],
    isLoading: isLoadingAnotacoesGerais,
    error,
  } = useQuery({
    queryKey: ["anotacoes_gerais", user?.id],
    enabled: !!user?.id,
    queryFn: getAnotacoesGerais,
  });

  return { anotacoes_gerais, isLoadingAnotacoesGerais, error };
}

export function useInsertAnotacoesDiarias() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createAnotacoesDiarias,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes_diarias"] });
      toast.success("Tarefa criada com sucesso!");
    },
  });

  return { mutate, isPending };
}

export function useInsertAnotacoesGerais() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createAnotacoesGerais,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes_gerais"] });
      toast.success("Anotação criada com sucesso!");
    },
  });

  return { mutate, isPending };
}

export function useEditAnotacoesDiarias() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateAnotacoesDiarias,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes_diarias"] });
      toast.success("Tarefa editada com sucesso!");
    },
  });

  return { mutate, isPending };
}

export function useUpdateStatusAnotacaoDiaria() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateStatusAnotacaoDiaria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes_diarias"] });
    },
    onError: () => {
      toast.error("Nao foi possivel atualizar a tarefa.");
    },
  });

  return { mutate, isPending };
}

export function useEditAnotacoesGerais() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateAnotacoesGerais,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes_gerais"] });
      toast.success("Anotação editada com sucesso!");
    },
  });

  return { mutate, isPending };
}

export function useDeleteAnotacoesDiarias() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteAnotacoesDiarias,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes_diarias"] });
      toast.success("Tarefa deletada com sucesso!");
    },
  });

  return { mutate, isPending };
}

export function useDeleteAnotacoesGerais() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteAnotacoesGerais,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes_gerais"] });
      toast.success("Anotação deletada com sucesso!");
    },
  });

  return { mutate, isPending };
}
