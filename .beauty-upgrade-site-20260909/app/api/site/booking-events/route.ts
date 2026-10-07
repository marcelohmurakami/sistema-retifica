import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";

export const dynamic = "force-dynamic";
const allowed = new Set(["inicio", "servico_selecionado", "horario_selecionado", "dados_iniciados", "reserva_criada", "abandono"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const site = await getPublicSiteForRequest(request);
    if (!site) return NextResponse.json({ ok: false }, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    const session = String(body.session ?? "");
    const event = String(body.event ?? "");
    const step = Number(body.step);
    if (!uuid.test(session) || !allowed.has(event) || !Number.isInteger(step) || step < 1 || step > 3) return NextResponse.json({ ok: false }, { status: 400 });
    const serviceId = Number(body.serviceId);
    const professionalId = Number(body.professionalId);
    const { error } = await createAdminSupabase().rpc("registrar_evento_funil_agendamento", { p_id_empresa: site.empresa.id, p_sessao: session, p_evento: event, p_etapa: step, p_id_servico: Number.isInteger(serviceId) && serviceId > 0 ? serviceId : null, p_id_funcionario: Number.isInteger(professionalId) && professionalId > 0 ? professionalId : null });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error("Falha ao registrar funil do agendamento", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
