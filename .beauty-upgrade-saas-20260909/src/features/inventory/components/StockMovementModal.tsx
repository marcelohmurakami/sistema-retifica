import { useId, useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import type { Product, StockMovementInput } from "../types/inventory.types";
import { formatInventoryNumber } from "../utils/inventory.utils";

type Props = {
  companyId: number;
  products: Product[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: StockMovementInput) => Promise<void>;
};

export function StockMovementModal({ companyId, products, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const [productId, setProductId] = useState("");
  const [operation, setOperation] = useState<StockMovementInput["operation"]>("entrada");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === Number(productId)),
    [productId, products],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productId || !quantity || Number(quantity) < 0 || (operation !== "ajuste" && Number(quantity) <= 0)) {
      setError(operation === "ajuste" ? "Informe o produto e o novo saldo." : "Informe o produto e uma quantidade maior que zero.");
      return;
    }
    try {
      await onSubmit({ companyId, productId: Number(productId), operation, quantity: Number(quantity), description: description.trim() });
    } catch {
      return;
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nova movimentação"
      description="Registre entradas avulsas, consumo ou correções do inventário físico."
      size="md"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting && <span className="btn-spinner" />}
            {isSubmitting ? "Registrando..." : "Confirmar movimentação"}
          </button>
        </FormActions>
      }
    >
      <form id={formId} className="inventory-movement-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <SelectField
          label="Produto"
          value={productId}
          onChange={(event) => { setProductId(event.target.value); setError(""); }}
          placeholder="Selecione um produto"
          options={products.filter((product) => product.ativo && product.controla_estoque).map((product) => ({ value: String(product.id), label: `${product.nome} · saldo ${formatInventoryNumber(product.estoque_atual)} ${product.unidade_medida}` }))}
          required
        />
        <SelectField
          label="Operação"
          value={operation}
          onChange={(event) => { setOperation(event.target.value as StockMovementInput["operation"]); setQuantity(""); setError(""); }}
          options={[
            { value: "entrada", label: "Entrada manual" },
            { value: "saida", label: "Saída / consumo" },
            { value: "ajuste", label: "Ajustar saldo físico" },
          ]}
        />
        <TextField
          label={operation === "ajuste" ? "Novo saldo" : "Quantidade"}
          type="number"
          min={operation === "ajuste" ? 0 : 0.001}
          step="0.001"
          value={quantity}
          onChange={(event) => { setQuantity(event.target.value); setError(""); }}
          error={error}
          hint={operation === "ajuste" && selectedProduct ? `Saldo atual: ${formatInventoryNumber(selectedProduct.estoque_atual)} ${selectedProduct.unidade_medida}` : undefined}
          required
        />
        <TextAreaField label="Motivo / observação" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={500} placeholder="Ex.: contagem física, consumo interno ou devolução" />
      </form>
    </Modal>
  );
}
