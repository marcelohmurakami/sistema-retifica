import {
  CancelButton,
  CloseButton,
  FieldGroup,
  FormActions,
  Input,
  Label,
  ModalCard,
  ModalHeader,
  ModalOverlay,
  NoteForm,
  SubmitButton,
  Textarea,
} from "./CreateAnotacoesStyled";
import { useForm } from "react-hook-form";
import { useEditAnotacoesGerais, useInsertAnotacoesGerais } from "./useAnotacoes";
import type { AnotacaoGeral, AnotacaoGeralInput } from "../../models/anotacao";

export function CreateAnotacaoGeral({
  open,
  onClose,
  tarefaParaEditar = null,
}: {
  open: boolean;
  onClose: () => void;
  tarefaParaEditar?: AnotacaoGeral | null;
}) {
  const { mutate: createAnotacao, isPending } = useInsertAnotacoesGerais();
  const { mutate: editAnotacao, isPending: isEditing } = useEditAnotacoesGerais();

  const { register, handleSubmit } = useForm<AnotacaoGeralInput>({
    defaultValues: {
      titulo: tarefaParaEditar?.titulo ?? "",
      descricao: tarefaParaEditar?.descricao ?? "",
      cliente: tarefaParaEditar?.cliente ?? "",
    },
  });

  if (!open) return null;

  function onSubmit(data: AnotacaoGeralInput) {
    if (tarefaParaEditar) {
        editAnotacao({
            id: tarefaParaEditar.id,
            ...data,
        });
        onClose();
        return;
    }

    createAnotacao(data)
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <h2>Nova anotação geral</h2>
            <p>Registre observações, serviços soltos e valores acumulados.</p>
          </div>

          <CloseButton type="button" onClick={onClose}>
            x
          </CloseButton>
        </ModalHeader>

        <NoteForm onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Label>Titulo</Label>
            <Input
                placeholder="Ex: Cliente João - serviços sem OS"
                enterKeyHint="next"
                {...register("titulo", { required: true })}
            />
            </FieldGroup>

            <FieldGroup>
            <Label>Cliente</Label>
            <Input
                type="text"
                placeholder="Ex: Marcelo Henrique Murakami"
                enterKeyHint="next"
                {...register("cliente")}
            />
            </FieldGroup>

            <FieldGroup>
            <Label>Observação</Label>
            <Textarea
                placeholder={`Ex:
            Plaina cabeçote - R$ 180,00
            Solda coletor - R$ 90,00
            Retificar volante - R$ 120,00`}
                enterKeyHint="done"
                {...register("descricao")}
            />
            </FieldGroup>
          <FormActions>
            <CancelButton type="button" onClick={onClose}>
              Cancelar
            </CancelButton>

            <SubmitButton type="submit" disabled={isPending  || isEditing}>
              {isPending || isEditing ? "Salvando..." : "Salvar anotação"}
            </SubmitButton>
          </FormActions>
        </NoteForm>
      </ModalCard>
    </ModalOverlay>
  );
}
