import "server-only";

import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import type { PublicPixPayment } from "@/lib/payments/types";
import {
  isPaidOrder,
  isRetryableMercadoPagoStatus,
  parseMercadoPagoOrder,
  paymentFrom,
  type MercadoPagoOrder,
} from "@/lib/payments/mercado-pago-core";

export type { MercadoPagoOrder } from "@/lib/payments/mercado-pago-core";

const MERCADO_PAGO_API = "https://api.mercadopago.com";

function accessToken() {
  const value = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!value) {
    throw new Error("O Access Token do Mercado Pago não foi configurado.");
  }
  return value;
}

function webhookSecret() {
  const value = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!value) {
    throw new Error("O segredo do webhook do Mercado Pago não foi configurado.");
  }
  return value;
}

function sandboxEnabled() {
  const configured = process.env.MERCADO_PAGO_SANDBOX?.trim().toLowerCase();
  if (configured) {
    if (["1", "true", "yes", "sim"].includes(configured)) return true;
    if (["0", "false", "no", "nao", "não"].includes(configured)) return false;
    throw new Error("MERCADO_PAGO_SANDBOX deve ser true ou false.");
  }

  return accessToken().startsWith("TEST-");
}

function payerEmail(input: { bookingId: number; email: string }) {
  if (!sandboxEnabled()) return input.email;

  const configured = process.env.MERCADO_PAGO_TEST_PAYER_EMAIL?.trim();
  if (configured?.toLowerCase().endsWith("@testuser.com")) return configured;

  return `booking_${input.bookingId}@testuser.com`;
}

async function mercadoPagoRequest(path: string, init?: RequestInit) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${MERCADO_PAGO_API}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken()}`,
          ...init?.headers,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });

      const payload = (await response.json().catch(() => null)) as
        | (Record<string, unknown> & {
            message?: string;
            error?: string;
            errors?: Array<{
              code?: string;
              message?: string;
              details?: string;
            }>;
          })
        | null;

      if (response.ok && payload) return parseMercadoPagoOrder(payload);

      const detailedErrors = payload?.errors
        ?.map((item) => item.message ?? item.details ?? item.code)
        .filter(Boolean)
        .join("; ");
      const message = payload?.message ?? payload?.error ?? detailedErrors;
      const error = new Error(
        message
          ? `Mercado Pago (${response.status}): ${message}`
          : `Mercado Pago (${response.status}): a solicitação foi recusada sem detalhes.`,
      );
      if (!isRetryableMercadoPagoStatus(response.status)) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      const isFinalAttempt = attempt === 2;
      if (isFinalAttempt) break;
      if (
        error instanceof Error &&
        /^Mercado Pago \(4\d\d\)/.test(error.message) &&
        !/Mercado Pago \((408|409|425|429)\)/.test(error.message)
      ) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt));
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("Mercado Pago indisponível após novas tentativas.");
}

export async function createPixOrder(input: {
  bookingId: number;
  amount: number;
  email: string;
  idempotencyKey: string;
}) {
  const amount = Number(input.amount).toFixed(2);

  return mercadoPagoRequest("/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      type: "online",
      processing_mode: "automatic",
      external_reference: String(input.bookingId),
      total_amount: amount,
      payer: { email: payerEmail(input) },
      transactions: {
        payments: [
          {
            amount,
            payment_method: { id: "pix", type: "bank_transfer" },
            expiration_time: "PT30M",
          },
        ],
      },
    }),
  });
}

export function getMercadoPagoOrder(orderId: string) {
  return mercadoPagoRequest(
    `/v1/orders/${encodeURIComponent(orderId)}`,
  );
}

export function refundMercadoPagoOrder(
  orderId: string,
  idempotencyKey: string,
) {
  return mercadoPagoRequest(
    `/v1/orders/${encodeURIComponent(orderId)}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
    },
  );
}

export function toPublicPixPayment(
  order: MercadoPagoOrder,
  input: { bookingId: number; amount: number; expiresAt: string },
): PublicPixPayment {
  const transaction = paymentFrom(order);
  const method = transaction?.payment_method;
  const expired =
    order.status === "expired" || new Date(input.expiresAt).getTime() <= Date.now();

  return {
    bookingId: input.bookingId,
    amount: input.amount,
    orderId: order.id,
    status: order.status,
    statusDetail: order.status_detail,
    expiresAt: input.expiresAt,
    ticketUrl: method?.ticket_url ?? null,
    pixCopyPaste: method?.qr_code ?? null,
    qrCodeBase64: method?.qr_code_base64 ?? null,
    paid: isPaidOrder(order),
    expired,
  };
}

export function validateMercadoPagoWebhook(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}) {
  if (!input.xSignature || !input.xRequestId || !input.dataId) {
    return false;
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: input.xSignature,
      xRequestId: input.xRequestId,
      dataId: input.dataId,
      secret: webhookSecret(),
    });
    return true;
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return false;
    throw error;
  }
}
