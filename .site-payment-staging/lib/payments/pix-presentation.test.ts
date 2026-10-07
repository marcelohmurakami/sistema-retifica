import { describe, expect, it } from "vitest";
import type { PublicPixPayment } from "./types";
import {
  isPixExpired,
  isPixProviderTerminal,
  pixTerminalErrorMessage,
  pixStatusErrorMessage,
} from "./pix-presentation";

function payment(overrides: Partial<PublicPixPayment> = {}): PublicPixPayment {
  return {
    bookingId: 10,
    amount: 1,
    orderId: "order-10",
    status: "created",
    statusDetail: "created",
    expiresAt: "2026-09-08T17:30:00.000Z",
    ticketUrl: null,
    pixCopyPaste: "pix",
    qrCodeBase64: null,
    paid: false,
    expired: false,
    ...overrides,
  };
}

describe("estado visual do Pix", () => {
  it("vence exatamente no horário informado pelo servidor", () => {
    expect(isPixExpired(payment(), Date.parse("2026-09-08T17:29:59.999Z"))).toBe(false);
    expect(isPixExpired(payment(), Date.parse("2026-09-08T17:30:00.000Z"))).toBe(true);
  });

  it.each(["expired", "canceled", "cancelled"])(
    "trata o status de vencimento %s como expirado",
    (status) => expect(isPixExpired(payment({ status }), 0)).toBe(true),
  );

  it.each(["failed", "refunded"])("não confunde o estado %s com vencimento", (status) => {
    expect(isPixExpired(payment({ status }), 0)).toBe(false);
    expect(pixTerminalErrorMessage(payment({ status }))).not.toBeNull();
  });

  it("respeita a expiração autoritativa mesmo com relógio local anterior", () => {
    expect(isPixExpired(payment({ expired: true }), 0)).toBe(true);
  });

  it("não encerra a consulta ao provedor apenas pelo relógio local", () => {
    expect(isPixProviderTerminal(payment())).toBe(false);
    expect(isPixProviderTerminal(payment({ expired: true }))).toBe(false);
    expect(isPixProviderTerminal(payment({ status: "expired" }))).toBe(true);
  });

  it("transforma falhas de atualização em mensagens compreensíveis", () => {
    expect(pixStatusErrorMessage(new Error("Falha de rede"))).toContain("Falha de rede");
    expect(pixStatusErrorMessage(null)).toMatch(/conexão/i);
  });
});
