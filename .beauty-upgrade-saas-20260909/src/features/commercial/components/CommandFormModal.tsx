import { useId, useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import { hasCommercialFormErrors, validateCommandForm, type CommercialFormErrors } from "../schemas/commercial.validation";
import type { Command, CommandFormValues, CommandWriteInput, CommercialCatalogs } from "../types/commercial.types";
import { commandToFormValues, commercialDocumentTotal, commercialItemsDiscount, commercialItemsSubtotal, commercialItemsToPayload, formatCommercialCurrency, getEmptyCommandFormValues } from "../utils/commercial.utils";
import { CommercialItemsEditor } from "./CommercialItemsEditor";

type Props = { companyId: number; command?: Command; catalogs: CommercialCatalogs; isSubmitting: boolean; onClose: () => void; onSubmit: (input: CommandWriteInput) => Promise<void> };

export function CommandFormModal({ companyId, command, catalogs, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const [values, setValues] = useState<CommandFormValues>(() => command ? commandToFormValues(command) : getEmptyCommandFormValues());
  const [errors, setErrors] = useState<CommercialFormErrors>({});
  const subtotal = useMemo(() => commercialItemsSubtotal(values.items), [values.items]);
  const itemDiscount = useMemo(() => commercialItemsDiscount(values.items), [values.items]);
  const total = useMemo(() => commercialDocumentTotal(values), [values]);
  function update<K extends keyof CommandFormValues>(field: K, value: CommandFormValues[K]) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; }); }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const nextErrors = validateCommandForm(values); setErrors(nextErrors); if (hasCommercialFormErrors(nextErrors)) return; try { await onSubmit({ commandId: command?.id, companyId, clientId: Number(values.clientId), responsibleEmployeeId: values.responsibleEmployeeId ? Number(values.responsibleEmployeeId) : null, paymentCondition: values.paymentCondition, discount: Number(values.discount || 0), surcharge: Number(values.surcharge || 0), notes: values.notes.trim(), items: commercialItemsToPayload(values.items, true) }); } catch { return; } }
  return (
    <Modal open onClose={onClose} title={command ? `Editar comanda #${command.id}` : "Nova comanda"} description="Registre tudo o que será cobrado no atendimento." size="xl" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>{isSubmitting && <span className="btn-spinner" />}{isSubmitting ? "Salvando..." : command ? "Salvar comanda" : "Abrir comanda"}</button></FormActions>}>
      <form id={formId} className="commercial-document-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <section className="commercial-document-header">
          <SelectField label="Cliente" value={values.clientId} onChange={(event) => update("clientId", event.target.value)} error={errors.clientId} placeholder="Selecione o cliente" options={catalogs.clients.map((client) => ({ value: String(client.id), label: `${client.nome}${client.ativo ? "" : " (inativo)"}`, disabled: !client.ativo && client.id !== command?.id_cliente }))} required />
          <SelectField label="Responsável pela comanda" value={values.responsibleEmployeeId} onChange={(event) => update("responsibleEmployeeId", event.target.value)} placeholder="Sem responsável geral" options={catalogs.employees.filter((employee) => employee.atende_clientes).map((employee) => ({ value: String(employee.id), label: `${employee.nome}${employee.ativo ? "" : " (inativo)"}`, disabled: !employee.ativo && employee.id !== command?.id_funcionario_responsavel }))} />
          <SelectField label="Condição no fechamento" value={values.paymentCondition} onChange={(event) => update("paymentCondition", event.target.value as CommandFormValues["paymentCondition"])} options={[{ value: "a_receber", label: "Receber depois" }, { value: "pago", label: "Receber no fechamento" }]} hint="A confirmação e a forma de pagamento serão informadas ao fechar." />
          <TextAreaField label="Observações do atendimento" value={values.notes} onChange={(event) => update("notes", event.target.value)} rows={2} maxLength={1000} wrapperClassName="commercial-document-header__notes" />
        </section>
        <CommercialItemsEditor mode="command" items={values.items} catalogs={catalogs} error={errors.items} onChange={(items) => update("items", items)} />
        <section className="commercial-summary"><div><span>Subtotal</span><strong>{formatCommercialCurrency(subtotal)}</strong></div><div><span>Descontos nos itens</span><strong>− {formatCommercialCurrency(itemDiscount)}</strong></div><TextField label="Desconto geral" type="number" min={0} step="0.01" value={values.discount} onChange={(event) => update("discount", event.target.value)} error={errors.discount} trailingContent="R$" /><TextField label="Acréscimo" type="number" min={0} step="0.01" value={values.surcharge} onChange={(event) => update("surcharge", event.target.value)} error={errors.surcharge} trailingContent="R$" /><div className="commercial-summary__total"><span>Total da comanda</span><strong>{formatCommercialCurrency(total)}</strong></div></section>
      </form>
    </Modal>
  );
}
