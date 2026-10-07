import type { CommandFormValues, QuoteFormValues } from "../types/commercial.types";
import { commercialItemsDiscount, commercialItemsSubtotal } from "../utils/commercial.utils";

export type CommercialFormErrors = Record<string, string>;

function validateDocument(values: Pick<QuoteFormValues, "clientId" | "discount" | "surcharge" | "items">, requireEmployees: boolean) {
  const errors: CommercialFormErrors = {};
  if (!values.clientId) errors.clientId = "Selecione o cliente.";
  if (!values.items.length) errors.items = "Adicione pelo menos um item.";
  const invalidItem = values.items.find((item) => {
    if (!item.type || Number(item.quantity) <= 0 || Number(item.unitPrice) < 0 || Number(item.discount || 0) < 0) return true;
    if (Number(item.discount || 0) > Number(item.quantity) * Number(item.unitPrice)) return true;
    if (item.type === "outro") return item.description.trim().length < 2;
    if (!item.catalogId) return true;
    return requireEmployees && item.type === "servico" && !item.employeeId;
  });
  if (invalidItem) errors.items = requireEmployees ? "Revise catálogo, profissional, quantidades, preços e descontos dos itens." : "Revise catálogo, quantidades, preços e descontos dos itens.";
  if (Number(values.discount || 0) < 0) errors.discount = "O desconto não pode ser negativo.";
  if (Number(values.surcharge || 0) < 0) errors.surcharge = "O acréscimo não pode ser negativo.";
  if (commercialItemsDiscount(values.items) + Number(values.discount || 0) > commercialItemsSubtotal(values.items) + Number(values.surcharge || 0)) errors.discount = "Os descontos não podem superar o valor dos itens com acréscimos.";
  return errors;
}

export function validateQuoteForm(values: QuoteFormValues) {
  const errors = validateDocument(values, false);
  if (values.validity && values.validity < new Date().toISOString().slice(0, 10)) errors.validity = "A validade não pode estar no passado.";
  return errors;
}

export function validateCommandForm(values: CommandFormValues) {
  return validateDocument(values, true);
}

export function hasCommercialFormErrors(errors: CommercialFormErrors) {
  return Object.keys(errors).length > 0;
}
