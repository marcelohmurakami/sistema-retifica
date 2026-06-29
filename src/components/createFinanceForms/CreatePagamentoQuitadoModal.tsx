import { useEffect, useRef, useState } from "react";
import {
  Form,
  FieldGroup,
  Label,
  Input,
  ErrorText,
  CancelButton,
  SubmitButton,
} from "./ContaReceberModalStyled";
import { BaseFinanceModal } from "./BaseFinanceModal";
import { usePagamentosQuitadosForm } from "./useHooksFinanceForms";

type CreatePagamentoQuitadoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  financaSelecionada?: any;
};

export function CreatePagamentoQuitadoModal({
  isOpen,
  onClose,
  financaSelecionada,
}: CreatePagamentoQuitadoModalProps) {
  const hasId = Boolean(financaSelecionada?.id);
  const modalRef = useRef<HTMLDivElement>(null);

  const [descricao, setDescricao] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valor, setValor] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("Sem observações");

  const { mutate, isPending, error } = usePagamentosQuitadosForm();

  function resetForm() {
    setDescricao("");
    setFormaPagamento("");
    setValor("");
    setDataPagamento("");
    setObservacoes("Sem observações");
  }

  function handleClose() {
    resetForm();
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

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (financaSelecionada && isOpen) {
      setDescricao(financaSelecionada.descricao || "");
      setFormaPagamento(financaSelecionada.formaPagamento || "");
      setValor(
        financaSelecionada.valor !== undefined
          ? String(financaSelecionada.valor)
          : ""
      );
      setDataPagamento(financaSelecionada.dataPagamento || "");
      setObservacoes(financaSelecionada.observacoes || "");
    } else if (isOpen) {
      resetForm();
    }
  }, [financaSelecionada, isOpen]);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div onMouseDown={handleOverlayClick}>
      <div ref={modalRef}>
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
      </div>
    </div>
  );
}