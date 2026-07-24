import { useForm, type FieldErrors } from "react-hook-form";
import { ButtonContainer, Form, FormRow, Input, Label, Select, SelectCliente, SubmitButton, TextArea } from "../ui/EntityFormStyled";
import { LoadingContainer } from "../spinner/LoadingContainer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useEditOrcamento, useInsertOrcamentos } from "./useOrcamentos";
import { useGetClientes } from "./useGetOs";
import { z } from "zod";
import type { OrcamentoType } from "../../models/orcamento";

const orcamentoSchema = z.object({
  idCliente: z.number().min(1, "Selecione um cliente"),
  motor: z.string().min(1, "Digite o motor"),
  orcamento: z.string().min(1, "Digite o orçamento"),
  obs: z.string().optional(),
  situacao: z.enum(["analise", "aguardando", "producao", "pronto", "aguardandoPecas", "cancelado"]),
});

type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

export function CreateOrcamento({
  orcamentoSelecionado: orcamentoParaEditar, setIsCreateOpen
}: {
  orcamentoSelecionado?: OrcamentoType | null;
  setIsCreateOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const hasId = !!orcamentoParaEditar?.id;

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerms] = useState("");

  useEffect(() => {
    if (hasId) return;

    const normalizedSearch = searchTerm.trim();
    const timeoutId = window.setTimeout(() => {
      setSearchInput(normalizedSearch.length >= 2 ? normalizedSearch : "");
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [hasId, searchTerm]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: {
      idCliente: undefined,
      motor: "",
      orcamento: "",
      obs: "",
      situacao: "analise",
    },
  });

  useEffect(() => {
    if (orcamentoParaEditar) {
      reset({
        idCliente: orcamentoParaEditar.idCliente ?? undefined,
        motor: orcamentoParaEditar.motor ?? "",
        orcamento: orcamentoParaEditar.orcamento ?? "",
        obs: orcamentoParaEditar.obs ?? "",
        situacao: orcamentoParaEditar.situacao ?? "analise",
      });
    } else {
      reset({
        idCliente: undefined,
        motor: "",
        orcamento: "",
        obs: "",
        situacao: "analise",
      });
    }
  }, [orcamentoParaEditar, reset]);

  const { mutate, isPending } = useInsertOrcamentos();
  const { mutateOrcamento, isPendingOrcamento } = useEditOrcamento(reset, setIsCreateOpen);
  const { clientes, isLoadingClientes } = useGetClientes("cliente", 1, searchInput);

  function onSubmit(data: OrcamentoFormData) {
    if (hasId && orcamentoParaEditar?.id) {
      mutateOrcamento({
        id: orcamentoParaEditar.id,
        orcamento: data,
      });
      return;
    }

    mutate(data);
  }

  function onError(errors: FieldErrors<OrcamentoFormData>) {
    const firstError = Object.values(errors)[0]?.message;
    if (firstError) console.warn(firstError);
  }

  function handleClienteSearch() {
    const normalizedSearch = searchTerm.trim();
    setSearchInput(normalizedSearch.length >= 2 ? normalizedSearch : "");
  }

  if (isPending || isPendingOrcamento) return <LoadingContainer />;

  return (
    <Form onSubmit={handleSubmit(onSubmit, onError)}>
      <h1>{hasId ? "Editar orçamento" : "Tela de cadastro de orçamento"}</h1>

      <FormRow>
        <Label htmlFor="idCliente">Cliente:</Label>

        <SelectCliente>
          <Input
            disabled={hasId}
            type="search"
            enterKeyHint="search"
            placeholder={hasId ? orcamentoParaEditar?.Clientes.cliente : "Buscar por cliente..."}
            value={searchTerm}
            onChange={(e) => setSearchTerms(e.target.value)}
            onBlur={handleClienteSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleClienteSearch();
              }
            }}
          />

          <Select
            id="idCliente"
            {...register("idCliente", { valueAsNumber: true })}
            disabled={hasId || !searchInput}
          >
            <option value="">
              {isLoadingClientes ? "Carregando clientes..." : "Selecione um cliente"}
            </option>

            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cliente}
              </option>
            ))}
          </Select>
        </SelectCliente>
      </FormRow>

      <FormRow>
        <Label htmlFor="motor">Motor:</Label>
        <Input
          type="text"
          id="motor"
          enterKeyHint="next"
          $error={!!errors.motor}
          {...register("motor")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="orcamento">Orçamento:</Label>
        <TextArea
          id="orcamento"
          enterKeyHint="next"
          {...register("orcamento")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="obs">Observações:</Label>
        <TextArea
          id="obs"
          enterKeyHint="done"
          {...register("obs")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="situacao">Situação:</Label>

        <Select
          id="situacao"
          defaultValue={orcamentoParaEditar?.situacao ?? "analise"}
          {...register("situacao")}
        >
          <option value="analise">Análise</option>
          <option value="aguardando">Aguardando aprovação</option>
          <option value="aguardandoPecas">Aguardando peças</option>
          <option value="producao">Produção</option>
          <option value="pronto">Pronto</option>
          <option value="cancelado">Cancelado</option>
        </Select>
      </FormRow>

      <ButtonContainer>
        <SubmitButton type="submit">
          {hasId ? "Salvar edição" : "Salvar orçamento"}
        </SubmitButton>
      </ButtonContainer>
    </Form>
  );
}
