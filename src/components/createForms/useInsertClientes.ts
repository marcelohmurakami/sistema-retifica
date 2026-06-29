import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertClientes } from "../../pages/clientes/clientesApi";
import toast from "react-hot-toast";

export function useInsertClientes(setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>, reset: () => void) {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
    mutationFn: insertClientes,
    onSuccess: () => {
        toast.success("Cliente cadastrado com sucesso");
        queryClient.invalidateQueries({ queryKey: ["cliente"] });
        reset();
        setIsCreateOpen(false);
    },
    onError: () => toast.error("Não foi possível cadastrar o cliente"),
    });

    return {mutate, isPending};
}