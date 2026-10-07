import type { Tables } from "../../../types/database.types";

export type Product = Tables<"produtos">;
export type Supplier = Tables<"fornecedores">;
export type PurchaseItem = Tables<"compras_itens"> & {
  produto: Pick<Product, "id" | "nome" | "codigo" | "unidade_medida"> | null;
};
export type Purchase = Tables<"compras"> & {
  fornecedor: Pick<Supplier, "id" | "nome" | "nome_fantasia"> | null;
  itens: PurchaseItem[];
};
export type StockMovement = Tables<"movimentos_estoque"> & {
  produto: Pick<Product, "id" | "nome" | "codigo" | "unidade_medida"> | null;
};

export type ProductFormValues = {
  name: string;
  code: string;
  description: string;
  purpose: "venda" | "consumo_interno" | "ambos";
  unit: string;
  salePrice: string;
  averageCost: string;
  tracksStock: boolean;
  minimumStock: string;
};

export type SupplierFormValues = {
  name: string;
  tradeName: string;
  document: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export type PurchaseFormItem = {
  productId: string;
  quantity: string;
  unitCost: string;
};

export type PurchaseFormValues = {
  supplierId: string;
  purchaseDate: string;
  documentNumber: string;
  expectedDate: string;
  freight: string;
  discount: string;
  notes: string;
  items: PurchaseFormItem[];
};

export type PurchaseWriteInput = {
  purchaseId?: number;
  companyId: number;
  supplierId: number;
  purchaseDate: string;
  documentNumber: string;
  expectedDate: string | null;
  freight: number;
  discount: number;
  notes: string;
  items: Array<{
    id_produto: number;
    quantidade: number;
    valor_unitario: number;
  }>;
};

export type PurchaseReceiptInput = {
  companyId: number;
  purchaseId: number;
  items: Array<{ id_item: number; quantidade: number }>;
};

export type StockMovementInput = {
  companyId: number;
  productId: number;
  operation: "entrada" | "saida" | "ajuste";
  quantity: number;
  description: string;
};

export type InventoryTab = "overview" | "movements" | "purchases";
