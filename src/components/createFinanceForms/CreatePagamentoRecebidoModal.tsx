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
import { usePagamentosRecebidosForm } from "./useHooksFinanceForms";

export type CreateContaReceberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  financaSelecionada?: any;
};

export function CreatePagamentoRecebidoModal({
  isOpen,
  onClose,
  financaSelecionada,
}: CreateContaReceberModalProps) {
  const hasId = Boolean(financaSelecionada?.id);
  const modalRef = useRef<HTMLDivElement>(null);

  const [descricao, setDescricao] = useState("");
  const [metodoPag, setMetodoPag] = useState("");
  const [taxaMaquina, setTaxaMaquina] = useState("");
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [valor, setValor] = useState("");

  const { mutate, isPending, error } = usePagamentosRecebidosForm();

  function resetForm() {
    setDescricao("");
    setMetodoPag("");
    setTaxaMaquina("");
    setDataRecebimento("");
    setValor("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!metodoPag.trim()) return;
    if (!valor || Number(valor) <= 0) return;
    if (!dataRecebimento) return;

    mutate(
      {
        id: financaSelecionada?.id,
        data: {
          descricao: descricao.trim(),
          metodoPag: metodoPag.trim(),
          taxaMaquina: Number(taxaMaquina),
          dataRecebimento: dataRecebimento,
          valor: Number(valor),
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
        setDataRecebimento(financaSelecionada.dataRecebimento || "");
        setMetodoPag(financaSelecionada.metodoPag || "");
        setTaxaMaquina(
          financaSelecionada.taxaMaquina !== undefined
            ? String(financaSelecionada.taxaMaquina)
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
          title={hasId ? "Editar pagamento recebido" : "Novo pagamento recebido"}
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
                placeholder="Descrição do pagamento"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
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
              <Label htmlFor="metodoPag">Método de pagamento</Label>
              <Input
                id="metodoPag"
                type="text"
                placeholder="Ex: Dinheiro, Cartão..."
                value={metodoPag}
                onChange={(e) => setMetodoPag(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="dataRecebimento">Data de recebimento</Label>
              <Input
                id="dataRecebimento"
                type="date"
                value={dataRecebimento}
                onChange={(e) => setDataRecebimento(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="taxaMaquina">Taxa da máquina</Label>
              <Input
                id="taxaMaquina"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={taxaMaquina}
                onChange={(e) => setTaxaMaquina(e.target.value)}
              />
            </FieldGroup>

            {error && <ErrorText>{error.message}</ErrorText>}
          </Form>
        </BaseFinanceModal>
      </div>
    </div>
  );
}