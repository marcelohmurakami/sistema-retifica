import { useEffect } from "react";
import { CancelButton, CloseButton, FieldGroup, FormActions, Input, Label, ModalCard, ModalHeader, ModalOverlay, NoteForm, PriorityOption, PriorityOptions, SubmitButton } from "./CreateAnotacoesStyled";
import { useEditAnotacoesDiarias, useInsertAnotacoesDiarias } from "./useAnotacoes";
import { Spinner } from "../../components/spinner/Spinner";
import { useForm } from "react-hook-form";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

type Prioridade = "baixo" | "medio" | "alto";

type FormValues = {
  titulo: string;
  data: string;
  prioridade: Prioridade;
};

export function CreateAnotacaoDiaria({
  open,
  onClose,
  tarefaParaEditar = null,
}: any) {
  const {
    register,
    reset,
    handleSubmit,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      titulo: "",
      data: getToday(),
      prioridade: "medio",
    },
  });

  const { mutate: mutateCreateTarefa, isPending: isCreatingTarefa } =
    useInsertAnotacoesDiarias();

  const { mutate: mutateEditTarefa, isPending: isEditingTarefa } =
    useEditAnotacoesDiarias();

  const prioridade = watch("prioridade");
  const hadId = !!tarefaParaEditar?.id;

  useEffect(() => {
    if (tarefaParaEditar) {
      reset({
        titulo: tarefaParaEditar.titulo ?? "",
        data: tarefaParaEditar.data ?? getToday(),
        prioridade: tarefaParaEditar.prioridade ?? "medio",
      });
    } else {
      reset({
        titulo: "",
        data: getToday(),
        prioridade: "medio",
      });
    }
  }, [tarefaParaEditar, reset]);

  if (!open) return null;

  function onSubmit(data: FormValues) {
    if (!data.titulo.trim()) return;

    if (hadId) {
      mutateEditTarefa({
        id: tarefaParaEditar.id,
        ...data,
      });
      onClose();
      return;
    }

    mutateCreateTarefa(data);

    reset({
      titulo: "",
      data: getToday(),
      prioridade: "medio",
    });
  }

  if (isCreatingTarefa || isEditingTarefa) return <Spinner />;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalCard onClick={(e: any) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <h2>{hadId ? "Editar tarefa" : "Nova tarefa"}</h2>
            <p>Crie um lembrete rapido para acompanhar no checklist do dia.</p>
          </div>

          <CloseButton type="button" onClick={onClose}>
            x
          </CloseButton>
        </ModalHeader>

        <NoteForm onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Label>Tarefa</Label>
            <Input
              placeholder="Ex: Mandar orçamento do cliente João"
              enterKeyHint="next"
              {...register("titulo", { required: true })}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Data</Label>
            <Input
              type="date"
              enterKeyHint="done"
              {...register("data", { required: true })}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Prioridade</Label>

            <input
              type="hidden"
              {...register("prioridade", { required: true })}
            />

            <PriorityOptions>
              <PriorityOption
                type="button"
                $variant="baixo"
                $active={prioridade === "baixo"}
                onClick={() => setValue("prioridade", "baixo")}
              >
                Baixa
              </PriorityOption>

              <PriorityOption
                type="button"
                $variant="medio"
                $active={prioridade === "medio"}
                onClick={() => setValue("prioridade", "medio")}
              >
                Media
              </PriorityOption>

              <PriorityOption
                type="button"
                $variant="alto"
                $active={prioridade === "alto"}
                onClick={() => setValue("prioridade", "alto")}
              >
                Alta
              </PriorityOption>
            </PriorityOptions>
          </FieldGroup>

          <FormActions>
            <CancelButton type="button" onClick={onClose}>
              Cancelar
            </CancelButton>

            <SubmitButton
              type="submit"
              disabled={isCreatingTarefa || isEditingTarefa}
            >
              {isCreatingTarefa || isEditingTarefa
                ? "Salvando..."
                : "Salvar tarefa"}
            </SubmitButton>
          </FormActions>
        </NoteForm>
      </ModalCard>
    </ModalOverlay>
  );
}
