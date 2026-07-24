import { useForm } from "react-hook-form";
import { ButtonContainer, ErrorMessage, Form, FormRow, Input, Label, SubmitButton } from "../ui/EntityFormStyled";
import { LoadingContainer } from "../spinner/LoadingContainer";
import { useEffect } from "react";
import { makeUpdateEstoquePayload } from "../../utils/normalizeCliente";
import { useEditEstoque, useInsertEstoque } from "../../pages/estoque/useEstoque";
import type { Dispatch, SetStateAction } from "react";
import type { EstoqueFormData, EstoqueItem } from "../../models/estoque";

type CreateEstoqueProps = {
  clienteParaEditar: EstoqueItem | null;
  setIsCreateOpen: Dispatch<SetStateAction<boolean>>;
};

export function CreateEstoque({
  clienteParaEditar,
  setIsCreateOpen,
}: CreateEstoqueProps) {
  const hasId = !!clienteParaEditar?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstoqueFormData>({
    defaultValues: {
      nome: "",
      custo: "",
      valor: "",
      qtdEstoque: "",
    },
  });

useEffect(() => {
  if (clienteParaEditar) {
    reset({
      nome: clienteParaEditar.nome ?? "",
      custo: clienteParaEditar.custo ?? "",
      valor: clienteParaEditar.valor ?? "",
      qtdEstoque: clienteParaEditar.qtdEstoque ?? "",
    });
  } else {
    reset({
        nome: "",
        custo: "",
        valor: "",
        qtdEstoque: "",
    });
  }
}, [clienteParaEditar, reset]);

  const { mutate, isPending } = useInsertEstoque(reset, setIsCreateOpen)
  const { mutateEstoque, isPendingEstoque } = useEditEstoque(reset, setIsCreateOpen)

  function onSubmit(data: EstoqueFormData) {
    const payload = {
      ...data,
      custo: Number(data.custo),
      valor: Number(data.valor),
      qtdEstoque: Number(data.qtdEstoque),
    };

    if (hasId && clienteParaEditar) {
      const updatePayload = makeUpdateEstoquePayload(clienteParaEditar.id, data)
      mutateEstoque(updatePayload);
      return;
    }

    mutate(payload);
  }

  if (isPending || isPendingEstoque) return <LoadingContainer />;

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <h1>{hasId ? "Editar produto" : "Tela de cadastro de produto"}</h1>

      <FormRow>
        <Label htmlFor="nome">Produto:</Label>
        <Input type="text" id="nome" $error={!!errors.nome} {...register("nome")} />
        {errors.nome && <ErrorMessage>⚠ {errors.nome.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="custo">Custo:</Label>
        <Input type="number" min="0" step="0.01" id="custo" $error={!!errors.custo} {...register("custo", { required: true, min: 0 })} />
        {errors.custo && <ErrorMessage>⚠ {errors.custo.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="valor">Valor:</Label>
        <Input type="number" min="0" step="0.01" id="valor" $error={!!errors.valor} {...register("valor", { required: true, min: 0 })} />
        {errors.valor && <ErrorMessage>⚠ {errors.valor.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="qtdEstoque">Quantidade em Estoque:</Label>
        <Input type="number" min="0" step="1" id="qtdEstoque" $error={!!errors.qtdEstoque} {...register("qtdEstoque", { required: true, min: 0 })} />
        {errors.qtdEstoque && <ErrorMessage>⚠ {errors.qtdEstoque.message}</ErrorMessage>}
      </FormRow>

      <ButtonContainer>
        <SubmitButton type="submit">
          {hasId ? "Salvar edição" : "Salvar produto"}
        </SubmitButton>
      </ButtonContainer>
    </Form>
  );
}
