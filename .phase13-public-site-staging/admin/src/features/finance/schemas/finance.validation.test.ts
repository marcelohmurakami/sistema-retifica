import { describe, expect, it } from "vitest";
import { validateAccount, validateCashClose, validateCashMovement, validateCashOpen, validatePayment } from "./finance.validation";

describe("finance validation", () => {
  it("rejects an account without description or positive total", () => {
    const errors = validateAccount({ accountId: undefined, companyId: 10, type: "receber", categoryId: null, clientId: null, supplierId: null, description: "", document: "", issueDate: "2026-08-26", competence: null, total: 0, installmentCount: 1, firstDueDate: "", notes: "" });
    expect(errors.description).toBeTruthy();
    expect(errors.total).toBeTruthy();
    expect(errors.firstDueDate).toBeTruthy();
  });

  it("rejects payment above installment balance", () => {
    const errors = validatePayment({ companyId: 10, type: "entrada", paymentMethodId: 1, cashSessionId: null, paidAt: "2026-08-26T10:00", amount: 101, reference: "", notes: "", allocations: [] }, 100);
    expect(errors.amount).toContain("ultrapassa");
  });

  it("requires amount and description for a cash movement", () => {
    const errors = validateCashMovement({ companyId: 10, sessionId: 1, type: "sangria", amount: 0, description: " " });
    expect(errors.amount).toBeTruthy();
    expect(errors.description).toBeTruthy();
  });

  it("rejects opening a cash session without a drawer or with negative balance", () => {
    const errors = validateCashOpen({ companyId: 10, cashDrawerId: 0, openingBalance: -1, notes: "" });
    expect(errors.cashDrawerId).toBeTruthy();
    expect(errors.openingBalance).toBeTruthy();
  });

  it("rejects a negative counted balance when closing cash", () => {
    expect(validateCashClose({ companyId: 10, sessionId: 1, countedBalance: -0.01, notes: "" }).countedBalance).toBeTruthy();
  });
});
