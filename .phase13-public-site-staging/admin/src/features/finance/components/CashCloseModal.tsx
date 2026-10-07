import { useState, type FormEvent } from "react";
import { FormActions, Modal, TextAreaField, TextField } from "../../../components_shared";
import { validateCashClose, type ValidationErrors } from "../schemas/finance.validation";
import type { CashCloseInput, CashSession } from "../types/finance.types";
import { formatFinancialCurrency } from "../utils/finance.utils";

type Props = { companyId: number; session: CashSession; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CashCloseInput) => Promise<void> };

export function CashCloseModal({ companyId, session, isSubmitting, onClose, onSubmit }: Props) {
  const [countedBalance, setCountedBalance] = useState(String(session.saldo_esperado ?? 0));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const difference = Number(countedBalance || 0) - Number(session.saldo_esperado);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: CashCloseInput = { companyId, sessionId: session.id, countedBalance: Number(countedBalance), notes: notes.trim() };
    const nextErrors = validateCashClose(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try { await onSubmit(input); } catch { return; }
  }

  return <Modal open onClose={onClose} title="Fechar caixa" description={session.caixa?.nome ?? "Conferência da sessão"} size="sm" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Voltar</button><button className="btn btn--primary" type="submit" form="cash-close-form" disabled={isSubmitting}>{isSubmitting ? "Fechando..." : "Confirmar fechamento"}</button></FormActions>}>
    <form id="cash-close-form" className="finance-form" onSubmit={submit}>
      <div className="finance-payment-summary"><span>Saldo esperado</span><strong>{formatFinancialCurrency(session.saldo_esperado)}</strong></div>
      <TextField label="Saldo contado" type="number" min="0" step="0.01" value={countedBalance} onChange={(event) => setCountedBalance(event.target.value)} error={errors.countedBalance} required />
      <div className="finance-cash-difference" data-tone={difference === 0 ? "neutral" : difference > 0 ? "positive" : "negative"}><span>Diferença</span><strong>{formatFinancialCurrency(difference)}</strong></div>
      <TextAreaField label="Observações" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder={difference ? "Explique a diferença encontrada" : "Opcional"} />
    </form>
  </Modal>;
}
