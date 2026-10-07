import { useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import { validateCommissionPayment, type CommissionValidationErrors } from "../schemas/commission.validation";
import type { CommissionCatalogs, CommissionLaunch, CommissionPaymentInput } from "../types/commission.types";
import { commissionBalance, formatCommissionCurrency, formatCommissionDate, localCommissionDate, localCommissionDateTime } from "../utils/commission.utils";

type Props = { companyId: number; catalogs: CommissionCatalogs; launches: CommissionLaunch[]; initialEmployeeId?: number; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CommissionPaymentInput) => Promise<void> };

export function CommissionPaymentModal({ companyId, catalogs, launches, initialEmployeeId, isSubmitting, onClose, onSubmit }: Props) {
  const today = localCommissionDate();
  const [employeeId, setEmployeeId] = useState(initialEmployeeId ? String(initialEmployeeId) : "");
  const [methodId, setMethodId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [paidAt, setPaidAt] = useState(localCommissionDateTime());
  const [periodStart, setPeriodStart] = useState(`${today.slice(0, 7)}-01`);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<CommissionValidationErrors>({});
  const methods = catalogs.paymentMethods.filter((method) => method.ativo);
  const selectedMethod = methods.find((method) => method.id === Number(methodId));
  const available = useMemo(() => launches.filter((launch) => launch.id_funcionario === Number(employeeId) && ["liberada", "parcial"].includes(launch.status) && commissionBalance(launch) > 0).sort((a, b) => a.competencia.localeCompare(b.competencia)), [employeeId, launches]);
  const items = available.filter((launch) => selected[launch.id] !== undefined).map((launch) => ({ id_lancamento_comissao: launch.id, valor: Number(selected[launch.id]) }));
  const total = items.reduce((sum, item) => sum + item.valor, 0);

  function changeEmployee(value: string) { setEmployeeId(value); setSelected({}); setErrors({}); }
  function toggle(launch: CommissionLaunch, checked: boolean) { setSelected((current) => { const next = { ...current }; if (checked) next[launch.id] = String(commissionBalance(launch)); else delete next[launch.id]; return next; }); setErrors((current) => ({ ...current, items: "" })); }
  function toggleAll() { if (available.every((launch) => selected[launch.id] !== undefined)) setSelected({}); else setSelected(Object.fromEntries(available.map((launch) => [launch.id, String(commissionBalance(launch))]))); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: CommissionPaymentInput = { companyId, employeeId: Number(employeeId), paymentMethodId: Number(methodId), cashSessionId: selectedMethod?.tipo === "dinheiro" && sessionId ? Number(sessionId) : null, paidAt, periodStart: periodStart || null, periodEnd: periodEnd || null, notes: notes.trim(), items };
    const nextErrors = validateCommissionPayment(input); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    if (items.some((item) => item.valor > commissionBalance(available.find((launch) => launch.id === item.id_lancamento_comissao)!))) {
      setErrors({ items: "O valor informado não pode ser maior que o saldo do lançamento." });
      return;
    }
    try { await onSubmit(input); } catch { return; }
  }

  return <Modal open onClose={onClose} title="Pagar comissões" description="Selecione um funcionário e os lançamentos liberados que serão quitados." size="xl" isDismissible={!isSubmitting} footer={<div className="commission-payment-footer"><div><span>Total do pagamento</span><strong>{formatCommissionCurrency(total)}</strong></div><FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form="commission-payment-form" disabled={isSubmitting || total <= 0}>{isSubmitting ? "Confirmando..." : "Confirmar pagamento"}</button></FormActions></div>}>
    <form id="commission-payment-form" className="commission-form" onSubmit={submit}>
      <div className="form-grid form-grid--2"><SelectField label="Funcionário" value={employeeId} onChange={(event) => changeEmployee(event.target.value)} options={catalogs.employees.map((employee) => ({ value: String(employee.id), label: employee.nome }))} placeholder="Selecione" error={errors.employeeId} required /><SelectField label="Forma de pagamento" value={methodId} onChange={(event) => { setMethodId(event.target.value); setSessionId(""); }} options={methods.map((method) => ({ value: String(method.id), label: method.nome }))} placeholder="Selecione" error={errors.paymentMethodId} required /></div>
      {selectedMethod?.tipo === "dinheiro" && <SelectField label="Sessão de caixa" value={sessionId} onChange={(event) => setSessionId(event.target.value)} options={catalogs.cashSessions.map((session) => ({ value: String(session.id), label: `${session.caixa?.nome ?? "Caixa"} · ${formatCommissionCurrency(session.saldo_esperado)}` }))} placeholder="Não movimentar caixa físico" hint="Selecione para registrar a saída de dinheiro no caixa aberto." />}
      <div className="form-grid form-grid--3"><TextField label="Pago em" type="datetime-local" max={localCommissionDateTime()} value={paidAt} onChange={(event) => setPaidAt(event.target.value)} error={errors.paidAt} required /><TextField label="Período inicial" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /><TextField label="Período final" type="date" min={periodStart} value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} error={errors.periodEnd} /></div>
      <section className="commission-payment-items"><header><div><h3>Comissões liberadas</h3><p>{available.length ? `${available.length} lançamentos disponíveis` : "Selecione um funcionário com saldo liberado"}</p></div>{available.length > 0 && <button className="btn btn--ghost btn--small" type="button" onClick={toggleAll}>{available.every((launch) => selected[launch.id] !== undefined) ? "Limpar seleção" : "Selecionar todas"}</button>}</header>{errors.items && <small className="field__error">{errors.items}</small>}<div className="commission-payment-items__list">{available.map((launch) => { const checked = selected[launch.id] !== undefined; const balance = commissionBalance(launch); return <article key={launch.id} data-selected={checked}><label><input type="checkbox" checked={checked} onChange={(event) => toggle(launch, event.target.checked)} /><span><strong>{launch.descricao_snapshot}</strong><small>{formatCommissionDate(launch.competencia)} · saldo {formatCommissionCurrency(balance)}</small></span></label><TextField label="Valor a pagar" type="number" min="0.01" max={balance} step="0.01" value={selected[launch.id] ?? ""} onChange={(event) => setSelected((current) => ({ ...current, [launch.id]: event.target.value }))} disabled={!checked} /></article>; })}</div></section>
      <TextAreaField label="Observações" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Informações para o histórico do pagamento" />
    </form>
  </Modal>;
}
