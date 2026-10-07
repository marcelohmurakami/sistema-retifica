import { useId, useState, type FormEvent } from "react";
import {
  CheckboxField,
  FormActions,
  Modal,
  SelectField,
  TextAreaField,
  TextField,
} from "../../../components_shared";
import {
  hasInventoryFormErrors,
  validateProductForm,
  type InventoryFormErrors,
} from "../schemas/inventory.validation";
import type { Product, ProductFormValues } from "../types/inventory.types";
import {
  getEmptyProductFormValues,
  productToFormValues,
} from "../utils/inventory.utils";

type Props = {
  product?: Product;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

export function ProductFormModal({ product, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const [values, setValues] = useState<ProductFormValues>(() =>
    product ? productToFormValues(product) : getEmptyProductFormValues(),
  );
  const [errors, setErrors] = useState<InventoryFormErrors>({});

  function update<K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) {
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
    const nextErrors = validateProductForm(values);
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
      title={product ? "Editar produto" : "Novo produto"}
      description="Defina os dados comerciais e as regras de controle do estoque."
      size="lg"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting && <span className="btn-spinner" />}
            {isSubmitting ? "Salvando..." : "Salvar produto"}
          </button>
        </FormActions>
      }
    >
      <form id={formId} className="inventory-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <TextField label="Nome do produto" value={values.name} onChange={(event) => update("name", event.target.value)} error={errors.name} maxLength={160} autoFocus required wrapperClassName="field--wide" />
        <TextField label="Código / SKU" value={values.code} onChange={(event) => update("code", event.target.value)} error={errors.code} maxLength={80} placeholder="Ex.: SH-001" />
        <TextAreaField label="Descrição" value={values.description} onChange={(event) => update("description", event.target.value)} rows={3} maxLength={500} wrapperClassName="field--full" />
        <SelectField
          label="Finalidade"
          value={values.purpose}
          onChange={(event) => update("purpose", event.target.value as ProductFormValues["purpose"])}
          options={[
            { value: "venda", label: "Venda" },
            { value: "consumo_interno", label: "Consumo interno" },
            { value: "ambos", label: "Venda e consumo" },
          ]}
        />
        <TextField label="Unidade" value={values.unit} onChange={(event) => update("unit", event.target.value)} error={errors.unit} hint="Ex.: un, ml, kg" maxLength={20} required />
        <TextField label="Preço de venda" type="number" inputMode="decimal" min={0} step="0.01" value={values.salePrice} onChange={(event) => update("salePrice", event.target.value)} error={errors.salePrice} trailingContent="R$" />
        <TextField label="Custo atual" type="number" inputMode="decimal" min={0} step="0.01" value={values.averageCost} onChange={(event) => update("averageCost", event.target.value)} error={errors.averageCost} hint="Será recalculado nos recebimentos" trailingContent="R$" />
        <div className="inventory-form__options field--full">
          <CheckboxField label="Controlar estoque" description="Registra entradas, saídas, saldo e alertas deste produto." checked={values.tracksStock} onChange={(event) => update("tracksStock", event.target.checked)} />
          {values.tracksStock && (
            <TextField label="Estoque mínimo" type="number" inputMode="decimal" min={0} step="0.001" value={values.minimumStock} onChange={(event) => update("minimumStock", event.target.value)} error={errors.minimumStock} hint="O alerta aparece quando o saldo atingir esse valor" />
          )}
        </div>
      </form>
    </Modal>
  );
}
