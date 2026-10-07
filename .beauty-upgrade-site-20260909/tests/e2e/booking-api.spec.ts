import { createHmac, randomUUID } from "node:crypto";
import { request as playwrightRequest, expect, test, type APIRequestContext } from "@playwright/test";
import { dateIsoInTimeZone } from "../../lib/date-time";
import { admin, getCatalog } from "./support";

type Slot = {
  id_funcionario: number;
  inicio: string;
  horario: string;
};

const baseURL = "http://localhost:3000";

async function findSlot(
  context: APIRequestContext,
  serviceId: number,
  timeZone: string,
  options: { startOffset?: number; exclude?: string } = {},
) {
  for (let offset = options.startOffset ?? 3; offset <= 35; offset += 1) {
    const date = dateIsoInTimeZone(timeZone, offset);
    let response: import("@playwright/test").APIResponse | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await context.get(
          `/api/site/availability?date=${date}&serviceId=${serviceId}`,
        );
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
    if (!response) throw new Error("A API de disponibilidade não respondeu.");
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as { slots: Slot[] };
    const slot = body.slots.find((item) => item.inicio !== options.exclude);
    if (slot) return slot;
  }
  throw new Error(`Nenhum horário disponível para o serviço ${serviceId}.`);
}

async function createBooking(
  context: APIRequestContext,
  serviceId: number,
  slot: Slot,
  suffix: string,
) {
  const phoneSuffix = Array.from(suffix).reduce(
    (total, character) => (total + character.charCodeAt(0)) % 10_000,
    0,
  );
  return context.post("/api/site/bookings", {
    data: {
      name: `Cliente Homologação ${suffix}`,
      phone: `(11) 98888-${String(phoneSuffix).padStart(4, "0")}`,
      email: `codex.booking.${suffix}.${Date.now()}@example.com`,
      serviceId,
      professionalId: slot.id_funcionario,
      start: slot.inicio,
      reminderWhatsapp: true,
      reminderEmail: true,
      idempotencyKey: randomUUID(),
    },
  });
}

async function cancelCurrentBooking(context: APIRequestContext) {
  return context.patch("/api/site/my-booking", {
    data: { action: "cancelar", reason: "Limpeza da homologação automatizada." },
  });
}

test.describe.configure({ mode: "serial" });

test("agendamento sem sinal confirma uma vez, reage a replay, remarca e cancela", async () => {
  const { catalog } = await getCatalog();
  const service = catalog.servicos.find((item) => !item.exige_sinal);
  expect(service, "O catálogo precisa ter um serviço sem sinal.").toBeTruthy();
  const context = await playwrightRequest.newContext({ baseURL });
  try {
    const firstSlot = await findSlot(context, service!.id, catalog.empresa.fuso_horario, {
      startOffset: 4,
    });
    const created = await createBooking(context, service!.id, firstSlot, "sem-sinal");
    expect(created.status(), await created.text()).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.booking.sinal_status).not.toBe("pendente");

    const confirmed = await context.patch("/api/site/my-booking", {
      data: { action: "confirmar" },
    });
    expect(confirmed.ok(), await confirmed.text()).toBeTruthy();
    const confirmedAt = (await confirmed.json()).booking.confirmado_em;

    const replay = await context.patch("/api/site/my-booking", {
      data: { action: "confirmar" },
    });
    expect(replay.ok(), await replay.text()).toBeTruthy();
    expect((await replay.json()).booking.confirmado_em).toBe(confirmedAt);

    const nextSlot = await findSlot(context, service!.id, catalog.empresa.fuso_horario, {
      startOffset: 9,
      exclude: firstSlot.inicio,
    });
    const rescheduled = await context.patch("/api/site/my-booking", {
      data: {
        action: "reagendar",
        professionalId: nextSlot.id_funcionario,
        start: nextSlot.inicio,
      },
    });
    expect(rescheduled.ok(), await rescheduled.text()).toBeTruthy();
    expect((await rescheduled.json()).booking.inicio).toBe(nextSlot.inicio);

    const cancelled = await cancelCurrentBooking(context);
    expect(cancelled.ok(), await cancelled.text()).toBeTruthy();
    expect((await cancelled.json()).booking.status).toBe("cancelado");
  } finally {
    await context.dispose();
  }
});

