import { supabase } from "../../../supabase/supabaseApi";
import type {
  Product,
  ProductFormValues,
  Purchase,
  PurchaseReceiptInput,
  PurchaseWriteInput,
  StockMovement,
  StockMovementInput,
  Supplier,
  SupplierFormValues,
} from "../types/inventory.types";

function inventoryError(message: string, cause: unknown) {
  const details =
    cause && typeof cause === "object" && "message" in cause
      ? String(cause.message)
      : "";
  if (details.includes("Estoque insuficiente")) {
    return new Error(details, { cause });
  }
  if (details.includes("produtos_codigo_empresa_unique")) {
    return new Error("Já existe um produto com esse código.", { cause });
  }
  if (details.includes("compras_itens_compra_produto_unique")) {
    return new Error("O mesmo produto não pode aparecer duas vezes na compra.", {
      cause,
    });
  }
  if (
    details.includes("permissão") ||
    details.includes("não pode") ||
    details.includes("inválid") ||
    details.includes("Informe") ||
    details.includes("Quantidade")
  ) {
    return new Error(details, { cause });
  }
  return new Error(message, { cause });
}

export async function listProducts(companyId: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id_empresa", companyId)
    .order("nome")
    .limit(1000);
  if (error) throw inventoryError("Não foi possível carregar os produtos.", error);
  return data ?? [];
}

export async function saveProduct(
  companyId: number,
  values: ProductFormValues,
  productId?: number,
) {
  const payload = {
    nome: values.name.trim(),
    codigo: values.code.trim() || null,
    descricao: values.description.trim() || null,
    finalidade: values.purpose,
    unidade_medida: values.unit.trim(),
    preco_venda: values.salePrice === "" ? null : Number(values.salePrice),
    custo_medio: values.averageCost === "" ? null : Number(values.averageCost),
    controla_estoque: values.tracksStock,
    estoque_minimo: values.tracksStock ? Number(values.minimumStock || 0) : 0,
  };
  const query = productId
    ? supabase
        .from("produtos")
        .update(payload)
        .eq("id_empresa", companyId)
        .eq("id", productId)
    : supabase.from("produtos").insert({ ...payload, id_empresa: companyId });
  const { data, error } = await query.select("*").single();
  if (error) {
    throw inventoryError(
      productId
        ? "Não foi possível atualizar o produto."
        : "Não foi possível cadastrar o produto.",
      error,
    );
  }
  return data;
}

export async function toggleProductStatus(
  companyId: number,
  productId: number,
  active: boolean,
) {
  const { data, error } = await supabase
    .from("produtos")
    .update({ ativo: active })
    .eq("id_empresa", companyId)
    .eq("id", productId)
    .select("*")
    .single();
  if (error) throw inventoryError("Não foi possível alterar o produto.", error);
  return data;
}

export async function listSuppliers(companyId: number): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("id_empresa", companyId)
    .order("nome")
    .limit(1000);
  if (error) {
    throw inventoryError("Não foi possível carregar os fornecedores.", error);
  }
  return data ?? [];
}

export async function saveSupplier(
  companyId: number,
  values: SupplierFormValues,
  supplierId?: number,
) {
  const payload = {
    nome: values.name.trim(),
    nome_fantasia: values.tradeName.trim() || null,
    documento: values.document.trim() || null,
    contato_responsavel: values.contactName.trim() || null,
    telefone: values.phone.trim() || null,
    email: values.email.trim().toLowerCase() || null,
    endereco: values.address.trim() || null,
    observacoes: values.notes.trim() || null,
  };
  const query = supplierId
    ? supabase
        .from("fornecedores")
        .update(payload)
        .eq("id_empresa", companyId)
        .eq("id", supplierId)
    : supabase.from("fornecedores").insert({ ...payload, id_empresa: companyId });
  const { data, error } = await query.select("*").single();
  if (error) {
    throw inventoryError(
      supplierId
        ? "Não foi possível atualizar o fornecedor."
        : "Não foi possível cadastrar o fornecedor.",
      error,
    );
  }
  return data;
}

export async function toggleSupplierStatus(
  companyId: number,
  supplierId: number,
  active: boolean,
) {
  const { data, error } = await supabase
    .from("fornecedores")
    .update({ ativo: active })
    .eq("id_empresa", companyId)
    .eq("id", supplierId)
    .select("*")
    .single();
  if (error) throw inventoryError("Não foi possível alterar o fornecedor.", error);
  return data;
}

export async function listPurchases(companyId: number): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from("compras")
    .select(
      "*, fornecedor:fornecedores!compras_fornecedor_empresa_fkey(id,nome,nome_fantasia), itens:compras_itens(*, produto:produtos!compras_itens_produto_empresa_fkey(id,nome,codigo,unidade_medida))",
    )
    .eq("id_empresa", companyId)
    .order("data_compra", { ascending: false })
    .order("id", { ascending: false })
    .limit(500);
  if (error) throw inventoryError("Não foi possível carregar as compras.", error);
  return (data ?? []) as unknown as Purchase[];
}

export async function savePurchase(input: PurchaseWriteInput) {
  const { data, error } = await supabase.rpc("salvar_compra", {
    p_compra_id: (input.purchaseId ?? null) as unknown as number,
    p_id_empresa: input.companyId,
    p_id_fornecedor: input.supplierId,
    p_data_compra: input.purchaseDate,
    p_numero_documento: input.documentNumber,
    p_previsao_entrega: input.expectedDate as unknown as string,
    p_frete: input.freight,
    p_desconto: input.discount,
    p_observacoes: input.notes,
    p_itens: input.items,
  });
  if (error) {
    throw inventoryError(
      input.purchaseId
        ? "Não foi possível atualizar a compra."
        : "Não foi possível registrar a compra.",
      error,
    );
  }
  return data;
}

export async function receivePurchase(input: PurchaseReceiptInput) {
  const { data, error } = await supabase.rpc("receber_compra", {
    p_compra_id: input.purchaseId,
    p_id_empresa: input.companyId,
    p_itens: input.items,
  });
  if (error) throw inventoryError("Não foi possível receber a compra.", error);
  return data;
}

export async function cancelPurchase(companyId: number, purchaseId: number) {
  const { data, error } = await supabase
    .from("compras")
    .update({ status: "cancelada" })
    .eq("id_empresa", companyId)
    .eq("id", purchaseId)
    .select("*")
    .single();
  if (error) throw inventoryError("Não foi possível cancelar a compra.", error);
  return data;
}

export async function listStockMovements(
  companyId: number,
): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("movimentos_estoque")
    .select(
      "*, produto:produtos!movimentos_estoque_produto_empresa_fkey(id,nome,codigo,unidade_medida)",
    )
    .eq("id_empresa", companyId)
    .order("movimentado_em", { ascending: false })
    .limit(500);
  if (error) {
    throw inventoryError("Não foi possível carregar as movimentações.", error);
  }
  return (data ?? []) as unknown as StockMovement[];
}

export async function createStockMovement(input: StockMovementInput) {
  const { data, error } = await supabase.rpc("movimentar_estoque_manual", {
    p_id_empresa: input.companyId,
    p_id_produto: input.productId,
    p_operacao: input.operation,
    p_quantidade: input.quantity,
    p_descricao: input.description,
  });
  if (error) {
    throw inventoryError("Não foi possível movimentar o estoque.", error);
  }
  return data;
}
