import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "../../../components_shared";
import {
  cancelPurchase,
  createStockMovement,
  listProducts,
  listPurchases,
  listStockMovements,
  listSuppliers,
  receivePurchase,
  saveProduct,
  savePurchase,
  saveSupplier,
  toggleProductStatus,
  toggleSupplierStatus,
} from "../api/inventory.api";
import type {
  ProductFormValues,
  PurchaseReceiptInput,
  PurchaseWriteInput,
  StockMovementInput,
  SupplierFormValues,
} from "../types/inventory.types";
import { inventoryKeys } from "./inventory.keys";

export function useProducts(companyId: number) {
  return useQuery({
    queryKey: inventoryKeys.products(companyId),
    queryFn: () => listProducts(companyId),
    enabled: companyId > 0,
  });
}

export function useSuppliers(companyId: number) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(companyId),
    queryFn: () => listSuppliers(companyId),
    enabled: companyId > 0,
  });
}

export function usePurchases(companyId: number) {
  return useQuery({
    queryKey: inventoryKeys.purchases(companyId),
    queryFn: () => listPurchases(companyId),
    enabled: companyId > 0,
  });
}

export function useStockMovements(companyId: number) {
  return useQuery({
    queryKey: inventoryKeys.movements(companyId),
    queryFn: () => listStockMovements(companyId),
    enabled: companyId > 0,
  });
}

function useInvalidateInventory(companyId: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: inventoryKeys.all(companyId) });
}

function showInventoryError(error: unknown) {
  toast.error(
    getErrorMessage(error, "Não foi possível concluir a operação."),
  );
}

export function useSaveProduct(companyId: number) {
  const invalidate = useInvalidateInventory(companyId);
  return useMutation({
    mutationFn: ({ values, productId }: { values: ProductFormValues; productId?: number }) =>
      saveProduct(companyId, values, productId),
    onSuccess: async (_, variables) => {
      await invalidate();
      toast.success(
        variables.productId
          ? "Produto atualizado com sucesso."
          : "Produto cadastrado com sucesso.",
      );
    },
    onError: showInventoryError,
  });
}

export function useToggleProductStatus(companyId: number) {
  const invalidate = useInvalidateInventory(companyId);
  return useMutation({
    mutationFn: ({ productId, active }: { productId: number; active: boolean }) =>
      toggleProductStatus(companyId, productId, active),
    onSuccess: async (product) => {
      await invalidate();
      toast.success(product.ativo ? "Produto reativado." : "Produto arquivado.");
    },
    onError: showInventoryError,
  });
}

export function useSaveSupplier(companyId: number) {
  const invalidate = useInvalidateInventory(companyId);
  return useMutation({
    mutationFn: ({ values, supplierId }: { values: SupplierFormValues; supplierId?: number }) =>
      saveSupplier(companyId, values, supplierId),
    onSuccess: async (_, variables) => {
      await invalidate();
      toast.success(
        variables.supplierId
          ? "Fornecedor atualizado com sucesso."
          : "Fornecedor cadastrado com sucesso.",
      );
    },
    onError: showInventoryError,
  });
}

export function useToggleSupplierStatus(companyId: number) {
  const invalidate = useInvalidateInventory(companyId);
  return useMutation({
    mutationFn: ({ supplierId, active }: { supplierId: number; active: boolean }) =>
      toggleSupplierStatus(companyId, supplierId, active),
    onSuccess: async (supplier) => {
      await invalidate();
      toast.success(
        supplier.ativo ? "Fornecedor reativado." : "Fornecedor arquivado.",
      );
    },
    onError: showInventoryError,
  });
}

export function useSavePurchase(companyId: number) {
  const invalidate = useInvalidateInventory(companyId);
  return useMutation({
    mutationFn: (input: PurchaseWriteInput) => savePurchase(input),
    onSuccess: async (_, input) => {
      await invalidate();
      toast.success(
        input.purchaseId
          ? "Compra atualizada com sucesso."
          : "Compra registrada com sucesso.",
      );
    },
    onError: showInventoryError,
  });
}

export function useReceivePurchase(companyId: number) {
  const invalidate = useInvalidateInventory(companyId);
  return useMutation({
    mutationFn: (input: PurchaseReceiptInput) => receivePurchase(input),
    onSuccess: async () => {
      await invalidate();
      toast.success("Recebimento registrado e estoque atualizado.");
    },
    onError: showInventoryError,
  });
}

export function useCancelPurchase(companyId: number) {
  const invalidate = useInvalidateInventory(companyId);
  return useMutation({
    mutationFn: (purchaseId: number) => cancelPurchase(companyId, purchaseId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Compra cancelada.");
    },
    onError: showInventoryError,
  });
}

export function useCreateStockMovement(companyId: number) {
  const invalidate = useInvalidateInventory(companyId);
  return useMutation({
    mutationFn: (input: StockMovementInput) => createStockMovement(input),
    onSuccess: async () => {
      await invalidate();
      toast.success("Movimentação registrada e saldo atualizado.");
    },
    onError: showInventoryError,
  });
}
