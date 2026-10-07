import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const site = await getPublicSiteForRequest(request);
    if (!site) {
      return NextResponse.json({ error: "Empresa não encontrada para este domínio." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!validEmail(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const origin = configuredUrl || new URL(request.url).origin;
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (error) throw error;

    return NextResponse.json({
      sent: true,
      message: "Enviamos o acesso para seu e-mail. Digite o código ou abra o link recebido.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível enviar o acesso agora." },
      { status: 400 },
    );
  }
}