test("duas pessoas disputando o mesmo profissional e horário geram um único vencedor", async () => {
  const { catalog } = await getCatalog();
  const service = catalog.servicos.find((item) => !item.exige_sinal)!;
  const finder = await playwrightRequest.newContext({ baseURL });
  const first = await playwrightRequest.newContext({ baseURL });
  const second = await playwrightRequest.newContext({ baseURL });
  try {
    const slot = await findSlot(finder, service.id, catalog.empresa.fuso_horario, {
      startOffset: 15,
    });
    const responses = await Promise.all([
      createBooking(first, service.id, slot, "corrida-a"),
      createBooking(second, service.id, slot, "corrida-b"),
    ]);
    const statuses = responses.map((response) => response.status()).sort();
    expect(statuses).toEqual([201, 409]);
    const winner = responses[0].status() === 201 ? first : second;
    const cancelled = await cancelCurrentBooking(winner);
    expect(cancelled.ok(), await cancelled.text()).toBeTruthy();
  } finally {
    await Promise.all([finder.dispose(), first.dispose(), second.dispose()]);
  }
});

test("Pix sandbox cria cobrança de R$ 1, bloqueia ações, aceita webhook repetido e expira", async () => {
  const { catalog } = await getCatalog();
  const service = catalog.servicos.find(
    (item) => item.exige_sinal && Number(item.sinal_valor) === 1,
  );
  expect(service, "O catálogo precisa ter um serviço com sinal de R$ 1.").toBeTruthy();
  const context = await playwrightRequest.newContext({ baseURL });
  try {
    const slot = await findSlot(context, service!.id, catalog.empresa.fuso_horario, {
      startOffset: 20,
    });
    const created = await createBooking(context, service!.id, slot, "com-sinal");
    expect(created.status(), await created.text()).toBe(201);
    const booking = (await created.json()).booking;
    expect(booking.sinal_status).toBe("pendente");

    const paymentResponse = await context.post("/api/site/payments/mercado-pago", {
      data: {},
    });
    expect(paymentResponse.status(), await paymentResponse.text()).toBe(201);
    const payment = (await paymentResponse.json()).payment;
    expect(payment.amount).toBe(1);
    expect(payment.orderId).toBeTruthy();
    expect(payment.pixCopyPaste || payment.qrCodeBase64 || payment.ticketUrl).toBeTruthy();

    const blockedConfirmation = await context.patch("/api/site/my-booking", {
      data: { action: "confirmar" },
    });
    expect(blockedConfirmation.status()).toBe(400);
    expect((await blockedConfirmation.json()).error).toMatch(/sinal|pagamento/i);

    const blockedReschedule = await context.patch("/api/site/my-booking", {
      data: {
        action: "reagendar",
        professionalId: slot.id_funcionario,
        start: slot.inicio,
      },
    });
    expect(blockedReschedule.status()).toBe(400);
    expect((await blockedReschedule.json()).error).toMatch(/sinal|pagamento/i);

    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET!;
    const requestId = randomUUID();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const manifest = `id:${payment.orderId};request-id:${requestId};ts:${timestamp};`;
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");
    const headers = {
      "x-request-id": requestId,
      "x-signature": `ts=${timestamp},v1=${signature}`,
    };
    const webhookBody = { type: "order", data: { id: payment.orderId } };
    const webhookOne = await context.post("/api/webhooks/mercado-pago", {
      headers,
      data: webhookBody,
    });
    const webhookReplay = await context.post("/api/webhooks/mercado-pago", {
      headers,
      data: webhookBody,
    });
    expect(webhookOne.ok(), await webhookOne.text()).toBeTruthy();
    expect(webhookReplay.ok(), await webhookReplay.text()).toBeTruthy();

    const { error: expiryError } = await admin.rpc("aplicar_order_mercado_pago_v2", {
      p_order_id: payment.orderId,
      p_external_reference: String(booking.id),
      p_status: "expired",
      p_status_detail: "expired",
      p_transaction_status: "expired",
      p_transaction_status_detail: "expired",
      p_paid_amount: 0,
      p_paid_at: null,
    });
    expect(expiryError).toBeNull();

    const expired = await context.get("/api/site/my-booking");
    expect(expired.ok(), await expired.text()).toBeTruthy();
    const expiredBooking = (await expired.json()).booking;
    expect(expiredBooking.status).toBe("cancelado");
    expect(expiredBooking.pagamento_status ?? expiredBooking.sinal_status).not.toBe("pago");
  } finally {
    await context.dispose();
  }
});

test("webhook sem assinatura é rejeitado", async ({ request }) => {
  const response = await request.post("/api/webhooks/mercado-pago", {
    data: { type: "order", data: { id: "order-falsa" } },
  });
  expect(response.status()).toBe(401);
});
