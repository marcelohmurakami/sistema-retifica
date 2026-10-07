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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
    });

    if (error) {
      console.error("[auth/password/reset] Supabase recusou o envio", {
        status: error.status,
        message: error.message,
      });
      const isRateLimit = error.status === 429 || /rate limit/i.test(error.message);
      if (isRateLimit) {
        return NextResponse.json(
          {
            error: "O limite temporário de e-mails do Supabase foi atingido. Aguarde cerca de uma hora ou entre pelo link que você já recebeu.",
          },
          { status: 429 },
        );
      }
      throw new Error("Não foi possível enviar o e-mail de recuperação. Verifique a configuração de autenticação do Supabase.");
    }

    return NextResponse.json({
      sent: true,
      message: "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível solicitar a nova senha." },
      { status: 400 },
    );
  }
}
