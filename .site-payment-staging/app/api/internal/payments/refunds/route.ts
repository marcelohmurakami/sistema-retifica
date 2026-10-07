import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processPendingBookingRefunds } from "@/lib/payments/booking-refunds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const secret = process.env.PAYMENT_RECONCILIATION_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !supplied) return false;
  const expected = Buffer.from(secret);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function POST(request: NextRequest) {
  if (!process.env.PAYMENT_RECONCILIATION_SECRET?.trim()) {
    return NextResponse.json(
      { error: "O processamento de estornos ainda não foi configurado." },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await processPendingBookingRefunds();
    return NextResponse.json(result, { status: result.failed ? 207 : 200 });
  } catch (error) {
    console.error("Falha ao processar estornos pendentes", error);
    return NextResponse.json(
      { error: "Falha ao processar estornos pendentes." },
      { status: 500 },
    );
  }
}
