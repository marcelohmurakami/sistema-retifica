import { useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import { validateCashMovement, type ValidationErrors } from "../schemas/finance.validation";
import type { CashMovementInput, CashSession } from "../types/finance.types";
import { formatFinancialCurrency } from "../utils/finance.utils";

type ManualMovement = CashMovementInput["type"];
type Props = { companyId: number; session: CashSession; initialType?: ManualMovement; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CashMovementInput) => Promise<void> };

export function CashMovementModal({ companyId, session, initialType = "suprimento", isSubmitting, onClose, onSubmit }: Props) {
  const [type, setType] = useState<ManualMovement>(initialType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: CashMovementInput = { companyId, sessionId: session.id, type, amount: Number(amount), description: description.trim() };
    const nextErrors = validateCashMovement(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try { await onSubmit(input); } catch { return; }
  }

  return <Modal open onClose={onClose} title="Movimentar caixa" description={`${session.caixa?.nome ?? "Caixa"} · saldo ${formatFinancialCurrency(session.saldo_esperado)}`} size="sm" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form="cash-movement-form" disabled={isSubmitting}>{isSubmitting ? "Registrando..." : "Registrar"}</button></FormActions>}>
    <form id="cash-movement-form" className="finance-form" onSubmit={submit}>
      <SelectField label="Tipo" value={type} onChange={(event) => setType(event.target.value as ManualMovement)} options={[{ value: "suprimento", label: "Suprimento (entrada de dinheiro)" }, { value: "sangria", label: "Sangria (retirada de dinheiro)" }, { value: "ajuste_entrada", label: "Ajuste de entrada" }, { value: "ajuste_saida", label: "Ajuste de saída" }]} />
      <TextField label="Valor" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} error={errors.amount} required />
      <TextAreaField label="Finalidade / motivo" value={description} onChange={(event) => setDescription(event.target.value)} error={errors.description} rows={3} placeholder="Ex.: retirada para depósito bancário" required />
    </form>
  </Modal>;
}
