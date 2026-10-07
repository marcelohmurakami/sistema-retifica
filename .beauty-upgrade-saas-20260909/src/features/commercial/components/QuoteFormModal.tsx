import { useId, useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import { hasCommercialFormErrors, validateQuoteForm, type CommercialFormErrors } from "../schemas/commercial.validation";
import type { CommercialCatalogs, Quote, QuoteFormValues, QuoteWriteInput } from "../types/commercial.types";
import { commercialDocumentTotal, commercialItemsDiscount, commercialItemsSubtotal, commercialItemsToPayload, formatCommercialCurrency, getEmptyQuoteFormValues, quoteToFormValues } from "../utils/commercial.utils";
import { CommercialItemsEditor } from "./CommercialItemsEditor";

type Props = { companyId: number; quote?: Quote; catalogs: CommercialCatalogs; isSubmitting: boolean; onClose: () => void; onSubmit: (input: QuoteWriteInput) => Promise<void> };

export function QuoteFormModal({ companyId, quote, catalogs, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const [values, setValues] = useState<QuoteFormValues>(() => quote ? quoteToFormValues(quote) : getEmptyQuoteFormValues());
  const [errors, setErrors] = useState<CommercialFormErrors>({});
  const subtotal = useMemo(() => commercialItemsSubtotal(values.items), [values.items]);
  const itemDiscount = useMemo(() => commercialItemsDiscount(values.items), [values.items]);
  const total = useMemo(() => commercialDocumentTotal(values), [values]);
  function update<K extends keyof QuoteFormValues>(field: K, value: QuoteFormValues[K]) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; }); }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const nextErrors = validateQuoteForm(values); setErrors(nextErrors); if (hasCommercialFormErrors(nextErrors)) return; try { await onSubmit({ quoteId: quote?.id, companyId, clientId: Number(values.clientId), validity: values.validity || null, discount: Number(values.discount || 0), surcharge: Number(values.surcharge || 0), notes: values.notes.trim(), items: commercialItemsToPayload(values.items, false) }); } catch { return; } }
  return (
    <Modal open onClose={onClose} title={quote ? `Editar orçamento #${quote.id}` : "Novo orçamento"} description="Monte a proposta com preços preservados e validade definida." size="xl" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>{isSubmitting && <span className="btn-spinner" />}{isSubmitting ? "Salvando..." : "Salvar orçamento"}</button></FormActions>}>
      <form id={formId} className="commercial-document-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <section className="commercial-document-header">
          <SelectField label="Cliente" value={values.clientId} onChange={(event) => update("clientId", event.target.value)} error={errors.clientId} placeholder="Selecione o cliente" options={catalogs.clients.map((client) => ({ value: String(client.id), label: `${client.nome}${client.ativo ? "" : " (inativo)"}`, disabled: !client.ativo && client.id !== quote?.id_cliente }))} required />
          <TextField label="Validade" type="date" value={values.validity} onChange={(event) => update("validity", event.target.value)} error={errors.validity} />
          <TextAreaField label="Observações da proposta" value={values.notes} onChange={(event) => update("notes", event.target.value)} rows={2} maxLength={1000} wrapperClassName="commercial-document-header__notes" />
        </section>
        <CommercialItemsEditor mode="quote" items={values.items} catalogs={catalogs} error={errors.items} onChange={(items) => update("items", items)} />
        <section className="commercial-summary"><div><span>Subtotal</span><strong>{formatCommercialCurrency(subtotal)}</strong></div><div><span>Descontos nos itens</span><strong>− {formatCommercialCurrency(itemDiscount)}</strong></div><TextField label="Desconto geral" type="number" min={0} step="0.01" value={values.discount} onChange={(event) => update("discount", event.target.value)} error={errors.discount} trailingContent="R$" /><TextField label="Acréscimo" type="number" min={0} step="0.01" value={values.surcharge} onChange={(event) => update("surcharge", event.target.value)} error={errors.surcharge} trailingContent="R$" /><div className="commercial-summary__total"><span>Total da proposta</span><strong>{formatCommercialCurrency(total)}</strong></div></section>
      </form>
    </Modal>
  );
}
