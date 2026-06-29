import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClientes } from "../../pages/clientes/clientesApi";
import toast from "react-hot-toast";

export function useUpdateCliente(
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>,
  reset: () => void
) {
  const queryClient = useQueryClient();

  const {
    isPending: isPendingCliente,
    mutate: mutateCliente,
  } = useMutation({
    mutationFn: updateClientes,
    onSuccess: () => {
      toast.success("Cliente editado com sucesso");

      queryClient.invalidateQueries({
        queryKey: ["cliente"],
      });

      reset();
      setIsCreateOpen(false);
    },
    onError: () =>
      toast.error("Não foi possível editar as informações do cliente"),
  });

  return { isPendingCliente, mutateCliente };
}