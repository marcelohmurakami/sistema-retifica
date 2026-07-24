import toast from "react-hot-toast"
import { insertServicos } from "../../pages/serviços/servicosApi"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseFormReset } from "react-hook-form";
import type { ServicoType } from "../../models/servico";

export function useInsertServicos(reset: UseFormReset<Omit<ServicoType, "id">>) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: insertServicos,
    onSuccess: () => {
      toast.success("Serviço cadastrado com sucesso");

      queryClient.invalidateQueries({
        queryKey: ["servicos"],
      });

      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  return { mutate, isPending };
}
