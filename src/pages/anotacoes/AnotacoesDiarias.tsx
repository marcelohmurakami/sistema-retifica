import { useEffect, useState } from "react";
import { Spinner } from "../../components/spinner/Spinner";
import { Checklist, ChecklistItem, NewButton, Priority, Section, SectionHeader } from "./AnotacoesStyled";
import { useDeleteAnotacoesDiarias, useGetAnotacoesDiarias, useUpdateStatusAnotacaoDiaria } from "./useAnotacoes";
import { CreateAnotacaoDiaria } from "./CreateAnotacaoDiaria";
import { ActionButton, ChecklistActions, DeleteButton } from "./CreateAnotacoesStyled";
import { FaPen, FaTrash } from "react-icons/fa";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";

export function AnotacoesDiarias() {
  const { data: user } = useEmpresaAtual();
  const isAdmin = user?.role === "admin" || user?.role === "financeiro_master" ? true : false;

  const { anotacoes_diarias, isLoadingAnotacoesDiarias } = useGetAnotacoesDiarias();
  const { mutate: mutateDelete, isPending: isDeleting } = useDeleteAnotacoesDiarias()
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateStatusAnotacaoDiaria();

  const [tarefas, setTarefas] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);

  useEffect(() => {
    setTarefas(anotacoes_diarias ?? []);
  }, [anotacoes_diarias]);

  function toggleTarefa(tarefaAtual: any) {
    const concluida = !tarefaAtual.concluida;

    setTarefas((tarefas: any) =>
      tarefas?.map((tarefa: any) =>
        tarefa.id === tarefaAtual.id
          ? { ...tarefa, concluida }
          : tarefa
      )
    );

    updateStatus(
      { id: tarefaAtual.id, concluida },
      {
        onError: () => {
          setTarefas((tarefas: any) =>
            tarefas?.map((tarefa: any) =>
              tarefa.id === tarefaAtual.id
                ? { ...tarefa, concluida: tarefaAtual.concluida }
                : tarefa
            )
          );
        },
      }
    );
  }

  function handleDelete(id: any) {
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
        {tarefas?.map((tarefa: any) => (
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

      <CreateAnotacaoDiaria
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <CreateAnotacaoDiaria
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        tarefaParaEditar={tarefaSelecionada}
      />
    </Section>
  );
}
