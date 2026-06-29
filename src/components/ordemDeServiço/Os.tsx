import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { OsType } from "../../models/os"
import { formatDate } from "../../utils/formatDate"
import { IconBtn } from "../buttons/IconBtn"
import { OSInfo, OSRow } from "../ordemDeServiço/OsStyled"
import { DeleteOS } from "../../pages/ordensDeServico/osApi"
import { handleDelete } from "../../utils/handleDelete"
import { Link } from "react-router"
import toast from "react-hot-toast"

type OrdemDeServicoProps = {
    OS: OsType,
    setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setOsSelecionada: React.Dispatch<React.SetStateAction<OsType | null>>;
    isAdmin?: boolean;
}

export function OrdemDeServiço ({ OS, setOsSelecionada, setIsCreateOpen, isAdmin }: OrdemDeServicoProps) {
    const queryClient = useQueryClient();

    const {isPending, mutate} = useMutation({
        mutationFn: DeleteOS,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['OrdemDeServiço'],
            })
            toast.success("Ordem de serviço deletada com sucesso")
        },
        onError: () => toast.error("Não foi possível deletar a ordem de serviço")
    })

    function handleUpdate(data: any) {
        setOsSelecionada(data);
        setIsCreateOpen(true);
    }

    if (isPending) return null;

    return (
        <Link to={`/ordens-de-serviço/${OS.id}`}>
            <OSRow>
                <OSInfo>{OS.id}</OSInfo>
                <OSInfo>{OS.Clientes.cliente}</OSInfo>
                <OSInfo>{formatDate(OS.dataServico)}</OSInfo>
                <OSInfo>{OS.motor}</OSInfo>
                <OSInfo>{`R$${OS.valorServico},00`}</OSInfo>
                <OSInfo>{OS.dataVencimento}</OSInfo>
                {isAdmin && (
                    <IconBtn cliente={OS} handleUpdate={handleUpdate} handleDelete={() => handleDelete(OS.id, mutate, "ordem de serviço")} />
                )}
            </OSRow>
        </Link>
    )
}