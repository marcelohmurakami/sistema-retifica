import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  try {
    const site = await getPublicSiteForRequest(request);
    if (!site) {
      return NextResponse.json({ error: "Empresa não encontrada para este domínio." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? "").trim().toLowerCase();
    const token = String(body.token ?? "").replace(/\D/g, "");
    if (!email || token.length < 6 || token.length > 8) {
      return NextResponse.json({ error: "Informe o código recebido por e-mail." }, { status: 400 });
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (verifyError) throw new Error("Código inválido ou expirado. Solicite um novo acesso.");

    const { error: linkError } = await supabase.rpc("vincular_cliente_email_site", {
      p_id_empresa: site.empresa.id,
    });

    if (linkError) {
      const bookingToken = request.cookies.get("site_booking_token")?.value;
      if (!bookingToken) throw linkError;
      const { error: tokenLinkError } = await supabase.rpc("vincular_cliente_site", {
        p_token: bookingToken,
      });
      if (tokenLinkError) throw linkError;
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível validar o acesso." },
      { status: 403 },
    );
  }
}
