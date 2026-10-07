import { describe, expect, it } from "vitest";
import {
  assertOrderMatchesPayment,
  isPaidOrder,
  isRetryableMercadoPagoStatus,
  orderApprovedAt,
  orderPaidAmount,
  parseMercadoPagoOrder,
  type MercadoPagoOrder,
} from "./mercado-pago-core";

function order(overrides: Partial<MercadoPagoOrder> = {}): MercadoPagoOrder {
  return {
    id: "order-123",
    status: "processed",
    status_detail: "accredited",
    external_reference: "347",
    transactions: {
      payments: [
        {
          id: "payment-123",
          status: "processed",
          status_detail: "accredited",
          amount: "1.00",
          paid_amount: "1.00",
          date_approved: "2026-09-04T12:30:00.000-03:00",
          payment_method: { id: "pix", qr_code: "pix-code" },
        },
      ],
    },
    ...overrides,
  };
}

describe("parseMercadoPagoOrder", () => {
  it("aceita e normaliza uma resposta válida", () => {
    const parsed = parseMercadoPagoOrder(order());
    expect(parsed.id).toBe("order-123");
    expect(parsed.transactions?.payments?.[0].payment_method?.qr_code).toBe("pix-code");
  });

  it.each([null, {}, { id: "1" }, { id: 1, status: "created", status_detail: "created" }])(
    "rejeita payload inválido: %j",
    (payload) => expect(() => parseMercadoPagoOrder(payload)).toThrow(),
  );
});

describe("confirmação financeira", () => {
  it("só considera pago quando order e transaction estão accredited", () => {
    expect(isPaidOrder(order())).toBe(true);
    expect(
      isPaidOrder(
        order({
          transactions: {
            payments: [
              {
                status: "processing",
                status_detail: "in_process",
                amount: "1.00",
              },
            ],
          },
        }),
      ),
    ).toBe(false);
    expect(isPaidOrder(order({ status: "processing", status_detail: "in_process" }))).toBe(false);
  });

  it("usa paid_amount e conserva a data real de aprovação", () => {
    expect(orderPaidAmount(order())).toBe(1);
    expect(orderApprovedAt(order())).toBe("2026-09-04T12:30:00.000-03:00");
  });

  it("não inventa data quando o provedor não informa ou envia data inválida", () => {
    expect(orderApprovedAt(order({ transactions: { payments: [{ date_approved: "inválida" }] } }))).toBeNull();
    expect(orderApprovedAt(order({ transactions: { payments: [{}] } }))).toBeNull();
  });
});

describe("vínculo entre cobrança e reserva", () => {
  it("aceita referência e valor esperados", () => {
    expect(() => assertOrderMatchesPayment(order(), { bookingId: 347, amount: 1 })).not.toThrow();
  });

  it("rejeita referência de outro agendamento", () => {
    expect(() => assertOrderMatchesPayment(order(), { bookingId: 999, amount: 1 })).toThrow(
      /referência/i,
    );
  });

  it.each([0, 0.99, 1.01, Number.NaN])("rejeita valor divergente: %s", (amount) => {
    expect(() => assertOrderMatchesPayment(order(), { bookingId: 347, amount })).toThrow(
      /valor/i,
    );
  });
});

describe("retentativas", () => {
  it.each([408, 409, 425, 429, 500, 503])("repete falhas transitórias HTTP %s", (status) => {
    expect(isRetryableMercadoPagoStatus(status)).toBe(true);
  });

  it.each([400, 401, 403, 404, 422])("não repete erro definitivo HTTP %s", (status) => {
    expect(isRetryableMercadoPagoStatus(status)).toBe(false);
  });
});
