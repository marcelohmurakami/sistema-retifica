import type {
  Product,
  ProductFormValues,
  Purchase,
  PurchaseFormValues,
  Supplier,
  SupplierFormValues,
} from "../types/inventory.types";

export const PRODUCT_PURPOSE_LABELS = {
  venda: "Venda",
  consumo_interno: "Consumo interno",
  ambos: "Venda e consumo",
} as const;

export const PURCHASE_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  pedido: "Aguardando",
  recebida_parcial: "Parcial",
  recebida: "Recebida",
  cancelada: "Cancelada",
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  entrada_compra: "Entrada por compra",
  entrada_devolucao: "Entrada por devolução",
  entrada_ajuste: "Entrada/Ajuste",
  saida_venda: "Saída por venda",
  saida_consumo: "Saída por consumo",
  saida_ajuste: "Saída/Ajuste",
};

export function formatInventoryCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

export function formatInventoryNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number(value ?? 0));
}

export function formatInventoryDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

export function formatInventoryDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function productStockState(product: Product) {
  if (!product.controla_estoque) return "untracked" as const;
  if (Number(product.estoque_atual) <= 0) return "out" as const;
  if (Number(product.estoque_atual) <= Number(product.estoque_minimo)) {
    return "low" as const;
  }
  return "ok" as const;
}

export function getEmptyProductFormValues(): ProductFormValues {
  return {
    name: "",
    code: "",
    description: "",
    purpose: "ambos",
    unit: "un",
    salePrice: "",
    averageCost: "",
    tracksStock: true,
    minimumStock: "0",
  };
}

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.nome,
    code: product.codigo ?? "",
    description: product.descricao ?? "",
    purpose: product.finalidade as ProductFormValues["purpose"],
    unit: product.unidade_medida,
    salePrice: product.preco_venda === null ? "" : String(product.preco_venda),
    averageCost: product.custo_medio === null ? "" : String(product.custo_medio),
    tracksStock: product.controla_estoque,
    minimumStock: String(product.estoque_minimo),
  };
}

export function getEmptySupplierFormValues(): SupplierFormValues {
  return {
    name: "",
    tradeName: "",
    document: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  };
}

export function supplierToFormValues(supplier: Supplier): SupplierFormValues {
  return {
    name: supplier.nome,
    tradeName: supplier.nome_fantasia ?? "",
    document: supplier.documento ?? "",
    contactName: supplier.contato_responsavel ?? "",
    phone: supplier.telefone ?? "",
    email: supplier.email ?? "",
    address: supplier.endereco ?? "",
    notes: supplier.observacoes ?? "",
  };
}

export function getEmptyPurchaseFormValues(date = new Date()): PurchaseFormValues {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
  return {
    supplierId: "",
    purchaseDate: localDate,
    documentNumber: "",
    expectedDate: "",
    freight: "0",
    discount: "0",
    notes: "",
    items: [{ productId: "", quantity: "1", unitCost: "0" }],
  };
}

export function purchaseToFormValues(purchase: Purchase): PurchaseFormValues {
  return {
    supplierId: String(purchase.id_fornecedor),
    purchaseDate: purchase.data_compra,
    documentNumber: purchase.numero_documento ?? "",
    expectedDate: purchase.previsao_entrega ?? "",
    freight: String(purchase.frete),
    discount: String(purchase.desconto),
    notes: purchase.observacoes ?? "",
    items: purchase.itens.map((item) => ({
      productId: String(item.id_produto),
      quantity: String(item.quantidade_comprada),
      unitCost: String(item.valor_unitario),
    })),
  };
}

export function purchaseItemsTotal(values: PurchaseFormValues) {
  return values.items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0) * Number(item.unitCost || 0),
    0,
  );
}

export function purchaseFinalTotal(values: PurchaseFormValues) {
  return Math.max(
    purchaseItemsTotal(values) +
      Number(values.freight || 0) -
      Number(values.discount || 0),
    0,
  );
}

export function isPurchaseReceivable(purchase: Purchase) {
  return ["pedido", "recebida_parcial"].includes(purchase.status);
}
