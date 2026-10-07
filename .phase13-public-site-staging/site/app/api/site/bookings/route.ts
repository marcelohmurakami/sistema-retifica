import { NextRequest, NextResponse } from "next/server";
import { createPublicBooking } from "@/lib/supabase/site";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isAvailabilityConflict(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /horário|horario|conflito|simultâneo|simultaneo|intervalo entre atendimentos/i.test(message);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const site = await getPublicSiteForRequest(request);
    if (!site) return NextResponse.json({ error: "Empresa não encontrada para este domínio." }, { status: 404 });
    if (!site.unidade) return NextResponse.json({ error: "Nenhuma unidade ativa foi configurada para este site." }, { status: 409 });

    const serviceId = Number(body.serviceId);
    const professionalId = Number(body.professionalId);
    const start = String(body.start ?? "");
    const idempotencyKey = String(body.idempotencyKey ?? "");
    if (
      !Number.isInteger(serviceId) || serviceId <= 0 ||
      !Number.isInteger(professionalId) || professionalId <= 0 ||
      !Number.isFinite(Date.parse(start)) ||
      !uuidPattern.test(idempotencyKey)
    ) {
      return NextResponse.json({ error: "Serviço, profissional, horário ou identificador da solicitação inválido." }, { status: 400 });
    }

    const booking = await createPublicBooking(site.empresa.id, {
      unitId: site.unidade.id,
      name: String(body.name ?? ""),
      phone: String(body.phone ?? ""),
      email: String(body.email ?? ""),
      serviceId,
      professionalId,
      start,
      notes: String(body.notes ?? ""),
      reminderWhatsapp: body.reminderWhatsapp !== false,
      reminderEmail: body.reminderEmail !== false,
      idempotencyKey,
    });

    if (!booking.token) throw new Error("Token de acesso da reserva não foi gerado.");
    const { token, ...safeBooking } = booking;
    const response = NextResponse.json({ booking: safeBooking }, { status: 201 });
    response.cookies.set({
      name: "site_booking_token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível criar o agendamento." },
      { status: isAvailabilityConflict(error) ? 409 : 400 },
    );
  }
}
