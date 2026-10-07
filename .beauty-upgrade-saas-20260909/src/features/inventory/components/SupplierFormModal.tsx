import { useId, useState, type FormEvent } from "react";
import {
  FormActions,
  MaskedInput,
  Modal,
  TextAreaField,
  TextField,
} from "../../../components_shared";
import {
  hasInventoryFormErrors,
  validateSupplierForm,
  type InventoryFormErrors,
} from "../schemas/inventory.validation";
import type { Supplier, SupplierFormValues } from "../types/inventory.types";
import {
  getEmptySupplierFormValues,
  supplierToFormValues,
} from "../utils/inventory.utils";

type Props = {
  supplier?: Supplier;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
};

export function SupplierFormModal({ supplier, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const [values, setValues] = useState<SupplierFormValues>(() =>
    supplier ? supplierToFormValues(supplier) : getEmptySupplierFormValues(),
  );
  const [errors, setErrors] = useState<InventoryFormErrors>({});

  function update<K extends keyof SupplierFormValues>(field: K, value: SupplierFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSupplierForm(values);
    setErrors(nextErrors);
    if (hasInventoryFormErrors(nextErrors)) return;
    try {
      await onSubmit(values);
    } catch {
      return;
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={supplier ? "Editar fornecedor" : "Novo fornecedor"}
      description="Mantenha os contatos e dados de compra do fornecedor organizados."
      size="lg"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting && <span className="btn-spinner" />}
            {isSubmitting ? "Salvando..." : "Salvar fornecedor"}
          </button>
        </FormActions>
      }
    >
      <form id={formId} className="inventory-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <TextField label="Razão social / nome" value={values.name} onChange={(event) => update("name", event.target.value)} error={errors.name} maxLength={180} autoFocus required />
        <TextField label="Nome fantasia" value={values.tradeName} onChange={(event) => update("tradeName", event.target.value)} maxLength={160} />
        <TextField label="CPF ou CNPJ" value={values.document} onChange={(event) => update("document", event.target.value)} maxLength={18} placeholder="Documento do fornecedor" />
        <TextField label="Contato responsável" value={values.contactName} onChange={(event) => update("contactName", event.target.value)} maxLength={160} />
        <MaskedInput mask="telefone" label="Telefone" value={values.phone} onValueChange={(value) => update("phone", value)} placeholder="(00) 00000-0000" />
        <TextField label="E-mail" type="email" value={values.email} onChange={(event) => update("email", event.target.value)} error={errors.email} maxLength={180} />
        <TextField label="Endereço" value={values.address} onChange={(event) => update("address", event.target.value)} maxLength={300} wrapperClassName="field--full" />
        <TextAreaField label="Observações" value={values.notes} onChange={(event) => update("notes", event.target.value)} rows={3} maxLength={1000} wrapperClassName="field--full" />
      </form>
    </Modal>
  );
}
