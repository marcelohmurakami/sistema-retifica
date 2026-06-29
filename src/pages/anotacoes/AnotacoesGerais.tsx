import { useEffect, useState } from "react";
import { Spinner } from "../../components/spinner/Spinner";
import { formatCurrency } from "../financeiro/formatters";
import { CardActions, CardHeader, DeleteButton, Description, EditButton, NewButton, NoteCard, NotesGrid, Section, SectionHeader } from "./AnotacoesStyled";
import { useDeleteAnotacoesGerais, useGetAnotacoesGerais } from "./useAnotacoes";
import { CreateAnotacaoGeral } from "./CreateAnotacaoGeral";

export function AnotacoesGerais() {
  const { anotacoes_gerais: anotacoes, isLoadingAnotacoesGerais } = useGetAnotacoesGerais();
  const { mutate: deleteAnotacao, isPending: isDeleting } = useDeleteAnotacoesGerais();

  const [tarefas, setTarefas] = useState<any[]>([]);
  const [ isCreateOpen, setIsCreateOpen ] = useState(false);
  const [ isEditOpen, setIsEditOpen ] = useState(false);
  const [ tarefaSelecionada, setTarefaSelecionada ] = useState(null);
  
    useEffect(() => {
        setTarefas(anotacoes ?? []);
    }, [anotacoes]);

    function handleDelete(id: any) {
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
    {tarefas?.map((anotacao) => (
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
      <CreateAnotacaoGeral
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
        />

        <CreateAnotacaoGeral
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            tarefaParaEditar={tarefaSelecionada}
        />
    </Section>
  );
}