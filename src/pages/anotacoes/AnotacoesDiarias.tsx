import { useState } from "react";
import { Spinner } from "../../components/spinner/Spinner";
import { Checklist, ChecklistItem, NewButton, Priority, Section, SectionHeader } from "./AnotacoesStyled";
import { useDeleteAnotacoesDiarias, useGetAnotacoesDiarias, useUpdateStatusAnotacaoDiaria } from "./useAnotacoes";
import { CreateAnotacaoDiaria } from "./CreateAnotacaoDiaria";
import { ActionButton, ChecklistActions, DeleteButton } from "./CreateAnotacoesStyled";
import { FaPen, FaTrash } from "react-icons/fa";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";
import type { AnotacaoDiaria } from "../../models/anotacao";

export function AnotacoesDiarias() {
  const { data: user } = useEmpresaAtual();
  const isAdmin = user?.role === "admin" || user?.role === "financeiro_master" ? true : false;

  const { anotacoes_diarias, isLoadingAnotacoesDiarias } = useGetAnotacoesDiarias();
  const { mutate: mutateDelete, isPending: isDeleting } = useDeleteAnotacoesDiarias()
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateStatusAnotacaoDiaria();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<AnotacaoDiaria | null>(null);

  function toggleTarefa(tarefaAtual: AnotacaoDiaria) {
    const concluida = !tarefaAtual.concluida;
    updateStatus({ id: tarefaAtual.id, concluida });
  }

  function handleDelete(id: number) {
    const confirmacao = window.confirm("Tem certeza que deseja deletar esta tarefa?");

    if (!confirmacao) {
      return;
    }

    mutateDelete(id);
  }

  if (isLoadingAnotacoesDiarias) {
    return <Spinner />;
  }

  return (
    <Section>
      <SectionHeader>
        <h2>Tarefas de hoje</h2>
        {isAdmin && (
          <NewButton onClick={() => setIsCreateOpen(true)}>
            Nova tarefa
          </NewButton>
        )}
      </SectionHeader>

      <Checklist>
        {anotacoes_diarias.map((tarefa) => (
          <ChecklistItem key={tarefa.id} $done={tarefa.concluida}>
            <input
              type="checkbox"
              checked={tarefa.concluida}
              disabled={isUpdatingStatus}
              onChange={() => toggleTarefa(tarefa)}
            />

            <span>{tarefa.titulo}</span>

            <ChecklistActions>
              <Priority $priority={tarefa.prioridade}>
                {tarefa.prioridade}
              </Priority>

              {isAdmin && (
                <ActionButton
                  type="button"
                  title="Editar tarefa"
                  onClick={() => {
                    setTarefaSelecionada(tarefa);
                    setIsEditOpen(true);
                  }}
                >
                  <FaPen />
                </ActionButton>
              )}

              {isAdmin && (
                <DeleteButton
                  type="button"
                  title="Excluir tarefa" disabled={isDeleting}
                  onClick={() => {
                    handleDelete(tarefa.id);
                  }}
                >
                  <FaTrash />
                </DeleteButton>
              )}
            </ChecklistActions>
          </ChecklistItem>
        ))}
      </Checklist>

      {isCreateOpen && (
        <CreateAnotacaoDiaria open onClose={() => setIsCreateOpen(false)} />
      )}

      {isEditOpen && tarefaSelecionada && (
        <CreateAnotacaoDiaria
          key={tarefaSelecionada.id}
          open
          onClose={() => setIsEditOpen(false)}
          tarefaParaEditar={tarefaSelecionada}
        />
      )}
    </Section>
  );
}
