import { useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import { validateCashOpen, type ValidationErrors } from "../schemas/finance.validation";
import type { CashOpenInput, CashSession, FinancialCatalogs } from "../types/finance.types";

type Props = { companyId: number; catalogs: FinancialCatalogs; sessions: CashSession[]; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CashOpenInput) => Promise<void> };

export function CashOpenModal({ companyId, catalogs, sessions, isSubmitting, onClose, onSubmit }: Props) {
  const drawers = useMemo(() => {
    const opened = new Set(sessions.filter((session) => session.status === "aberta").map((session) => session.id_caixa));
    return catalogs.cashDrawers.filter((drawer) => drawer.ativo && !opened.has(drawer.id));
  }, [catalogs.cashDrawers, sessions]);
  const [drawerId, setDrawerId] = useState(drawers[0]?.id ? String(drawers[0].id) : "");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: CashOpenInput = { companyId, cashDrawerId: Number(drawerId), openingBalance: Number(openingBalance), notes: notes.trim() };
    const nextErrors = validateCashOpen(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try { await onSubmit(input); } catch { return; }
  }

  return <Modal open onClose={onClose} title="Abrir caixa" description="Informe o fundo de troco contado antes de iniciar as movimentações." size="sm" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form="cash-open-form" disabled={isSubmitting || !drawers.length}>{isSubmitting ? "Abrindo..." : "Abrir caixa"}</button></FormActions>}>
    <form id="cash-open-form" className="finance-form" onSubmit={submit}>
      <SelectField label="Caixa" value={drawerId} onChange={(event) => setDrawerId(event.target.value)} options={drawers.map((drawer) => ({ value: String(drawer.id), label: drawer.nome }))} placeholder={drawers.length ? "Selecione" : "Todos os caixas ativos já estão abertos"} error={errors.cashDrawerId} required />
      <TextField label="Saldo inicial" type="number" min="0" step="0.01" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} error={errors.openingBalance} required />
      <TextAreaField label="Observações" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Ex.: abertura do turno da manhã" />
    </form>
  </Modal>;
}
