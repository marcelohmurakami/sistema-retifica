import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  try {
    const site = await getPublicSiteForRequest(request);
    if (!site) {
      return NextResponse.json({ error: "Empresa não encontrada para este domínio." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!validEmail(email) || password.length < 6 || password.length > 72) {
      return NextResponse.json({ error: "Informe seu e-mail e sua senha." }, { status: 400 });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const { error: linkError } = await supabase.rpc("vincular_cliente_email_site", {
      p_id_empresa: site.empresa.id,
    });

    if (linkError) {
      const bookingToken = request.cookies.get("site_booking_token")?.value;
      if (!bookingToken) {
        throw new Error("Não encontramos um cadastro de cliente para este e-mail.");
      }

      const { error: tokenLinkError } = await supabase.rpc("vincular_cliente_site", {
        p_token: bookingToken,
      });
      if (tokenLinkError) {
        throw new Error("Não foi possível vincular este acesso ao cadastro do cliente.");
      }
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível entrar agora." },
      { status: 403 },
    );
  }
}
