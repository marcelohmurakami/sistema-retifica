import { BaseFinanceModal } from "./BaseFinanceModal";
import { CancelButton, ErrorText, FieldGroup, Input, Label, Select, SubmitButton, Form } from "./ContaReceberModalStyled";
import { useContasPagarForm } from "./useHooksFinanceForms";
import { useEffect, useRef, useState } from "react";

type CreateContaPagarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  financaSelecionada?: any;
};

export function CreateContaPagarModal({
  isOpen,
  onClose,
  financaSelecionada,
}: CreateContaPagarModalProps) {
    const hasId = Boolean(financaSelecionada);
    console.log("Finança selecionada:", financaSelecionada);
    const modalRef = useRef<HTMLDivElement>(null);

    const [ descricao, setDescricao ] = useState("");
    const [ valor, setValor ] = useState("");
    const [ valorPago, setValorPago ] = useState("");
    const [ dataVencimento, setDataVencimento ] = useState("");
    const [ status, setStatus ] = useState("pendente");
    const [ categoria, setCategoria ] = useState("");

    const { mutate, isPending, error } = useContasPagarForm();

    function resetForm() {
      setDescricao("");
      setValor("");
      setValorPago("");
      setDataVencimento("");
      setStatus("pendente");
      setCategoria("");
    }

    function handleClose() {
      resetForm();
      onClose();
    }

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();

      if (!descricao.trim()) return;
      if (!valor || Number(valor) <= 0) return;
      if (!dataVencimento) return;
      if (!categoria.trim()) return;

      mutate(
        {
          id: financaSelecionada?.id,
          data: {
            descricao: descricao.trim(),
            valor: Number(valor),
            valor_parcial_pago: Number(valorPago),
            dataVencimento,
            status,
            categoria: categoria.trim(),
          }
        },
        {
        onSuccess: () => {
          handleClose();
        }
      }
      )
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
    }, [isOpen])

    useEffect(() => {
        if (financaSelecionada && isOpen) {
          setDescricao(financaSelecionada.descricao || "");
          setValor(
            financaSelecionada.valor !== undefined
              ? String(financaSelecionada.valor)
              : ""
          );
          setValorPago(
            financaSelecionada.valor_parcial_pago !== undefined
              ? String(financaSelecionada.valor_parcial_pago)
              : ""
          );
          setDataVencimento(financaSelecionada.dataVencimento || "");
          setStatus(financaSelecionada.status || "pendente");
        } else if (isOpen) {
          resetForm();
        }
      }, [financaSelecionada, isOpen]);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  }

    return (
        <div onMouseDown={handleOverlayClick} ref={modalRef}>
          <div onMouseDown={(e) => e.stopPropagation()}>
            <BaseFinanceModal
              isOpen={isOpen}
              title={hasId ? "Editar conta a pagar" : "Nova conta a pagar"}
              onClose={handleClose}
              footer={
                <>
                  <CancelButton type="button" onClick={handleClose}>
                    Cancelar
                  </CancelButton>
    
                  <SubmitButton
                    form="create-conta-pagar-form"
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
              <Form id="create-conta-pagar-form" onSubmit={handleSubmit}>
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
                  <Label htmlFor="valor_pago_parcial">Valor pago parcial:</Label>
                  <Input
                    id="valor_pago_parcial"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="valorRestante">Valor restante a pagar:</Label>
                  <Input
                    id="valorRestante"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    readOnly
                    value={valor && valorPago ? (Number(valor) - Number(valorPago)).toFixed(2) : ""}
                  />
                </FieldGroup>
    
                <FieldGroup>
                  <Label htmlFor="dataVencimento">Data de vencimento</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
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
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    type="text"
                    placeholder="Ex: Serviços"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  />
                </FieldGroup>
    
                {error && <ErrorText>{error.message}</ErrorText>}
              </Form>
            </BaseFinanceModal>
          </div>
        </div>
      );
}