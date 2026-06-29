import { useMutation, useQueryClient } from "@tanstack/react-query"
import { handleDelete } from "../../utils/handleDelete"
import { Link } from "react-router"
import toast from "react-hot-toast";
import { deleteOrcamento } from "./Orcamento"
import { IconBtn } from "../../components/buttons/IconBtn"
import { LoadingContainer } from "../../components/spinner/LoadingContainer"
import { ClienteInfo } from "../clientes/ClientesStyled"
import { formatDate } from "../../utils/formatDate"
import { ClienteRow, SituacaoSelect } from "./OrcamentoStyled"
import { useUpdateSituacaoOrcamento } from "../../components/createForms/useOrcamentos";

export function OrcamentoDetalhes ({orcamento, setOrcamentoSelecionado ,setIsCreateOpen, isAdmin}: any) {
    const queryClient = useQueryClient();

    const { mutate: updateSituacao, isPending } = useUpdateSituacaoOrcamento();

    const { isPending: isPendingOrcamento, mutate } = useMutation({
        mutationFn: deleteOrcamento,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['Orcamento'],
            })
        },
        onError: () => toast.error("Não foi possível deletar o orçamento")
    })

    function handleUpdate(orcamento: any) {
        setOrcamentoSelecionado(orcamento);
        setIsCreateOpen(true);
    }

    if (isPendingOrcamento) return <LoadingContainer />;

    return (
        <Link to={`/orcamentos/${orcamento.id}`}>
            <ClienteRow>
                <ClienteInfo>{orcamento.id}</ClienteInfo>
                <ClienteInfo>{orcamento.Clientes.cliente}</ClienteInfo>
                <ClienteInfo>
                    {orcamento.created_at ? formatDate(orcamento.created_at) : "-"}
                </ClienteInfo>
                <ClienteInfo>{orcamento.motor ? orcamento.motor : "-"}</ClienteInfo>
                <ClienteInfo>{orcamento.orcamento ? orcamento.orcamento : "-"}</ClienteInfo>

                <SituacaoSelect
                value={orcamento.situacao}
                disabled={isPending}
                situacao={orcamento.situacao}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
                onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    updateSituacao({
                    id: orcamento.id,
                    situacao: e.target.value,
                    });
                }}
                >
                <option value="analise">Análise</option>
                <option value="aguardando">Aguardando</option>
                <option value="aguardandoPecas">Aguardando peças</option>
                <option value="producao">Produção</option>
                <option value="pronto">Pronto</option>
                <option value="cancelado">Cancelado</option>
                </SituacaoSelect>

                {isAdmin && (
                    <IconBtn
                    cliente={orcamento}
                    handleDelete={() => handleDelete(orcamento.id, mutate, "orçamento")}
                    handleUpdate={() => handleUpdate(orcamento)}
                    />
                )}
                </ClienteRow>
        </Link>
    )
}