import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateServicos } from "./servicosApi";
import toast from "react-hot-toast";

export function useUpdateServicos() {
  const queryClient = useQueryClient();

  const {
    mutate: mutateServico,
    isPending: isPendingServico,
  } = useMutation({
    mutationFn: updateServicos,
    onSuccess: () => {
      toast.success("Serviço editado com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ["servicos"],
      });
    },
    onError: () => toast.error("Não foi possível editar o serviço"),
  });

  return { mutateServico, isPendingServico };
}