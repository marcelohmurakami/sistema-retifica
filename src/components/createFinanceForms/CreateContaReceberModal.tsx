import { useEffect, useRef, useState } from "react";
import {
  Form,
  FieldGroup,
  Label,
  Input,
  Select,
  ErrorText,
  CancelButton,
  SubmitButton,
} from "./ContaReceberModalStyled";
import { BaseFinanceModal } from "./BaseFinanceModal";
import { useAccountsReceivableForm } from "./useHooksFinanceForms";

export type CreateContaReceberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  financaSelecionada?: any;
};

export function CreateContaReceberModal({
  isOpen,
  onClose,
  financaSelecionada,
}: CreateContaReceberModalProps) {
  const hasId = Boolean(financaSelecionada?.id);
  const modalRef = useRef<HTMLDivElement>(null);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [status, setStatus] = useState("pendente");
  const [osId, setOsId] = useState("");

  const { mutate, isPending, error } = useAccountsReceivableForm();

  function resetForm() {
    setDescricao("");
    setValor("");
    setValorRecebido("");
    setDataPagamento("");
    setStatus("pendente");
    setOsId("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!descricao.trim()) return;
    if (!valor || Number(valor) <= 0) return;
    if (!dataPagamento) return;
    if (!osId || Number(osId) <= 0) return;

    mutate(
      {
        id: financaSelecionada?.id,
        data: {
          descricao: descricao.trim(),
          valor: Number(valor),
          valorRecebido: Number(valorRecebido) || 0,
          dataPagamento,
          status,
          osId: Number(osId),
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
      setValor(
        financaSelecionada.valor !== undefined
          ? String(financaSelecionada.valor)
          : ""
      );
      setValorRecebido(
        financaSelecionada.valorRecebido !== undefined
          ? String(financaSelecionada.valorRecebido)
          : ""
      );
      setDataPagamento(financaSelecionada.dataPagamento || "");
      setStatus(financaSelecionada.status || "pendente");
      setOsId(
        financaSelecionada.osId !== undefined
          ? String(financaSelecionada.osId)
          : ""
      );
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
          title={hasId ? "Editar conta a receber" : "Nova conta a receber"}
          onClose={handleClose}
          footer={
            <>
              <CancelButton type="button" onClick={handleClose}>
                Cancelar
              </CancelButton>

              <SubmitButton
                form="create-conta-receber-form"
                type="submit"
                disabled={isPending}
              >
                {isPending
                  ? "Salvando..."
                  : hasId
                  ? "Salvar alterações"
                  : "Criar conta"}
              </SubmitButton>
            </>
          }
        >
          <Form id="create-conta-receber-form" onSubmit={handleSubmit}>
            <FieldGroup>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                type="text"
                placeholder="Ex: Pagamento OS 4789"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="valor">Valor total a ser recebido:</Label>
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
              <Label htmlFor="valor">Valor parcial recebido:</Label>
              <Input
                id="valorRecebido"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="valor">Valor restante a ser recebido:</Label>
              <Input
                id="valorRestante"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={Number(valor) - Number(valorRecebido)}
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
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </Select>
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="osId">OS vinculada</Label>
              <Input
                id="osId"
                type="number"
                placeholder="Ex: 7223"
                value={osId}
                onChange={(e) => setOsId(e.target.value)}
              />
            </FieldGroup>

            {error && <ErrorText>{error.message}</ErrorText>}
          </Form>
        </BaseFinanceModal>
      </div>
    </div>
  );
}