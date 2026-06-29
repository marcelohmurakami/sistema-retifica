import { useMutation, useQueryClient } from "@tanstack/react-query"
import { IconBtn } from "../buttons/IconBtn"
import { ClienteInfo, ClienteRow } from "./EstoqueRowStyled"
import type { ClienteType } from "../../models/cliente"
import { handleDelete } from "../../utils/handleDelete"
import { LoadingContainer } from "../spinner/LoadingContainer"
import toast from "react-hot-toast";
import type { OsType } from "../../models/os"
import { deleteEstoque } from "../../pages/estoque/estoqueApi"

export function EstoqueRow ({cliente, setClienteSelecionado ,setIsCreateOpen, isAdmin}: any) {
    const queryClient = useQueryClient();

    const { isPending, mutate } = useMutation({
        mutationFn: deleteEstoque,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['estoque'],
            })
        },
        onError: () => toast.error("Não foi possível deletar o cliente")
    })

    function handleUpdate(cliente: ClienteType | OsType) {
        setClienteSelecionado(cliente);
        setIsCreateOpen(true);
    }

    let situacao;
    if (cliente.qtdEstoque === 1) {
        situacao = "Estoque crítico";
    } else if (cliente.qtdEstoque === 0) {
        situacao = "Esgotado";
    } else {
        situacao = "Em estoque";
    }

    if (isPending) return <LoadingContainer />;

    const custoFormatado = Number(cliente.custo || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    const valorFormatado = Number(cliente.valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    return (
        <ClienteRow>
            <ClienteInfo>{cliente.id}</ClienteInfo>
            <ClienteInfo>{cliente.nome}</ClienteInfo>
            <ClienteInfo>{custoFormatado}</ClienteInfo>
            <ClienteInfo>{valorFormatado}</ClienteInfo>
            <ClienteInfo>{cliente.qtdEstoque}</ClienteInfo>
            <ClienteInfo>{situacao}</ClienteInfo>
            {isAdmin && (
                <IconBtn cliente={cliente} handleDelete={() => handleDelete(cliente.id, mutate, "cliente")} handleUpdate={handleUpdate} />
            )}
        </ClienteRow>
    )
}
