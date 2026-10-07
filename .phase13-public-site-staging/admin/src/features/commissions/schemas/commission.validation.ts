import type { CommissionAdjustmentInput, CommissionPaymentInput, RuleWriteInput } from "../types/commission.types";

export type CommissionValidationErrors = Record<string, string>;

export function validateCommissionRule(input: RuleWriteInput): CommissionValidationErrors {
  const errors: CommissionValidationErrors = {};
  if (input.calculationType === "percentual" && (!input.percentage || input.percentage <= 0 || input.percentage > 100)) errors.value = "Use um percentual maior que zero e de até 100%.";
  if (input.calculationType === "valor_fixo" && (!input.fixedValue || input.fixedValue <= 0)) errors.value = "Informe um valor fixo maior que zero.";
  if (!input.validFrom) errors.validFrom = "Informe o início da vigência.";
  if (input.validUntil && input.validUntil < input.validFrom) errors.validUntil = "O fim deve ser posterior ao início.";
  return errors;
}

export function validateCommissionAdjustment(input: CommissionAdjustmentInput): CommissionValidationErrors {
  const errors: CommissionValidationErrors = {};
  if (!input.employeeId) errors.employeeId = "Selecione o funcionário.";
  if (!input.description.trim()) errors.description = "Informe o motivo do ajuste.";
  if (input.amount <= 0) errors.amount = "Informe um valor maior que zero.";
  if (!input.competence) errors.competence = "Informe a competência.";
  return errors;
}

export function validateCommissionPayment(input: CommissionPaymentInput): CommissionValidationErrors {
  const errors: CommissionValidationErrors = {};
  if (!input.employeeId) errors.employeeId = "Selecione o funcionário.";
  if (!input.paymentMethodId) errors.paymentMethodId = "Selecione a forma de pagamento.";
  if (!input.paidAt) errors.paidAt = "Informe a data do pagamento.";
  if (!input.items.length) errors.items = "Selecione ao menos uma comissão.";
  if (input.items.some((item) => item.valor <= 0)) errors.items = "Revise os valores selecionados.";
  if (input.periodStart && input.periodEnd && input.periodEnd < input.periodStart) errors.periodEnd = "O fim deve ser posterior ao início.";
  return errors;
}
