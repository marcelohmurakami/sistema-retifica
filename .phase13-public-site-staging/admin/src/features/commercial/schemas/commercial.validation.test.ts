import { describe, expect, it } from "vitest";
import { validateCommandForm, validateQuoteForm } from "./commercial.validation";
import { createCommercialItem, getEmptyCommandFormValues, getEmptyQuoteFormValues } from "../utils/commercial.utils";

describe("validação comercial", () => {
  it("exige cliente e item catalogado no orçamento", () => {
    const errors = validateQuoteForm(getEmptyQuoteFormValues());
    expect(errors.clientId).toBeTruthy();
    expect(errors.items).toBeTruthy();
  });

  it("aceita item avulso válido", () => {
    const values = getEmptyQuoteFormValues();
    values.clientId = "1";
    values.items = [{ ...createCommercialItem("outro"), description: "Taxa especial", unitPrice: "25" }];
    expect(validateQuoteForm(values)).toEqual({});
  });

  it("exige profissional nos serviços da comanda", () => {
    const values = getEmptyCommandFormValues();
    values.clientId = "1";
    values.items = [{ ...createCommercialItem("servico"), catalogId: "2", description: "Corte", unitPrice: "50" }];
    expect(validateCommandForm(values).items).toBeTruthy();
  });

  it("inicia a comanda para receber depois", () => {
    expect(getEmptyCommandFormValues().paymentCondition).toBe("a_receber");
  });

  it("bloqueia desconto maior que o item", () => {
    const values = getEmptyQuoteFormValues();
    values.clientId = "1";
    values.items = [{ ...createCommercialItem("outro"), description: "Item", unitPrice: "10", discount: "11" }];
    expect(validateQuoteForm(values).items).toBeTruthy();
  });
});
