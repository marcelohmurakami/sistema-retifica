import { NextRequest, NextResponse } from "next/server";
import {
  createPixOrder,
  toPublicPixPayment,
} from "@/lib/payments/mercado-pago";
import { assertOrderMatchesPayment } from "@/lib/payments/mercado-pago-core";
import {
  refreshMercadoPagoOrder,
  resolvePaymentBooking,
  type PreparedPayment,
} from "@/lib/payments/payment-server";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseBookingId(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Agendamento inválido.");
  return id;
}

function publicFallback(prepared: PreparedPayment) {
  return {
    bookingId: prepared.booking_id,
    amount: Number(prepared.amount),
    orderId: prepared.external_id ?? "",
    status: prepared.provider_status ?? prepared.status,
    statusDetail: prepared.provider_status_detail ?? prepared.status,
    expiresAt: prepared.expires_at,
    ticketUrl: null,
    pixCopyPaste: null,
    qrCodeBase64: null,
    paid: prepared.status === "confirmado",
    expired:
      prepared.status === "cancelado" ||
      new Date(prepared.expires_at).getTime() <= Date.now(),
  };
}

function paymentError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Não foi possível processar o pagamento.";
  const status = /não foi configurad|Access Token|administrativa/i.test(message)
    ? 503
    : /não encontrado|identificado/i.test(message)
      ? 404
      : /conta|autoriz/i.test(message)
        ? 401
        : 400;
  return NextResponse.json({ error: message }, { status });
}

async function paymentContext(request: NextRequest, bookingId?: number) {
  const site = await getPublicSiteForRequest(request);
  if (!site) throw new Error("Empresa não encontrada para este domínio.");
  const context = await resolvePaymentBooking(request, site, bookingId);
  return { site, ...context };
}

export async function GET(request: NextRequest) {
  try {
    const bookingId = parseBookingId(request.nextUrl.searchParams.get("bookingId"));
    const { admin, bookingId: resolvedBookingId, site } = await paymentContext(
      request,
      bookingId,
    );
    const { data, error } = await admin.rpc("obter_pagamento_mercado_pago", {
      p_id_empresa: site.empresa.id,
      p_id_agendamento: resolvedBookingId,
    });
    if (error) throw error;
    if (!data) return NextResponse.json({ payment: null });

    const prepared = data as PreparedPayment;
    if (!prepared.external_id) {
      return NextResponse.json({ payment: publicFallback(prepared) });
    }
    const refreshed = await refreshMercadoPagoOrder(prepared, admin);
    if (!refreshed) {
      return NextResponse.json({ payment: publicFallback(prepared) });
    }

    return NextResponse.json({
      payment: toPublicPixPayment(refreshed.order, {
        bookingId: prepared.booking_id,
        amount: Number(prepared.amount),
        expiresAt: prepared.expires_at,
      }),
    });
  } catch (error) {
    return paymentError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const requestedBookingId = parseBookingId(body.bookingId);
    const { admin, bookingId, site } = await paymentContext(
      request,
      requestedBookingId,
    );
    const idempotencyKey = crypto.randomUUID();
    const { data, error } = await admin.rpc("preparar_pagamento_mercado_pago", {
      p_id_empresa: site.empresa.id,
      p_id_agendamento: bookingId,
      p_chave_idempotencia: idempotencyKey,
    });
    if (error) throw error;
    const prepared = data as PreparedPayment;

    if (prepared.external_id) {
      const refreshed = await refreshMercadoPagoOrder(prepared, admin);
      if (refreshed) {
        return NextResponse.json({
          payment: toPublicPixPayment(refreshed.order, {
            bookingId,
            amount: Number(prepared.amount),
            expiresAt: prepared.expires_at,
          }),
        });
      }
    }

    const order = await createPixOrder({
      bookingId,
      amount: Number(prepared.amount),
      email: prepared.customer_email,
      idempotencyKey: prepared.idempotency_key,
    });
    assertOrderMatchesPayment(order, {
      bookingId,
      amount: Number(prepared.amount),
    });
    const { error: registerError } = await admin.rpc(
      "registrar_order_mercado_pago",
      {
        p_id_empresa: site.empresa.id,
        p_id_pagamento: prepared.payment_id,
        p_order_id: order.id,
        p_status: order.status,
        p_status_detail: order.status_detail,
        p_expira_em: prepared.expires_at,
      },
    );
    if (registerError) throw registerError;

    return NextResponse.json(
      {
        payment: toPublicPixPayment(order, {
          bookingId,
          amount: Number(prepared.amount),
          expiresAt: prepared.expires_at,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return paymentError(error);
  }
}
