import { NextRequest, NextResponse } from "next/server";
import {
  getMercadoPagoOrder,
  validateMercadoPagoWebhook,
} from "@/lib/payments/mercado-pago";
import { applyMercadoPagoOrder } from "@/lib/payments/payment-server";
import { processPendingBookingRefunds } from "@/lib/payments/booking-refunds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      data?: { id?: string | number };
    };
    const rawDataId =
      request.nextUrl.searchParams.get("data.id") ?? body.data?.id ?? null;
    const dataId = rawDataId == null ? null : String(rawDataId);
    const valid = validateMercadoPagoWebhook({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
    });

    if (!valid) {
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }
    if (body.type && body.type !== "order") {
      return NextResponse.json({ received: true });
    }
    if (!dataId) {
      return NextResponse.json({ error: "Order não informada." }, { status: 400 });
    }

    const order = await getMercadoPagoOrder(dataId);
    const payment = await applyMercadoPagoOrder(order);
    if (payment?.booking_id) {
      await processPendingBookingRefunds(payment.booking_id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Falha ao processar webhook do Mercado Pago", error);
    return NextResponse.json(
      { error: "Não foi possível processar a notificação." },
      { status: 500 },
    );
  }
}
