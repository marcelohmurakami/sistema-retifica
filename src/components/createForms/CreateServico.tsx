import { useForm } from "react-hook-form";
import { ButtonContainer, Form, FormRow, Input, Label, SubmitButton } from "./CreateClienteStyled";
import type { ServicoType } from "../../models/servico";
import { LoadingContainer } from "../spinner/LoadingContainer";
import { useInsertServicos } from "./useInsertServicos";
import { useEffect } from "react";
import { useUpdateServicos } from "../../pages/serviços/useServicos";

type CreateServicoInput = Omit<ServicoType, "id" | "created_at">;

export function CreateServico ({ servicoSelecionado }: { servicoSelecionado: ServicoType | null }) {
    const { register, handleSubmit, reset } = useForm<CreateServicoInput>();
    const { mutate, isPending } = useInsertServicos(reset);
    const { mutateServico, isPendingServico } = useUpdateServicos();

    useEffect(() => {
        if (servicoSelecionado) {
            reset({
                servico: servicoSelecionado.servico || "",
                valor: servicoSelecionado.valor || 0,
                linha: servicoSelecionado.linha || "leve",
                tipo: servicoSelecionado.tipo || "servico",
            })
        } else {
            reset({
                servico: "",
                valor: 0,
                linha: "leve",
                tipo: "servico", 
            })
        }
    }, [servicoSelecionado, reset])

    function onSubmit(data: CreateServicoInput) {
        if (servicoSelecionado) {
            mutateServico({
            id: servicoSelecionado.id,
            ...data,
            });

            return;
        }

        mutate(data);
    }

    if (isPending || isPendingServico) return (
        <LoadingContainer />
    );

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <h1>Tela de cadastro de serviço</h1>
            <FormRow>
                <Label htmlFor="servico">Serviço:</Label>
                <Input type="text" id="servico" {...register("servico")} />
            </FormRow>

            <FormRow>
                <Label htmlFor="valor">Valor:</Label>
                <Input type="number" id="valor" {...register("valor")} />
            </FormRow>

            <FormRow>
                <Label htmlFor="linha">Linha:</Label>
                <Input type="text" id="linha" {...register("linha")} />
            </FormRow>

            <FormRow>
                <Label htmlFor="tipo">Tipo:</Label>
                <Input type="text" id="tipo" {...register("tipo")} />
            </FormRow>

            <ButtonContainer>
                <SubmitButton type="submit">
                    Salvar serviço
                </SubmitButton>
            </ButtonContainer>
        </Form>
    )
}