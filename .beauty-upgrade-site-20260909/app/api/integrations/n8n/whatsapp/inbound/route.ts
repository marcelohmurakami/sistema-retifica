import { NextRequest, NextResponse } from "next/server";
import { isN8nAuthorized } from "@/lib/integrations/n8n-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isN8nAuthorized(request.headers)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const companyId = Number(body.companyId);
    const externalId = String(body.externalId ?? "").trim();
    const from = String(body.from ?? "").trim();
    const text = String(body.text ?? "").trim();
    if (!Number.isInteger(companyId) || companyId <= 0 || !externalId || !from || !text) return NextResponse.json({ error: "companyId, externalId, from e text são obrigatórios." }, { status: 400 });
    const { data, error } = await createAdminSupabase().rpc("n8n_processar_resposta_whatsapp", { p_id_empresa: companyId, p_identificador_externo: externalId, p_remetente: from, p_conteudo: text });
    if (error) throw error;
    const result = data as { relativeLink?: string } | null;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    return NextResponse.json(result?.relativeLink && siteUrl ? { ...result, link: `${siteUrl}${result.relativeLink}` } : result);
  } catch (error) {
    console.error("Falha ao processar resposta do WhatsApp", error);
    return NextResponse.json({ error: "Não foi possível processar a resposta." }, { status: 500 });
  }
}
