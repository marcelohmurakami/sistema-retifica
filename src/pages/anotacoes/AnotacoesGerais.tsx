import { useState } from "react";
import { Spinner } from "../../components/spinner/Spinner";
import { formatCurrency } from "../financeiro/formatters";
import { CardActions, CardHeader, DeleteButton, Description, EditButton, NewButton, NoteCard, NotesGrid, Section, SectionHeader } from "./AnotacoesStyled";
import { useDeleteAnotacoesGerais, useGetAnotacoesGerais } from "./useAnotacoes";
import { CreateAnotacaoGeral } from "./CreateAnotacaoGeral";
import type { AnotacaoGeral } from "../../models/anotacao";

export function AnotacoesGerais() {
  const { anotacoes_gerais: anotacoes, isLoadingAnotacoesGerais } = useGetAnotacoesGerais();
  const { mutate: deleteAnotacao, isPending: isDeleting } = useDeleteAnotacoesGerais();

  const [ isCreateOpen, setIsCreateOpen ] = useState(false);
  const [ isEditOpen, setIsEditOpen ] = useState(false);
  const [ tarefaSelecionada, setTarefaSelecionada ] = useState<AnotacaoGeral | null>(null);

    function handleDelete(id: number) {
        const confirmacao = window.confirm("Tem certeza que deseja deletar esta anotação?");
    
        if (!confirmacao) {
            return;
        }
    
        deleteAnotacao(id);
      }
  
  if (isLoadingAnotacoesGerais) {
    return <Spinner />;
  }

  return (
    <Section>
      <SectionHeader>
        <h2>Observações gerais</h2>
        <NewButton onClick={() => setIsCreateOpen(true)} >Nova anotação</NewButton>
      </SectionHeader>

    <NotesGrid>
    {anotacoes.map((anotacao) => (
        <NoteCard key={anotacao.id}>
        <CardHeader>
            <h3>{anotacao.titulo}</h3>

            <CardActions>
            <EditButton
                type="button"
                onClick={() => {
                    setTarefaSelecionada(anotacao);
                    setIsEditOpen(true);
                }}
            >
                ✎
            </EditButton>

            <DeleteButton
                type="button"
                disabled={isDeleting}
                onClick={() => {
                   handleDelete(anotacao.id);
                }}
            >
                🗑
            </DeleteButton>
            </CardActions>
        </CardHeader>

        <Description>{anotacao.descricao}</Description>

        <strong>
            Total: {formatCurrency(anotacao.valorTotal ?? 0)}
        </strong>
        </NoteCard>
    ))}
    </NotesGrid>
      {isCreateOpen && (
        <CreateAnotacaoGeral open onClose={() => setIsCreateOpen(false)} />
      )}

      {isEditOpen && tarefaSelecionada && (
        <CreateAnotacaoGeral
          key={tarefaSelecionada.id}
          open
          onClose={() => setIsEditOpen(false)}
          tarefaParaEditar={tarefaSelecionada}
        />
      )}
    </Section>
  );
}
