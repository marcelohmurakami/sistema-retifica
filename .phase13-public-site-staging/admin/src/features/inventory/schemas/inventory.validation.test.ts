import { describe, expect, it } from "vitest";
import {
  validateProductForm,
  validatePurchaseForm,
  validateSupplierForm,
} from "./inventory.validation";
import {
  getEmptyProductFormValues,
  getEmptyPurchaseFormValues,
  getEmptySupplierFormValues,
} from "../utils/inventory.utils";

describe("validação de produtos, fornecedores e compras", () => {
  it("exige os dados principais do produto", () => {
    const values = getEmptyProductFormValues();
    expect(validateProductForm(values).name).toBeTruthy();
    expect(validateProductForm({ ...values, name: "Shampoo" })).toEqual({});
  });

  it("valida o e-mail opcional do fornecedor", () => {
    const values = { ...getEmptySupplierFormValues(), name: "Distribuidora", email: "invalido" };
    expect(validateSupplierForm(values).email).toBeTruthy();
    expect(validateSupplierForm({ ...values, email: "compras@empresa.com" })).toEqual({});
  });

  it("não permite produtos repetidos ou desconto maior que a compra", () => {
    const values = {
      ...getEmptyPurchaseFormValues(new Date("2026-08-25T12:00:00")),
      supplierId: "1",
      discount: "100",
      items: [
        { productId: "2", quantity: "1", unitCost: "20" },
        { productId: "2", quantity: "1", unitCost: "20" },
      ],
    };
    const errors = validatePurchaseForm(values);
    expect(errors.items).toContain("mesmo produto");
    expect(errors.discount).toBeTruthy();
  });
});
