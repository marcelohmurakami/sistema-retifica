import { describe, expect, it } from "vitest";
import type { Command } from "../types/commercial.types";
import { commandPaymentDisplay } from "./commercial.utils";

function command(overrides: Partial<Command>): Command {
  return {
    status: "fechada",
    valor_total: 500,
    condicao_pagamento: "a_receber",
    conta: null,
    ...overrides,
  } as Command;
}

describe("situação financeira da comanda", () => {
  it("diferencia uma condição futura de um pagamento realizado", () => {
    const payment = commandPaymentDisplay(command({ status: "aberta", condicao_pagamento: "pago" }));
    expect(payment.status).toBe("receber_no_fechamento");
    expect(payment.paid).toBe(0);
  });

  it("calcula o valor recebido e o saldo de uma conta parcial", () => {
    const payment = commandPaymentDisplay(command({ conta: { id: 7, status: "parcial", valor_total: 500, valor_pago: 150, parcelas: [{ id: 9, numero_parcela: 1, data_vencimento: "2026-09-10", valor_parcela: 500, valor_pago: 150, status: "parcial" }] } }));
    expect(payment.status).toBe("parcial");
    expect(payment.paid).toBe(150);
    expect(payment.balance).toBe(350);
    expect(payment.dueDate).toBe("2026-09-10");
  });

  it("mostra uma conta quitada como paga", () => {
    const payment = commandPaymentDisplay(command({ condicao_pagamento: "pago", conta: { id: 8, status: "paga", valor_total: 500, valor_pago: 500, parcelas: [] } }));
    expect(payment.status).toBe("pago");
    expect(payment.balance).toBe(0);
  });
});
