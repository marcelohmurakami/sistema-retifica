import { describe, expect, it } from "vitest";
import { validateCommissionAdjustment, validateCommissionPayment, validateCommissionRule } from "./commission.validation";

describe("commission validation", () => {
  it("rejects invalid percentage and period", () => {
    const errors = validateCommissionRule({ companyId: 1, employeeId: null, itemType: "todos", serviceId: null, productId: null, calculationType: "percentual", percentage: 101, fixedValue: null, base: "liquido_desconto", releaseMoment: "fechamento_comanda", deductPaymentFee: false, deductInputs: false, validFrom: "2026-08-20", validUntil: "2026-08-10", priority: 0, active: true });
    expect(errors.value).toBeTruthy();
    expect(errors.validUntil).toBeTruthy();
  });

  it("requires employee, reason and positive adjustment", () => {
    const errors = validateCommissionAdjustment({ companyId: 1, employeeId: 0, description: " ", amount: 0, competence: "" });
    expect(errors.employeeId).toBeTruthy();
    expect(errors.description).toBeTruthy();
    expect(errors.amount).toBeTruthy();
  });

  it("requires a payment method and at least one launch", () => {
    const errors = validateCommissionPayment({ companyId: 1, employeeId: 2, paymentMethodId: 0, cashSessionId: null, paidAt: "2026-08-26T10:00", periodStart: null, periodEnd: null, notes: "", items: [] });
    expect(errors.paymentMethodId).toBeTruthy();
    expect(errors.items).toBeTruthy();
  });
});
