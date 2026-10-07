import { PackageCheck } from "lucide-react";
import { useId, useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, TextField } from "../../../components_shared";
import type { Purchase, PurchaseReceiptInput } from "../types/inventory.types";
import { formatInventoryNumber } from "../utils/inventory.utils";

type Props = {
  companyId: number;
  purchase: Purchase;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: PurchaseReceiptInput) => Promise<void>;
};

export function PurchaseReceiveModal({ companyId, purchase, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const pendingItems = useMemo(
    () => purchase.itens.filter((item) => Number(item.quantidade_recebida) < Number(item.quantidade_comprada)),
    [purchase.itens],
  );
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(pendingItems.map((item) => [item.id, String(Number(item.quantidade_comprada) - Number(item.quantidade_recebida))])),
  );
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = pendingItems
      .map((item) => ({ id_item: item.id, quantidade: Number(quantities[item.id] || 0) }))
      .filter((item) => item.quantidade > 0);
    const invalid = pendingItems.some((item) => {
      const quantity = Number(quantities[item.id] || 0);
      const remaining = Number(item.quantidade_comprada) - Number(item.quantidade_recebida);
      return quantity < 0 || quantity > remaining;
    });
    if (!items.length || invalid) {
      setError(invalid ? "Uma quantidade supera o saldo pendente da compra." : "Informe ao menos uma quantidade recebida.");
      return;
    }
    try {
      await onSubmit({ companyId, purchaseId: purchase.id, items });
    } catch {
      return;
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Receber compra #${purchase.id}`}
      description="Confirme somente o que chegou fisicamente. O recebimento parcial fica pendente."
      size="lg"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <span className="btn-spinner" /> : <PackageCheck size={17} />}
            {isSubmitting ? "Recebendo..." : "Confirmar recebimento"}
          </button>
        </FormActions>
      }
    >
      <form id={formId} className="purchase-receive-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {pendingItems.map((item) => {
          const remaining = Number(item.quantidade_comprada) - Number(item.quantidade_recebida);
          return (
            <div className="purchase-receive-item" key={item.id}>
              <div>
                <strong>{item.descricao_snapshot}</strong>
                <span>Recebido {formatInventoryNumber(item.quantidade_recebida)} de {formatInventoryNumber(item.quantidade_comprada)} {item.produto?.unidade_medida ?? "un"}</span>
              </div>
              <TextField
                label="Receber agora"
                type="number"
                min={0}
                max={remaining}
                step="0.001"
                value={quantities[item.id] ?? "0"}
                onChange={(event) => { setQuantities((current) => ({ ...current, [item.id]: event.target.value })); setError(""); }}
                hint={`Pendente: ${formatInventoryNumber(remaining)}`}
              />
            </div>
          );
        })}
        {error && <small className="field__error" role="alert">{error}</small>}
      </form>
    </Modal>
  );
}
