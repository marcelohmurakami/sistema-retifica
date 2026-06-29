import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatCpfCnpj } from "../../utils/formatcpfcnpj"
import { formatPhone } from "../../utils/formatphone"
import { IconBtn } from "../buttons/IconBtn"
import { ClienteInfo, ClienteRow } from "./ClienteStyled"
import { deleteClientes } from "../../pages/clientes/clientesApi"
import type { ClienteType } from "../../models/cliente"
import { handleDelete } from "../../utils/handleDelete"
import { LoadingContainer } from "../spinner/LoadingContainer"
import { Link } from "react-router"
import toast from "react-hot-toast";
import type { OsType } from "../../models/os"

type ClienteProps = {
  cliente: ClienteType;
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setClienteSelecionado: React.Dispatch<React.SetStateAction<ClienteType | OsType | null>>;
  isAdmin: boolean;
};

export function Cliente ({cliente, setClienteSelecionado ,setIsCreateOpen, isAdmin = false}: ClienteProps) {
    
    const queryClient = useQueryClient();

    const { isPending, mutate } = useMutation({
        mutationFn: deleteClientes,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['cliente'],
            })
            toast.success("Cliente deletado com sucesso")
        },
        onError: () => toast.error("Não foi possível deletar o cliente")
    })

    function handleUpdate(cliente: ClienteType | OsType) {
        setClienteSelecionado(cliente);
        setIsCreateOpen(true);
    }

    if (isPending) return <LoadingContainer />;

    return (
        <Link to={`/clientes/${cliente.id}`}>
            <ClienteRow>
                <ClienteInfo>{cliente.id}</ClienteInfo>
                <ClienteInfo>{cliente.cliente}</ClienteInfo>
                <ClienteInfo>{cliente.cpfcnpj ? formatCpfCnpj(cliente.cpfcnpj) : '-'}</ClienteInfo>
                <ClienteInfo>{cliente.endereco ? cliente.endereco : '-'}</ClienteInfo>
                <ClienteInfo>{formatPhone(cliente.telefone1)}</ClienteInfo>
                <ClienteInfo>{cliente.oficina ? cliente.oficina : '-'}</ClienteInfo>
                {isAdmin && (
                    <IconBtn cliente={cliente} handleDelete={() => handleDelete(cliente.id, mutate, "cliente")} handleUpdate={handleUpdate} />
                )}
            </ClienteRow>
        </Link>
    )
}