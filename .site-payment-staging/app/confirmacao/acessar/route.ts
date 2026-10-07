import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ConsumedLink = {
  company_id: number;
  booking_id: number;
  booking_token: string;
  expires_at: string;
};

function failure(request: NextRequest) {
  return NextResponse.redirect(new URL("/confirmacao?erro=link-invalido", request.url));
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim().toLowerCase();
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return failure(request);

  try {
    const site = await getPublicSiteForRequest(request);
    if (!site) return failure(request);

    const admin = createAdminSupabase();
    const { data, error } = await admin.rpc("consumir_token_link_agendamento", {
      p_token: token,
    });
    if (error || !data) return failure(request);

    const consumed = data as ConsumedLink;
    if (consumed.company_id !== site.empresa.id) return failure(request);

    const expiresAt = new Date(consumed.expires_at);
    const maxAge = Math.max(
      60,
      Math.min(7 * 24 * 60 * 60, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
    );
    const response = NextResponse.redirect(new URL("/confirmacao", request.url));
    response.cookies.set({
      name: "site_booking_token",
      value: consumed.booking_token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
    return response;
  } catch {
    return failure(request);
  }
}
