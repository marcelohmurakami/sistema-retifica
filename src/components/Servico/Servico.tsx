import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServicoType } from "../../models/servico";
import { IconBtn } from "../buttons/IconBtn";
import { ClienteInfo } from "../cliente/ClienteStyled";
import { deleteServicos } from "../../pages/serviços/servicosApi";
import { handleDelete } from "../../utils/handleDelete";
import { ServicoRow } from "./ServicoStyled";
import toast from "react-hot-toast";

type ServicosProps = {
    servico: ServicoType,
    setServicoSelecionado: React.Dispatch<React.SetStateAction<ServicoType | null>>;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAdmin?: boolean;
}

export function Servico ({ servico, setServicoSelecionado, setIsOpen, isAdmin }: ServicosProps) {

    const queryClient = useQueryClient();

    const { isPending, mutate } = useMutation({
        mutationFn: deleteServicos,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['servicos'],
            })
        },
        onError: () => toast.error("Não foi possível excluir o serviço.")
    })

    function handleUpdate() {
        setServicoSelecionado(servico);
        setIsOpen(true);
    }

    if (isPending) return null;

    const valorFormatado = Number(servico.valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    return (
        <ServicoRow>
            <ClienteInfo>{servico.id}</ClienteInfo>
            <ClienteInfo>{servico.servico}</ClienteInfo>
            <ClienteInfo>{valorFormatado}</ClienteInfo>
            {isAdmin && (
                <IconBtn cliente={servico} handleDelete={() => handleDelete(servico.id, mutate, "serviço")} handleUpdate={handleUpdate} />
            )}
        </ServicoRow>
    )
}
