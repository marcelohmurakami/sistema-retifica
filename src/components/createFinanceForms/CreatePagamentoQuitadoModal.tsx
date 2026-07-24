import { useState } from "react";
import {
  Form,
  FieldGroup,
  Label,
  Input,
  ErrorText,
  CancelButton,
  SubmitButton,
} from "../ui/FinanceFormStyled";
import { BaseFinanceModal } from "./BaseFinanceModal";
import { usePagamentosQuitadosForm } from "./useHooksFinanceForms";
import type { PagamentoQuitado } from "../../models/financeiro";

type CreatePagamentoQuitadoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  financaSelecionada?: PagamentoQuitado | null;
};

export function CreatePagamentoQuitadoModal({
  isOpen,
  onClose,
  financaSelecionada,
}: CreatePagamentoQuitadoModalProps) {
  const hasId = Boolean(financaSelecionada?.id);

  const [descricao, setDescricao] = useState(financaSelecionada?.descricao ?? "");
  const [formaPagamento, setFormaPagamento] = useState(financaSelecionada?.formaPagamento ?? "");
  const [valor, setValor] = useState(financaSelecionada ? String(financaSelecionada.valor) : "");
  const [dataPagamento, setDataPagamento] = useState(financaSelecionada?.dataPagamento ?? "");
  const [observacoes, setObservacoes] = useState(financaSelecionada?.observacoes ?? "Sem observações");

  const { mutate, isPending, error } = usePagamentosQuitadosForm();

  function handleClose() {
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!descricao.trim()) return;
    if (!formaPagamento.trim()) return;
    if (!valor || Number(valor) <= 0) return;
    if (!dataPagamento) return;

    mutate(
      {
        id: financaSelecionada?.id,
        data: {
          descricao: descricao.trim(),
          formaPagamento: formaPagamento.trim(),
          valor: Number(valor),
          dataPagamento,
          observacoes: observacoes.trim()
        },
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  }

  if (!isOpen) return null;

  return (
    <BaseFinanceModal
          isOpen={isOpen}
          title={hasId ? "Editar pagamento quitado" : "Novo pagamento quitado"}
          onClose={handleClose}
          footer={
            <>
              <CancelButton type="button" onClick={handleClose}>
                Cancelar
              </CancelButton>

              <SubmitButton
                form="create-pagamento-quitado-form"
                type="submit"
                disabled={isPending}
              >
                {isPending
                  ? "Salvando..."
                  : hasId
                  ? "Salvar alterações"
                  : "Criar pagamento"}
              </SubmitButton>
            </>
          }
        >
          <Form id="create-pagamento-quitado-form" onSubmit={handleSubmit}>
            <FieldGroup>
              <Label htmlFor="descricao">Descrição do pagamento</Label>
              <Input
                id="descricao"
                type="text"
                placeholder="Ex: Pagamento de conta"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="formaPagamento">Forma de pagamento</Label>
              <Input
                id="formaPagamento"
                type="text"
                placeholder="Ex: PIX, Dinheiro, Cartão..."
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="dataPagamento">Data de pagamento</Label>
              <Input
                id="dataPagamento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                type="text"
                placeholder="Opcional"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </FieldGroup>

            {error && <ErrorText>{error.message}</ErrorText>}
          </Form>
    </BaseFinanceModal>
  );
}
