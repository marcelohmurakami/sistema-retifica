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
import { usePagamentosRecebidosForm } from "./useHooksFinanceForms";
import type { PagamentoRecebido } from "../../models/financeiro";

export type CreateContaReceberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  financaSelecionada?: PagamentoRecebido | null;
};

export function CreatePagamentoRecebidoModal({
  isOpen,
  onClose,
  financaSelecionada,
}: CreateContaReceberModalProps) {
  const hasId = Boolean(financaSelecionada?.id);

  const [descricao, setDescricao] = useState(financaSelecionada?.descricao ?? "");
  const [metodoPag, setMetodoPag] = useState(financaSelecionada?.metodoPag ?? "");
  const [taxaMaquina, setTaxaMaquina] = useState(financaSelecionada ? String(financaSelecionada.taxaMaquina) : "");
  const [dataRecebimento, setDataRecebimento] = useState(financaSelecionada?.dataRecebimento ?? "");
  const [valor, setValor] = useState(financaSelecionada ? String(financaSelecionada.valor) : "");

  const { mutate, isPending, error } = usePagamentosRecebidosForm();

  function handleClose() {
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

  if (!isOpen) return null;

  return (
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
                form="create-pagamento-recebido-form"
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
          <Form id="create-pagamento-recebido-form" onSubmit={handleSubmit}>
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
  );
}
