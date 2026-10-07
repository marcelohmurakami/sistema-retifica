import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoOrder } from "@/lib/payments/mercado-pago";
import { applyMercadoPagoOrder } from "@/lib/payments/payment-server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { processPendingBookingRefunds } from "@/lib/payments/booking-refunds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PendingPayment = {
  payment_id: number;
  company_id: number;
  booking_id: number;
  external_id: string | null;
  expires_at: string | null;
};

function authorized(request: NextRequest) {
  const secret = process.env.PAYMENT_RECONCILIATION_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !supplied) return false;
  const expected = Buffer.from(secret);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: NextRequest) {
  if (!process.env.PAYMENT_RECONCILIATION_SECRET?.trim()) {
    return NextResponse.json(
      { error: "A conciliação automática ainda não foi configurada." },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc(
    "listar_pagamentos_mercado_pago_pendentes",
    { p_limite: 50 },
  );
  if (error) {
    console.error("Falha ao listar pagamentos para conciliação", error);
    return NextResponse.json({ error: "Falha ao iniciar a conciliação." }, { status: 500 });
  }

  const rows = (data ?? []) as PendingPayment[];
  let reconciled = 0;
  let failed = 0;

  for (let index = 0; index < rows.length; index += 5) {
    const batch = rows.slice(index, index + 5);
    const results = await Promise.allSettled(
      batch
        .filter((item) => item.external_id)
        .map(async (item) => {
          const order = await getMercadoPagoOrder(item.external_id!);
          await applyMercadoPagoOrder(order, admin);
        }),
    );
    reconciled += results.filter((item) => item.status === "fulfilled").length;
    failed += results.filter((item) => item.status === "rejected").length;
  }

  const { data: expired, error: expirationError } = await admin.rpc(
    "expirar_pagamentos_mercado_pago",
    { p_id_empresa: null },
  );
  if (expirationError) {
    console.error("Falha ao expirar intenções sem order", expirationError);
    failed += 1;
  }

  let refunds = { checked: 0, refunded: 0, failed: 0 };
  try {
    refunds = await processPendingBookingRefunds();
    failed += refunds.failed;
  } catch (refundError) {
    console.error("Falha ao processar estornos após a conciliação", refundError);
    failed += 1;
  }

  return NextResponse.json(
    {
      checked: rows.length,
      reconciled,
      expiredWithoutOrder: Number(expired ?? 0),
      refunds,
      failed,
    },
    { status: failed ? 207 : 200 },
  );
}
