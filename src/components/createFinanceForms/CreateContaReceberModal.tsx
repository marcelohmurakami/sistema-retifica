import { useState } from "react";
import {
  Form,
  FieldGroup,
  Label,
  Input,
  Select,
  ErrorText,
  CancelButton,
  SubmitButton,
} from "../ui/FinanceFormStyled";
import { BaseFinanceModal } from "./BaseFinanceModal";
import { useAccountsReceivableForm } from "./useHooksFinanceForms";
import type { ContaReceber, FinanceStatus } from "../../models/financeiro";

export type CreateContaReceberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  financaSelecionada?: ContaReceber | null;
};

export function CreateContaReceberModal({
  isOpen,
  onClose,
  financaSelecionada,
}: CreateContaReceberModalProps) {
  const hasId = Boolean(financaSelecionada?.id);

  const [descricao, setDescricao] = useState(financaSelecionada?.descricao ?? "");
  const [valor, setValor] = useState(financaSelecionada ? String(financaSelecionada.valor) : "");
  const [valorRecebido, setValorRecebido] = useState(financaSelecionada ? String(financaSelecionada.valorRecebido) : "");
  const [dataPagamento, setDataPagamento] = useState(financaSelecionada?.dataPagamento ?? "");
  const [status, setStatus] = useState<FinanceStatus>(financaSelecionada?.status ?? "pendente");
  const [osId, setOsId] = useState(financaSelecionada ? String(financaSelecionada.osId) : "");

  const { mutate, isPending, error } = useAccountsReceivableForm();

  function handleClose() {
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!descricao.trim()) return;
    if (!valor || Number(valor) <= 0) return;
    if (!dataPagamento) return;
    if (!osId || Number(osId) <= 0) return;
    if (Number(valorRecebido) < 0 || Number(valorRecebido) > Number(valor)) return;

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

  if (!isOpen) return null;

  return (
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
              <Label htmlFor="valorRecebido">Valor parcial recebido:</Label>
              <Input
                id="valorRecebido"
                type="number"
                step="0.01"
                min="0"
                max={valor || undefined}
                placeholder="0,00"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="valorRestante">Valor restante a ser recebido:</Label>
              <Input
                id="valorRestante"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={Math.max(Number(valor) - Number(valorRecebido), 0)}
                readOnly
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
                onChange={(e) => setStatus(e.target.value as FinanceStatus)}
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
  );
}
