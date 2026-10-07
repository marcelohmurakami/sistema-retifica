import type { AccountWriteInput, CashCloseInput, CashMovementInput, CashOpenInput, PaymentWriteInput } from "../types/finance.types";

export type ValidationErrors = Record<string, string>;

export function validateAccount(input: AccountWriteInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.description.trim()) errors.description = "Informe a descrição.";
  if (input.total <= 0) errors.total = "Informe um valor maior que zero.";
  if (input.installmentCount < 1 || input.installmentCount > 120) errors.installmentCount = "Use entre 1 e 120 parcelas.";
  if (input.total < input.installmentCount * 0.01) errors.installmentCount = "O valor é insuficiente para essa quantidade de parcelas.";
  if (!input.firstDueDate) errors.firstDueDate = "Informe o primeiro vencimento.";
  return errors;
}

export function validatePayment(input: PaymentWriteInput, available: number): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.paymentMethodId) errors.paymentMethodId = "Selecione a forma de pagamento.";
  if (input.amount <= 0) errors.amount = "Informe um valor maior que zero.";
  if (input.amount > available) errors.amount = "O valor ultrapassa o saldo da parcela.";
  if (!input.paidAt) errors.paidAt = "Informe a data do pagamento.";
  return errors;
}

export function validateCashOpen(input: CashOpenInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.cashDrawerId) errors.cashDrawerId = "Selecione o caixa.";
  if (input.openingBalance < 0) errors.openingBalance = "O saldo não pode ser negativo.";
  return errors;
}

export function validateCashClose(input: CashCloseInput): ValidationErrors {
  return input.countedBalance < 0 ? { countedBalance: "O saldo não pode ser negativo." } : {};
}

export function validateCashMovement(input: CashMovementInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (input.amount <= 0) errors.amount = "Informe um valor maior que zero.";
  if (!input.description.trim()) errors.description = "Informe a finalidade do movimento.";
  return errors;
}

