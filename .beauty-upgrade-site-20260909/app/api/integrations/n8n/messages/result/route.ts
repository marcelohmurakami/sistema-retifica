import { NextRequest, NextResponse } from "next/server";
import { isN8nAuthorized } from "@/lib/integrations/n8n-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const statuses = new Set(["enviada", "entregue", "lida", "erro"]);

export async function POST(request: NextRequest) {
  if (!isN8nAuthorized(request.headers)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.messageId);
    const status = String(body.status ?? "");
    if (!Number.isInteger(id) || id <= 0 || !statuses.has(status)) return NextResponse.json({ error: "Identificador ou status inválido." }, { status: 400 });
    const { data, error } = await createAdminSupabase().rpc("n8n_registrar_resultado_mensagem", { p_id_mensagem: id, p_status: status, p_identificador_externo: String(body.externalId ?? "") || null, p_erro: String(body.error ?? "") || null });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Falha ao registrar entrega do n8n", error);
    return NextResponse.json({ error: "Não foi possível registrar o resultado." }, { status: 500 });
  }
}
