import { Archive, RotateCcw } from "lucide-react";
import { Modal } from "../../../components_shared";

type Props = {
  entityLabel: "produto" | "fornecedor";
  name: string;
  active: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function EntityStatusDialog({ entityLabel, name, active, isSubmitting, onClose, onConfirm }: Props) {
  const title = active ? `Arquivar ${entityLabel}` : `Reativar ${entityLabel}`;
  const Icon = active ? Archive : RotateCcw;

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description="O histórico será preservado e esta ação poderá ser revertida."
      size="sm"
      isDismissible={!isSubmitting}
      footer={
        <>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button className={active ? "btn btn--danger" : "btn btn--primary"} type="button" onClick={() => void onConfirm()} disabled={isSubmitting}>
            {isSubmitting ? <span className="btn-spinner" /> : <Icon size={17} />}
            {isSubmitting ? "Salvando..." : active ? "Arquivar" : "Reativar"}
          </button>
        </>
      }
    >
      <div className="confirmation-dialog">
        <span className="confirmation-dialog__icon" aria-hidden="true"><Icon size={26} /></span>
        <p>Confirma a alteração de status de <strong>{name}</strong>?</p>
      </div>
    </Modal>
  );
}
