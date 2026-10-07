import { ArrowRight } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField } from "../../../components_shared";
import type { CommercialCatalogs, Quote, QuoteConversionInput } from "../types/commercial.types";

type Props = { companyId: number; quote: Quote; catalogs: CommercialCatalogs; isSubmitting: boolean; onClose: () => void; onSubmit: (input: QuoteConversionInput) => Promise<void> };

export function QuoteConversionModal({ companyId, quote, catalogs, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const serviceItems = quote.itens.filter((item) => item.tipo_item === "servico");
  const [responsibleId, setResponsibleId] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (serviceItems.some((item) => !assignments[String(item.id)])) { setError("Selecione o profissional responsável por cada serviço."); return; } try { await onSubmit({ companyId, quoteId: quote.id, responsibleEmployeeId: responsibleId ? Number(responsibleId) : null, serviceEmployees: Object.fromEntries(Object.entries(assignments).map(([key, value]) => [key, Number(value)])), notes: notes.trim() }); } catch { return; } }
  return (
    <Modal open onClose={onClose} title="Converter em comanda" description="Os preços e descontos aprovados serão preservados na nova comanda." size="lg" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>{isSubmitting ? <span className="btn-spinner" /> : <ArrowRight size={17} />}{isSubmitting ? "Convertendo..." : "Criar comanda"}</button></FormActions>}>
      <form id={formId} className="quote-conversion-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <SelectField label="Responsável geral" value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)} placeholder="Sem responsável geral" options={catalogs.employees.filter((employee) => employee.ativo && employee.atende_clientes).map((employee) => ({ value: String(employee.id), label: employee.nome }))} />
        {serviceItems.length > 0 && <section className="quote-conversion-services"><header><h3>Profissionais por serviço</h3><p>Cada serviço precisa de um profissional habilitado.</p></header>{serviceItems.map((item) => { const employees = catalogs.employees.filter((employee) => employee.ativo && employee.atende_clientes && catalogs.employeeServices.some((assignment) => assignment.ativo && assignment.id_funcionario === employee.id && assignment.id_servico === item.id_servico)); return <div key={item.id}><span>{item.descricao_snapshot}</span><SelectField label="Profissional" value={assignments[String(item.id)] ?? ""} onChange={(event) => { setAssignments((current) => ({ ...current, [String(item.id)]: event.target.value })); setError(""); }} placeholder="Selecione" options={employees.map((employee) => ({ value: String(employee.id), label: employee.nome }))} required /></div>; })}{error && <small className="field__error" role="alert">{error}</small>}</section>}
        <TextAreaField label="Observações da comanda" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={1000} />
      </form>
    </Modal>
  );
}
