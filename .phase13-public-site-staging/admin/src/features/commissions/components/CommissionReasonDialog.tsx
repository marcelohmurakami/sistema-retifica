import { useState, type FormEvent } from "react";
import { FormActions, Modal, TextAreaField } from "../../../components_shared";

type Props = { title: string; description: string; confirmLabel: string; isSubmitting: boolean; onClose: () => void; onConfirm: (reason: string) => Promise<void> };
export function CommissionReasonDialog({ title, description, confirmLabel, isSubmitting, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); if (!reason.trim()) { setError("Informe o motivo para manter o histórico completo."); return; } try { await onConfirm(reason.trim()); } catch { return; } }
  return <Modal open onClose={onClose} title={title} description={description} size="sm" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Voltar</button><button className="btn btn--danger" type="submit" form="commission-reason-form" disabled={isSubmitting}>{isSubmitting ? "Processando..." : confirmLabel}</button></FormActions>}><form id="commission-reason-form" onSubmit={submit}><TextAreaField label="Motivo" value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} error={error} rows={4} maxLength={500} autoFocus required /></form></Modal>;
}
