import { useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import { validateCommissionAdjustment, type CommissionValidationErrors } from "../schemas/commission.validation";
import type { CommissionAdjustmentInput, CommissionCatalogs } from "../types/commission.types";
import { localCommissionDate } from "../utils/commission.utils";

type Props = { companyId: number; catalogs: CommissionCatalogs; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CommissionAdjustmentInput) => Promise<void> };

export function CommissionAdjustmentModal({ companyId, catalogs, isSubmitting, onClose, onSubmit }: Props) {
  const [employeeId, setEmployeeId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [competence, setCompetence] = useState(localCommissionDate());
  const [errors, setErrors] = useState<CommissionValidationErrors>({});
  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: CommissionAdjustmentInput = { companyId, employeeId: Number(employeeId), description: description.trim(), amount: Number(amount), competence };
    const nextErrors = validateCommissionAdjustment(input); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    try { await onSubmit(input); } catch { return; }
  }
  return <Modal open onClose={onClose} title="Novo ajuste de comissão" description="Adicione um crédito excepcional. Ele ficará liberado para o próximo pagamento e registrado na auditoria." size="sm" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form="commission-adjustment-form" disabled={isSubmitting}>{isSubmitting ? "Criando..." : "Criar ajuste"}</button></FormActions>}>
    <form id="commission-adjustment-form" className="commission-form" onSubmit={submit}><SelectField label="Funcionário" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} options={catalogs.employees.map((employee) => ({ value: String(employee.id), label: employee.nome }))} placeholder="Selecione" error={errors.employeeId} required /><div className="form-grid form-grid--2"><TextField label="Valor" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} error={errors.amount} required /><TextField label="Competência" type="date" value={competence} onChange={(event) => setCompetence(event.target.value)} error={errors.competence} required /></div><TextAreaField label="Motivo do ajuste" value={description} onChange={(event) => setDescription(event.target.value)} error={errors.description} rows={4} maxLength={500} placeholder="Ex.: bônus por meta atingida" required /></form>
  </Modal>;
}
