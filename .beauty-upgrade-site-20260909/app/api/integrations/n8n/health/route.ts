import { NextRequest, NextResponse } from "next/server";
import { hasN8nConfiguration, isN8nAuthorized } from "@/lib/integrations/n8n-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasN8nConfiguration()) return NextResponse.json({ ok: false, error: "Integração n8n não configurada." }, { status: 503 });
  if (!isN8nAuthorized(request.headers)) return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ ok: true, service: "beauty-notifications", time: new Date().toISOString() });
}
