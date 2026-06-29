import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClienteType } from "../../models/cliente";
import type { ServicoType } from "../../models/servico";

import { getServicos, getServicosWithPagination } from "../../pages/serviços/servicosApi";
import { EditOS, getItensOS, InsertOS } from "../../pages/ordensDeServico/osApi";
import type { OSEditInput } from "./CreateOS";
import toast from "react-hot-toast";
import { getClientes } from "../../pages/clientes/clientesApi";
import { useAuth } from "../../contexts/AuthContext";

type ClientesResponse = {
  data: ClienteType[];
  count: number;
};

export function useGetClientes(
  sortBy: string,
  page: number,
  searchInput: string
) {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingClientes,
  } = useQuery<ClientesResponse>({
    queryKey: ["cliente", user?.id, sortBy, page, searchInput],
    enabled: !!user?.id,
    queryFn: () => getClientes(sortBy, page, searchInput),
  });

  const clientes = data?.data ?? [];
  const count = data?.count ?? 0;

  return { clientes, isLoadingClientes, count };
}

export function useGetServicos() {
  const { user } = useAuth();

  const {
    data: servicos = [],
    isLoading: isLoadingServicos,
    error,
  } = useQuery<ServicoType[]>({
    queryKey: ["servicos", "lista", user?.id],
    enabled: !!user?.id,
    queryFn: getServicos,
  });

  return { servicos, isLoadingServicos, error };
}

export function useGetServicosWithPagination(
  sortBy: string,
  page: number,
  searchInput: string = "",
  tipo: "servico" | "peca"
) {
  const { user } = useAuth();

  const {
    data,
    isLoading: isLoadingServicos,
    error,
  } = useQuery<any>({
    queryKey: ["servicos", "paginado", user?.id, sortBy, page, searchInput, tipo],
    enabled: !!user?.id,
    queryFn: () => getServicosWithPagination(sortBy, page, searchInput, tipo),
  });

  const servicos = data?.data;
  const count = data?.count;

  return { servicos, isLoadingServicos, error, count };
}

export function useGetItensOS(osSelecionada: OSEditInput) {
  const { user } = useAuth();

  const {
    data: itensDaOS = [],
    isLoading: isLoadingItensOS,
  } = useQuery({
    queryKey: ["itensOS", user?.id, osSelecionada?.id],
    queryFn: () => getItensOS(osSelecionada!.id),
    enabled: !!user?.id && !!osSelecionada?.id,
  });

  return { itensDaOS, isLoadingItensOS };
}

export function useInsertOS(
  reset: any,
  setServicosSelecionados: any,
  setServicoSelecionado: any,
  setQtdSelecionada: any
) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: InsertOS,
    onSuccess: () => {
      toast.success("Ordem de serviço criada com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ["OrdemDeServiço"],
      });

      queryClient.invalidateQueries({
        queryKey: ["itensOS"],
      });

      reset();
      setServicosSelecionados([]);
      setServicoSelecionado(1);
      setQtdSelecionada(1);
    },
    onError: (error: any) => {
    console.error("Erro ao criar OS:", error);
    toast.error(error.message ?? "Não foi possível criar a ordem de serviço");
    },
      });

  return { mutate, isPending };
}

export function useEditOS(
  reset: any,
  setServicosSelecionados: any,
  setServicoSelecionado: any,
  setQtdSelecionada: any
) {
  const queryClient = useQueryClient();

  const { mutate: mutateOS, isPending: isPendingOS } = useMutation({
    mutationFn: EditOS,
    onSuccess: () => {
      toast.success("Ordem de serviço editada com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ["OrdemDeServiço"],
      });

      queryClient.invalidateQueries({
        queryKey: ["itensOS"],
      });

      reset();
      setServicosSelecionados([]);
      setServicoSelecionado(1);
      setQtdSelecionada(1);
    },
    onError: () => toast.error("Não foi possível editar a ordem de serviço"),
  });

  return { mutateOS, isPendingOS };
}