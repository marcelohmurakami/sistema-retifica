import { XCircle } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { FormActions, Modal, TextAreaField } from "../../../components_shared";
import type { CancelCommandInput, Command } from "../types/commercial.types";

type Props = { companyId: number; command: Command; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CancelCommandInput) => Promise<void> };
export function CommandCancelDialog({ companyId, command, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId(); const [reason, setReason] = useState(""); const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (reason.trim().length < 3) { setError("Informe o motivo do cancelamento."); return; } try { await onSubmit({ companyId, commandId: command.id, reason: reason.trim() }); } catch { return; } }
  return <Modal open onClose={onClose} title={`Cancelar comanda #${command.id}`} description={command.status === "fechada" ? "Estoque, comissões e a conta sem pagamento serão estornados." : "A comanda continuará disponível no histórico."} size="sm" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Voltar</button><button className="btn btn--danger" type="submit" form={formId} disabled={isSubmitting}>{isSubmitting ? <span className="btn-spinner" /> : <XCircle size={17} />}{isSubmitting ? "Cancelando..." : "Cancelar comanda"}</button></FormActions>}><form id={formId} onSubmit={(event) => void handleSubmit(event)}><TextAreaField label="Motivo" value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} error={error} rows={4} maxLength={500} autoFocus required /></form></Modal>;
}
