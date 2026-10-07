import { Plus, Trash2 } from "lucide-react";
import { useId, useMemo, useState, type FormEvent } from "react";
import {
  FormActions,
  Modal,
  SelectField,
  TextAreaField,
  TextField,
} from "../../../components_shared";
import {
  hasInventoryFormErrors,
  validatePurchaseForm,
  type InventoryFormErrors,
} from "../schemas/inventory.validation";
import type {
  Product,
  Purchase,
  PurchaseFormItem,
  PurchaseFormValues,
  PurchaseWriteInput,
  Supplier,
} from "../types/inventory.types";
import {
  formatInventoryCurrency,
  getEmptyPurchaseFormValues,
  purchaseFinalTotal,
  purchaseItemsTotal,
  purchaseToFormValues,
} from "../utils/inventory.utils";

type Props = {
  companyId: number;
  purchase?: Purchase;
  products: Product[];
  suppliers: Supplier[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: PurchaseWriteInput) => Promise<void>;
};

const emptyItem = (): PurchaseFormItem => ({ productId: "", quantity: "1", unitCost: "0" });

export function PurchaseFormModal({ companyId, purchase, products, suppliers, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const [values, setValues] = useState<PurchaseFormValues>(() =>
    purchase ? purchaseToFormValues(purchase) : getEmptyPurchaseFormValues(),
  );
  const [errors, setErrors] = useState<InventoryFormErrors>({});
  const subtotal = useMemo(() => purchaseItemsTotal(values), [values]);
  const total = useMemo(() => purchaseFinalTotal(values), [values]);

  function update<K extends keyof PurchaseFormValues>(field: K, value: PurchaseFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function updateItem(index: number, field: keyof PurchaseFormItem, value: string) {
    update("items", values.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
    setErrors((current) => {
      if (!current.items) return current;
      const next = { ...current };
      delete next.items;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validatePurchaseForm(values);
    setErrors(nextErrors);
    if (hasInventoryFormErrors(nextErrors)) return;
    try {
      await onSubmit({
        purchaseId: purchase?.id,
        companyId,
        supplierId: Number(values.supplierId),
        purchaseDate: values.purchaseDate,
        documentNumber: values.documentNumber.trim(),
        expectedDate: values.expectedDate || null,
        freight: Number(values.freight || 0),
        discount: Number(values.discount || 0),
        notes: values.notes.trim(),
        items: values.items.map((item) => ({ id_produto: Number(item.productId), quantidade: Number(item.quantity), valor_unitario: Number(item.unitCost) })),
      });
    } catch {
      return;
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={purchase ? `Editar compra #${purchase.id}` : "Nova compra"}
      description="A entrada no estoque acontecerá somente quando o recebimento for confirmado."
      size="xl"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting && <span className="btn-spinner" />}
            {isSubmitting ? "Salvando..." : "Salvar compra"}
          </button>
        </FormActions>
      }
    >
      <form id={formId} className="purchase-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <section className="purchase-form__header">
          <SelectField
            label="Fornecedor"
            value={values.supplierId}
            onChange={(event) => update("supplierId", event.target.value)}
            error={errors.supplierId}
            placeholder="Selecione um fornecedor"
            options={suppliers.map((supplier) => ({ value: String(supplier.id), label: `${supplier.nome_fantasia || supplier.nome}${supplier.ativo ? "" : " (inativo)"}`, disabled: !supplier.ativo && supplier.id !== purchase?.id_fornecedor }))}
            required
          />
          <TextField label="Data da compra" type="date" value={values.purchaseDate} onChange={(event) => update("purchaseDate", event.target.value)} error={errors.purchaseDate} required />
          <TextField label="Documento / nota" value={values.documentNumber} onChange={(event) => update("documentNumber", event.target.value)} maxLength={80} />
          <TextField label="Previsão de entrega" type="date" value={values.expectedDate} onChange={(event) => update("expectedDate", event.target.value)} />
        </section>

        <section className="purchase-items">
          <header>
            <div><h3>Produtos da compra</h3><p>Informe quantidade e custo unitário de cada item.</p></div>
            <button className="btn btn--secondary btn--small" type="button" onClick={() => update("items", [...values.items, emptyItem()])}><Plus size={16} /> Adicionar item</button>
          </header>
          <div className="purchase-items__list">
            {values.items.map((item, index) => (
              <div className="purchase-item-row" key={`${index}-${item.productId}`}>
                <SelectField
                  label={index === 0 ? "Produto" : `Produto ${index + 1}`}
                  value={item.productId}
                  onChange={(event) => updateItem(index, "productId", event.target.value)}
                  placeholder="Selecione"
                  options={products.map((product) => ({ value: String(product.id), label: `${product.nome}${product.codigo ? ` · ${product.codigo}` : ""}${product.ativo ? "" : " (inativo)"}`, disabled: !product.ativo && product.id !== Number(item.productId) }))}
                />
                <TextField label="Quantidade" type="number" min={0.001} step="0.001" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
                <TextField label="Custo unitário" type="number" min={0} step="0.01" value={item.unitCost} onChange={(event) => updateItem(index, "unitCost", event.target.value)} trailingContent="R$" />
                <strong className="purchase-item-row__total">{formatInventoryCurrency(Number(item.quantity || 0) * Number(item.unitCost || 0))}</strong>
                <button className="btn btn--icon btn--ghost purchase-item-row__remove" type="button" onClick={() => update("items", values.items.filter((_, itemIndex) => itemIndex !== index))} disabled={values.items.length === 1} aria-label={`Remover item ${index + 1}`}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
          {errors.items && <small className="field__error" role="alert">{errors.items}</small>}
        </section>

        <section className="purchase-form__footer">
          <TextAreaField label="Observações" value={values.notes} onChange={(event) => update("notes", event.target.value)} rows={3} maxLength={1000} />
          <div className="purchase-totals">
            <div><span>Subtotal</span><strong>{formatInventoryCurrency(subtotal)}</strong></div>
            <TextField label="Frete" type="number" min={0} step="0.01" value={values.freight} onChange={(event) => update("freight", event.target.value)} error={errors.freight} trailingContent="R$" />
            <TextField label="Desconto" type="number" min={0} step="0.01" value={values.discount} onChange={(event) => update("discount", event.target.value)} error={errors.discount} trailingContent="R$" />
            <div className="purchase-totals__final"><span>Total</span><strong>{formatInventoryCurrency(total)}</strong></div>
          </div>
        </section>
      </form>
    </Modal>
  );
}
