import { useId, useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import type { CommissionCatalogs, WeeklyCloseInput } from "../types/commission.types";

type Props = { companyId: number; start: string; end: string; catalogs: CommissionCatalogs; total: number; isSubmitting: boolean; onClose: () => void; onSubmit: (input: WeeklyCloseInput) => Promise<void> };

function localDateTime() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function WeeklyCloseModal({ companyId, start, end, catalogs, total, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const methods = useMemo(() => catalogs.paymentMethods.filter((item) => item.ativo), [catalogs.paymentMethods]);
  const [methodId, setMethodId] = useState(methods[0] ? String(methods[0].id) : "");
  const selected = methods.find((item) => item.id === Number(methodId));
  const [cashSessionId, setCashSessionId] = useState("");
  const [paidAt, setPaidAt] = useState(localDateTime);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!methodId) { setError("Selecione a forma de pagamento."); return; }
    try { await onSubmit({ companyId, start, end, paymentMethodId: Number(methodId), cashSessionId: selected?.tipo === "dinheiro" && cashSessionId ? Number(cashSessionId) : null, paidAt, notes: notes.trim() }); } catch { return; }
  }
  return <Modal open onClose={onClose} title="Pagar fechamento semanal" description={`O sistema pagará somente saldos liberados entre ${start} e ${end}. Total atual: R$ ${total.toFixed(2).replace(".", ",")}.`} isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting || total <= 0}>{isSubmitting ? "Registrando..." : "Confirmar todos os pagamentos"}</button></FormActions>}>
    <form id={formId} className="commission-form" onSubmit={(event) => void submit(event)}>
      <SelectField label="Forma de pagamento" value={methodId} onChange={(event) => { setMethodId(event.target.value); setCashSessionId(""); setError(""); }} options={methods.map((item) => ({ value: String(item.id), label: item.nome }))} placeholder="Selecione" error={error} required />
      {selected?.tipo === "dinheiro" && <SelectField label="Sessão de caixa" value={cashSessionId} onChange={(event) => setCashSessionId(event.target.value)} options={catalogs.cashSessions.map((session) => ({ value: String(session.id), label: session.caixa?.nome ?? `Caixa #${session.id}` }))} placeholder="Sem movimentar caixa físico" />}
      <TextField label="Data e hora" type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} required />
      <TextAreaField label="Observações" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Ex.: fechamento de sábado" />
    </form>
  </Modal>;
}
