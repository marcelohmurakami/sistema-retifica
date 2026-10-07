import type {
  ProductFormValues,
  PurchaseFormValues,
  SupplierFormValues,
} from "../types/inventory.types";
import { purchaseFinalTotal, purchaseItemsTotal } from "../utils/inventory.utils";

export type InventoryFormErrors = Record<string, string>;

export function validateProductForm(values: ProductFormValues) {
  const errors: InventoryFormErrors = {};
  if (values.name.trim().length < 2) errors.name = "Informe o nome do produto.";
  if (!values.unit.trim()) errors.unit = "Informe a unidade de medida.";
  if (values.salePrice && Number(values.salePrice) < 0) {
    errors.salePrice = "O preço não pode ser negativo.";
  }
  if (values.averageCost && Number(values.averageCost) < 0) {
    errors.averageCost = "O custo não pode ser negativo.";
  }
  if (values.tracksStock && Number(values.minimumStock || 0) < 0) {
    errors.minimumStock = "O estoque mínimo não pode ser negativo.";
  }
  return errors;
}

export function validateSupplierForm(values: SupplierFormValues) {
  const errors: InventoryFormErrors = {};
  if (values.name.trim().length < 2) {
    errors.name = "Informe a razão social ou o nome do fornecedor.";
  }
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Informe um e-mail válido.";
  }
  return errors;
}

export function validatePurchaseForm(values: PurchaseFormValues) {
  const errors: InventoryFormErrors = {};
  if (!values.supplierId) errors.supplierId = "Selecione o fornecedor.";
  if (!values.purchaseDate) errors.purchaseDate = "Informe a data da compra.";
  if (!values.items.length) errors.items = "Adicione pelo menos um produto.";
  const productIds = values.items.map((item) => item.productId).filter(Boolean);
  if (values.items.some((item) => !item.productId)) {
    errors.items = "Selecione o produto em todos os itens.";
  } else if (new Set(productIds).size !== productIds.length) {
    errors.items = "O mesmo produto não pode aparecer duas vezes na compra.";
  } else if (values.items.some((item) => Number(item.quantity) <= 0)) {
    errors.items = "As quantidades devem ser maiores que zero.";
  } else if (values.items.some((item) => Number(item.unitCost) < 0)) {
    errors.items = "Os custos não podem ser negativos.";
  }
  if (Number(values.freight || 0) < 0) errors.freight = "O frete não pode ser negativo.";
  if (Number(values.discount || 0) < 0) errors.discount = "O desconto não pode ser negativo.";
  if (Number(values.discount || 0) > purchaseItemsTotal(values) + Number(values.freight || 0)) {
    errors.discount = "O desconto não pode superar o subtotal com frete.";
  }
  if (!Number.isFinite(purchaseFinalTotal(values))) {
    errors.items = "Revise os valores da compra.";
  }
  return errors;
}

export function hasInventoryFormErrors(errors: InventoryFormErrors) {
  return Object.keys(errors).length > 0;
}
