import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/supabase/site";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? "";
    const serviceId = Number(request.nextUrl.searchParams.get("serviceId"));
    const professionalParam = request.nextUrl.searchParams.get("professionalId");
    const professionalId = professionalParam ? Number(professionalParam) : null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(serviceId)) {
      return NextResponse.json({ error: "Seleção de data ou serviço inválida." }, { status: 400 });
    }

    const site = await getPublicSiteForRequest(request);
    if (!site) return NextResponse.json({ error: "Empresa não encontrada para este domínio." }, { status: 404 });
    if (!site.unidade) return NextResponse.json({ error: "Nenhuma unidade ativa foi configurada para este site." }, { status: 409 });
    const slots = await getAvailability(site.empresa.id, {
      unitId: site.unidade.id,
      date,
      serviceId,
      professionalId,
    });
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível consultar os horários." },
      { status: 400 },
    );
  }
}
