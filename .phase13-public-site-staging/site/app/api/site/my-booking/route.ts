import { NextRequest, NextResponse } from "next/server";
import {
  changePublicBooking,
  getPublicBooking,
  reschedulePublicBooking,
} from "@/lib/supabase/site";

export const dynamic = "force-dynamic";

function bookingToken(request: NextRequest) {
  const token = request.cookies.get("site_booking_token")?.value ?? request.cookies.get("murakami_booking_token")?.value ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    throw new Error("Nenhum agendamento foi identificado neste dispositivo.");
  }
  return token;
}

function withoutToken<T extends { token?: string }>(booking: T) {
  const { token, ...safeBooking } = booking;
  void token;
  return safeBooking;
}

function isAvailabilityConflict(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /horário|horario|conflito|simultâneo|simultaneo|intervalo entre atendimentos/i.test(message);
}

export async function GET(request: NextRequest) {
  try {
    const booking = await getPublicBooking(bookingToken(request));
    return NextResponse.json({ booking: withoutToken(booking) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível carregar a reserva." },
      { status: 404 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = bookingToken(request);
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    if (!['confirmar', 'cancelar', 'reagendar'].includes(action)) {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }
    if (action === "reagendar") {
      const professionalId = Number(body.professionalId);
      const start = String(body.start ?? "");
      if (!Number.isInteger(professionalId) || professionalId <= 0 || !Number.isFinite(Date.parse(start))) {
        return NextResponse.json({ error: "Profissional ou novo horário inválido." }, { status: 400 });
      }
    }
    const booking = action === "reagendar"
      ? await reschedulePublicBooking(token, Number(body.professionalId), String(body.start ?? ""))
      : await changePublicBooking(
          token,
          action === "confirmar" ? "confirmar" : "cancelar",
          String(body.reason ?? ""),
        );
    return NextResponse.json({ booking: withoutToken(booking) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível alterar a reserva." },
      { status: isAvailabilityConflict(error) ? 409 : 400 },
    );
  }
}
