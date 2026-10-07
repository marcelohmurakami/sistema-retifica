import { useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import { validatePayment, type ValidationErrors } from "../schemas/finance.validation";
import type { AccountInstallment, FinancialAccount, FinancialCatalogs, PaymentWriteInput, CashSession } from "../types/finance.types";
import { formatFinancialCurrency, installmentBalance, localDateTimeInput } from "../utils/finance.utils";

type Props = { companyId: number; account: FinancialAccount; installment: AccountInstallment; catalogs: FinancialCatalogs; sessions: CashSession[]; isSubmitting: boolean; onClose: () => void; onSubmit: (input: PaymentWriteInput) => Promise<void> };

export function PaymentModal({ companyId, account, installment, catalogs, sessions, isSubmitting, onClose, onSubmit }: Props) {
  const available = installmentBalance(installment);
  const methods = useMemo(() => catalogs.paymentMethods.filter((item) => item.ativo), [catalogs.paymentMethods]);
  const [methodId, setMethodId] = useState(methods[0]?.id ? String(methods[0].id) : "");
  const selectedMethod = methods.find((item) => item.id === Number(methodId));
  const [sessionId, setSessionId] = useState("");
  const [paidAt, setPaidAt] = useState(localDateTimeInput());
  const [amount, setAmount] = useState(String(available));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const openSessions = sessions.filter((item) => item.status === "aberta");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: PaymentWriteInput = { companyId, type: account.tipo === "receber" ? "entrada" : "saida", paymentMethodId: Number(methodId), cashSessionId: selectedMethod?.tipo === "dinheiro" && sessionId ? Number(sessionId) : null, paidAt, amount: Number(amount), reference: reference.trim(), notes: notes.trim(), allocations: [{ id_parcela: installment.id, valor: Number(amount) }] };
    const nextErrors = validatePayment(input, available); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    try { await onSubmit(input); } catch { return; }
  }

  return <Modal open onClose={onClose} title={account.tipo === "receber" ? "Registrar recebimento" : "Registrar pagamento"} description={`${account.descricao} · parcela ${installment.numero_parcela} · saldo ${formatFinancialCurrency(available)}`} size="md" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form="financial-payment-form" disabled={isSubmitting}>{isSubmitting ? "Confirmando..." : "Confirmar pagamento"}</button></FormActions>}>
    <form id="financial-payment-form" className="finance-form" onSubmit={submit}>
      <div className="finance-payment-summary"><span>Saldo da parcela</span><strong>{formatFinancialCurrency(available)}</strong></div>
      <SelectField label="Forma de pagamento" value={methodId} onChange={(event) => { setMethodId(event.target.value); setSessionId(""); }} options={methods.map((item) => ({ value: String(item.id), label: item.nome }))} placeholder="Selecione" error={errors.paymentMethodId} required />
      {selectedMethod?.tipo === "dinheiro" && <SelectField label="Sessão de caixa" value={sessionId} onChange={(event) => setSessionId(event.target.value)} options={openSessions.map((item) => ({ value: String(item.id), label: `${item.caixa?.nome ?? "Caixa"} · saldo ${formatFinancialCurrency(item.saldo_esperado)}` }))} placeholder="Não movimentar caixa físico" hint={openSessions.length ? "Selecione para refletir o dinheiro no caixa." : "Nenhuma sessão está aberta; o pagamento ainda pode ser registrado."} />}
      <div className="form-grid form-grid--2">
        <TextField label="Valor" type="number" min="0.01" max={available} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} error={errors.amount} required />
        <TextField label="Data e hora" type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} error={errors.paidAt} required />
      </div>
      <TextField label="Referência" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="NSU, comprovante ou identificação" />
      <TextAreaField label="Observações" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
    </form>
  </Modal>;
}
