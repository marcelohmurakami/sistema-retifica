import { useForm } from "react-hook-form";
import { ButtonContainer, ErrorMessage, Form, FormRow, Input, Label, SubmitButton } from "../ui/EntityFormStyled";
import type { ClienteType } from "../../models/cliente";
import { LoadingContainer } from "../spinner/LoadingContainer";
import { zodResolver } from "@hookform/resolvers/zod";
import { clienteSchema } from "./ClienteSchema";
import { useEffect } from "react";
import type { OsType } from "../../models/os";
import { useInsertClientes } from "./useInsertClientes";
import { useUpdateCliente } from "./useUpdateCliente";
import type z from "zod";
import { makeUpdateClientePayload, normalizeCliente } from "../../utils/normalizeCliente";

type CreateOpenProps = {
  clienteParaEditar?: ClienteType | OsType | null;
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type UpdateClienteProps = Omit<ClienteType, "created_at">;
type ClienteFormData = z.infer<typeof clienteSchema>;

export function CreateCliente({
  clienteParaEditar,
  setIsCreateOpen,
}: CreateOpenProps) {
  const hasId = !!clienteParaEditar?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      cliente: "",
      cpfcnpj: "",
      endereco: "",
      telefone1: "",
      telefone2: "",
      oficina: "",
    },
  });

useEffect(() => {
  if (clienteParaEditar && "cliente" in clienteParaEditar) {
    reset({
      cliente: clienteParaEditar.cliente ?? "",
      cpfcnpj: clienteParaEditar.cpfcnpj ?? "",
      endereco: clienteParaEditar.endereco ?? "",
      telefone1: clienteParaEditar.telefone1 ?? "",
      telefone2: clienteParaEditar.telefone2 ?? "",
      oficina: clienteParaEditar.oficina ?? "",
    });
  } else {
    reset({
      cliente: "",
      cpfcnpj: "",
      endereco: "",
      telefone1: "",
      telefone2: "",
      oficina: "",
    });
  }
}, [clienteParaEditar, reset]);

  const { mutate, isPending } = useInsertClientes(setIsCreateOpen, reset)
  const { mutateCliente, isPendingCliente } = useUpdateCliente(setIsCreateOpen, reset)

  function onSubmit(data: ClienteFormData) {
    const payload = normalizeCliente(data)

    if (hasId && clienteParaEditar) {
      const updatePayload: UpdateClienteProps = makeUpdateClientePayload(clienteParaEditar.id ,data)
      mutateCliente(updatePayload);
      return;
    }

    mutate(payload);
  }

  if (isPending || isPendingCliente) return <LoadingContainer />;

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <h1>{hasId ? "Editar cliente" : "Tela de cadastro de cliente"}</h1>

      <FormRow>
        <Label htmlFor="cliente">Cliente:</Label>
        <Input type="text" id="cliente" enterKeyHint="next" $error={!!errors.cliente} {...register("cliente")} />
        {errors.cliente && <ErrorMessage>⚠ {errors.cliente.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="cpfcnpj">CPF/CNPJ:</Label>
        <Input type="text" id="cpfcnpj" inputMode="numeric" enterKeyHint="next" $error={!!errors.cpfcnpj} {...register("cpfcnpj")} />
        {errors.cpfcnpj && <ErrorMessage>⚠ {errors.cpfcnpj.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="oficina">Oficina:</Label>
        <Input type="text" id="oficina" enterKeyHint="next" $error={!!errors.oficina} {...register("oficina")} />
        {errors.oficina && <ErrorMessage>⚠ {errors.oficina.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="telefone1">Telefone 1:</Label>
        <Input type="tel" id="telefone1" enterKeyHint="next" $error={!!errors.telefone1} {...register("telefone1")} />
        {errors.telefone1 && <ErrorMessage>⚠ {errors.telefone1.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="telefone2">Telefone 2:</Label>
        <Input type="tel" id="telefone2" enterKeyHint="next" $error={!!errors.telefone2} {...register("telefone2")} />
        {errors.telefone2 && <ErrorMessage>⚠ {errors.telefone2.message}</ErrorMessage>}
      </FormRow>

      <FormRow>
        <Label htmlFor="endereco">Endereço</Label>
        <Input type="text" id="endereco" enterKeyHint="done" $error={!!errors.endereco} {...register("endereco")} />
        {errors.endereco && <ErrorMessage>⚠ {errors.endereco.message}</ErrorMessage>}
      </FormRow>

      <ButtonContainer>
        <SubmitButton type="submit">
          {hasId ? "Salvar edição" : "Salvar Cliente"}
        </SubmitButton>
      </ButtonContainer>
    </Form>
  );
}
