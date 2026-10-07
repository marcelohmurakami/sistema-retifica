import { XCircle } from "lucide-react";
import { Modal } from "../../../components_shared";
import type { Purchase } from "../types/inventory.types";

type Props = {
  purchase: Purchase;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function PurchaseCancelDialog({ purchase, isSubmitting, onClose, onConfirm }: Props) {
  return (
    <Modal
      open
      onClose={onClose}
      title={`Cancelar compra #${purchase.id}`}
      description="Compras canceladas permanecem no histórico e não geram entrada no estoque."
      size="sm"
      isDismissible={!isSubmitting}
      footer={
        <>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Voltar</button>
          <button className="btn btn--danger" type="button" onClick={() => void onConfirm()} disabled={isSubmitting}>
            {isSubmitting ? <span className="btn-spinner" /> : <XCircle size={17} />}
            {isSubmitting ? "Cancelando..." : "Cancelar compra"}
          </button>
        </>
      }
    >
      <div className="confirmation-dialog">
        <span className="confirmation-dialog__icon" aria-hidden="true"><XCircle size={26} /></span>
        <p>Tem certeza? Esta compra não poderá mais ser editada ou recebida.</p>
      </div>
    </Modal>
  );
}
