import { BaseFinanceModal } from "./BaseFinanceModal";
import { CancelButton, ErrorText, FieldGroup, Input, Label, Select, SubmitButton, Form } from "../ui/FinanceFormStyled";
import { useContasPagarForm } from "./useHooksFinanceForms";
import { useState } from "react";
import type { ContaPagar, FinanceStatus } from "../../models/financeiro";

type CreateContaPagarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  financaSelecionada?: ContaPagar | null;
};

export function CreateContaPagarModal({
  isOpen,
  onClose,
  financaSelecionada,
}: CreateContaPagarModalProps) {
    const hasId = Boolean(financaSelecionada);

    const [ descricao, setDescricao ] = useState(financaSelecionada?.descricao ?? "");
    const [ valor, setValor ] = useState(financaSelecionada ? String(financaSelecionada.valor) : "");
    const [ valorPago, setValorPago ] = useState(financaSelecionada ? String(financaSelecionada.valor_parcial_pago) : "");
    const [ dataVencimento, setDataVencimento ] = useState(financaSelecionada?.dataVencimento ?? "");
    const [ status, setStatus ] = useState<FinanceStatus>(financaSelecionada?.status ?? "pendente");
    const [ categoria, setCategoria ] = useState(financaSelecionada?.categoria ?? "");

    const { mutate, isPending, error } = useContasPagarForm();

    function handleClose() {
      onClose();
    }

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();

      if (!descricao.trim()) return;
      if (!valor || Number(valor) <= 0) return;
      if (!dataVencimento) return;
      if (!categoria.trim()) return;
      if (Number(valorPago) < 0 || Number(valorPago) > Number(valor)) return;

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
          onClose();
        }
      }
      )
    }

    return (
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
                    min="0"
                    max={valor || undefined}
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
                    value={valor ? Math.max(Number(valor) - Number(valorPago || 0), 0).toFixed(2) : ""}
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
                    onChange={(e) => setStatus(e.target.value as FinanceStatus)}
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
      );
}
