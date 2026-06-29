import { useForm } from "react-hook-form";
import { ButtonContainer, Form, FormRow, Input, Label, Select, SelectCliente, SubmitButton, TextArea } from "./CreateClienteStyled";
import { LoadingContainer } from "../spinner/LoadingContainer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useEditOrcamento, useInsertOrcamentos } from "./useOrcamentos";
import { useGetClientes } from "./useGetOs";
import { z } from "zod";

const orcamentoSchema = z.object({
  idCliente: z.coerce.number().min(1, "Selecione um cliente"),
  motor: z.string().min(1, "Digite o motor"),
  orcamento: z.string().min(1, "Digite o orçamento"),
  obs: z.string().optional(),
  situacao: z.enum(["analise", "aguardando", "producao", "pronto", "aguardandoPecas", "cancelado"]),
});

type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

export function CreateOrcamento({
  orcamentoSelecionado: orcamentoParaEditar, setIsCreateOpen
}: any) {
  const hasId = !!orcamentoParaEditar?.id;

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerms] = useState("");
  

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
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

  function onError(errors: any) {
    console.log("erros do formulário:", errors);
  }

  if (isPending || isPendingOrcamento) return <LoadingContainer />;

  return (
    <Form onSubmit={handleSubmit(onSubmit, onError)}>
      <h1>{hasId ? "Editar orçamento" : "Tela de cadastro de orçamento"}</h1>

      <FormRow>
        <Label htmlFor="idCliente">Cliente:</Label>

        <SelectCliente>
          <Input
            disabled={isLoadingClientes || hasId}
            type="text"
            placeholder={hasId ? orcamentoParaEditar?.Clientes.cliente : "Buscar por cliente..."}
            value={searchTerm}
            onChange={(e) => setSearchTerms(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                setSearchInput(searchTerm);
              }
            }}
          />

          <Select
            id="idCliente"
            {...register("idCliente")}
            disabled={isLoadingClientes || hasId || !searchInput}
          >
            <option value="">
              {isLoadingClientes ? "Carregando clientes..." : "Selecione um cliente"}
            </option>

            {clientes?.map((c: any) => (
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
          $error={!!errors.motor}
          {...register("motor")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="orcamento">Orçamento:</Label>
        <TextArea
          id="orcamento"
          {...register("orcamento")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="obs">Observações:</Label>
        <TextArea
          id="obs"
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