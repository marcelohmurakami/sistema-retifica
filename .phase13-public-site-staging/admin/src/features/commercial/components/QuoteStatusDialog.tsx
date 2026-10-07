import { CheckCircle2, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { Modal, TextAreaField } from "../../../components_shared";
import type { Quote, QuoteStatus } from "../types/commercial.types";

type Props = { quote: Quote; status: Exclude<QuoteStatus, "rascunho" | "convertido" | "expirado">; isSubmitting: boolean; onClose: () => void; onConfirm: (observation: string) => Promise<void> };

export function QuoteStatusDialog({ quote, status, isSubmitting, onClose, onConfirm }: Props) {
  const [observation, setObservation] = useState("");
  const destructive = status === "recusado" || status === "cancelado";
  const title = status === "enviado" ? "Marcar como enviado" : status === "aprovado" ? "Aprovar orçamento" : status === "recusado" ? "Recusar orçamento" : "Cancelar orçamento";
  const Icon = status === "enviado" ? Send : status === "aprovado" ? CheckCircle2 : XCircle;
  return (
    <Modal open onClose={onClose} title={title} description={`Orçamento #${quote.id} · ${quote.cliente?.nome ?? "Cliente"}`} size="sm" isDismissible={!isSubmitting} footer={<><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Voltar</button><button className={destructive ? "btn btn--danger" : "btn btn--primary"} type="button" onClick={() => void onConfirm(observation)} disabled={isSubmitting}>{isSubmitting ? <span className="btn-spinner" /> : <Icon size={17} />}{isSubmitting ? "Salvando..." : "Confirmar"}</button></>}>
      <div className="commercial-action-dialog"><span className="confirmation-dialog__icon"><Icon size={26} /></span><p>{status === "enviado" ? "Registra que a proposta foi apresentada ao cliente." : status === "aprovado" ? "Depois da aprovação, o orçamento poderá ser convertido em comanda." : "O documento continuará disponível no histórico."}</p>{destructive && <TextAreaField label="Observação" value={observation} onChange={(event) => setObservation(event.target.value)} rows={3} maxLength={500} placeholder="Motivo ou informação adicional" />}</div>
    </Modal>
  );
}
