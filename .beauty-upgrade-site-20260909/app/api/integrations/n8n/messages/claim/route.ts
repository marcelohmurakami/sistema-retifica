import { NextRequest, NextResponse } from "next/server";
import { isN8nAuthorized } from "@/lib/integrations/n8n-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isN8nAuthorized(request.headers)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({})) as { limit?: unknown };
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 100);
    const { data, error } = await createAdminSupabase().rpc("n8n_reservar_mensagens", { p_limite: limit });
    if (error) throw error;
    return NextResponse.json({ messages: data ?? [], count: data?.length ?? 0 });
  } catch (error) {
    console.error("Falha ao reservar mensagens para o n8n", error);
    return NextResponse.json({ error: "Não foi possível reservar as mensagens." }, { status: 500 });
  }
}
