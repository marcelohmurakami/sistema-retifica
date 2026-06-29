import { useForm } from "react-hook-form";
import { ButtonContainer, ErrorMessage, Form, FormRow, Input, Label, SubmitButton } from "./CreateClienteStyled";
import { LoadingContainer } from "../spinner/LoadingContainer";
import { useEffect } from "react";
import { makeUpdateEstoquePayload } from "../../utils/normalizeCliente";
import { useEditEstoque, useInsertEstoque } from "../../pages/estoque/useEstoque";

export function CreateEstoque({
  clienteParaEditar,
  setIsCreateOpen,
}: any) {
  const hasId = !!clienteParaEditar?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
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

  const { mutate, isPending } = useInsertEstoque(setIsCreateOpen, reset)
  const { mutateEstoque, isPendingEstoque } = useEditEstoque(setIsCreateOpen, reset)

  function onSubmit(data: any) {
    const payload = data;

    if (hasId && clienteParaEditar) {
      const updatePayload = makeUpdateEstoquePayload(clienteParaEditar.id ,data)
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
        <Input type="text" id="custo" $error={!!errors.custo} {...register("custo")} />
        {errors.custo && <ErrorMessage>⚠ {errors.custo.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="valor">Valor:</Label>
        <Input type="text" id="valor" $error={!!errors.valor} {...register("valor")} />
        {errors.valor && <ErrorMessage>⚠ {errors.valor.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="qtdEstoque">Quantidade em Estoque:</Label>
        <Input type="text" id="qtdEstoque" $error={!!errors.qtdEstoque} {...register("qtdEstoque")} />
        {errors.qtdEstoque && <ErrorMessage>⚠ {errors.qtdEstoque.message}</ErrorMessage>}
      </FormRow>

      <ButtonContainer>
        <SubmitButton type="submit">
          {hasId ? "Salvar edição" : "Salvar Cliente"}
        </SubmitButton>
      </ButtonContainer>
    </Form>
  );
}