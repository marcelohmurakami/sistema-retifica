// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MercadoPagoPix } from "./mercado-pago-pix";
import type { PublicPixPayment } from "@/lib/payments/types";

function payment(overrides: Partial<PublicPixPayment> = {}): PublicPixPayment {
  return {
    bookingId: 42,
    amount: 1,
    orderId: "order-42",
    status: "created",
    statusDetail: "created",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ticketUrl: null,
    pixCopyPaste: "000201-pix-test",
    qrCodeBase64: null,
    paid: false,
    expired: false,
    ...overrides,
  };
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MercadoPagoPix", () => {
  it("não cria cobrança antes da ação quando autoStart está desligado", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<MercadoPagoPix autoStart={false} bookingId={42} />);

    expect(screen.getByRole("button", { name: /pagar sinal com pix/i })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mostra o motivo retornado pela API quando a geração falha", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({ error: "Pagamento temporariamente indisponível." }, 503),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<MercadoPagoPix />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Pagamento temporariamente indisponível.",
    );
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeEnabled();
  });

  it("exibe expiração, avisa o pai e não afirma que o horário já foi liberado", async () => {
    const onExpired = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(
      response({ payment: payment({ expiresAt: new Date(Date.now() - 1000).toISOString() }) }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<MercadoPagoPix onExpired={onExpired} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/prazo deste pix terminou/i);
    expect(screen.queryByText(/horário foi liberado/i)).not.toBeInTheDocument();
    expect(screen.getByText(/confirmando o vencimento com o Mercado Pago/i)).toBeVisible();
    await waitFor(() => expect(onExpired).toHaveBeenCalledTimes(1));
  });

  it("usa GET, e não cria outra cobrança, ao atualizar um Pix expirado", async () => {
    const expired = payment({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ payment: expired }))
      .mockResolvedValueOnce(response({ payment: expired }));
    vi.stubGlobal("fetch", fetchMock);
    render(<MercadoPagoPix />);

    fireEvent.click(await screen.findByRole("button", { name: /atualizar situação/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "GET" });
  });

  it("mostra falha de atualização mesmo quando o QR Code já está na tela", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ payment: payment() }))
      .mockResolvedValueOnce(response({ error: "Falha de rede durante a consulta." }, 503));
    vi.stubGlobal("fetch", fetchMock);
    render(<MercadoPagoPix />);

    expect(await screen.findByText(/pague o sinal/i)).toBeVisible();
    await waitFor(
      () => expect(screen.getByRole("alert")).toHaveTextContent(/falha de rede durante a consulta/i),
      { timeout: 6500 },
    );
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeEnabled();
  }, 8000);

  it("notifica pagamento confirmado somente uma vez", async () => {
    const onPaid = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        payment: payment({
          status: "processed",
          statusDetail: "accredited",
          paid: true,
        }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<MercadoPagoPix onPaid={onPaid} />);

    expect(await screen.findByText(/sinal recebido/i)).toBeVisible();
    await waitFor(() => expect(onPaid).toHaveBeenCalledTimes(1));
    view.rerender(<MercadoPagoPix onPaid={onPaid} compact />);
    expect(onPaid).toHaveBeenCalledTimes(1);
  });

  it("distingue falha definitiva de vencimento", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({ payment: payment({ status: "failed", statusDetail: "rejected" }) }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<MercadoPagoPix />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/não conseguiu concluir este Pix/i);
    expect(alert).not.toHaveTextContent(/prazo deste Pix terminou/i);
  });
});
