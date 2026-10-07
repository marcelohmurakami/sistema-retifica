import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedDestination = url.searchParams.get("next");
  const destinationPath = requestedDestination === "/redefinir-senha"
    ? "/redefinir-senha"
    : "/minha-conta";
  const destination = new URL(destinationPath, url.origin);
  const code = url.searchParams.get("code");
  const supabase = await createServerSupabase();

  try {
    if (!code) throw new Error("Código de autenticação ausente.");
    const site = await getPublicSiteForRequest(request);
    if (!site) throw new Error("Empresa não encontrada.");

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;

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

    if (destinationPath === "/minha-conta") {
      destination.searchParams.set("login", "sucesso");
    }
  } catch {
    await supabase.auth.signOut();
    const errorDestination = new URL("/minha-conta", url.origin);
    errorDestination.searchParams.set("login", "erro");
    return NextResponse.redirect(errorDestination);
  }

  return NextResponse.redirect(destination);
}
