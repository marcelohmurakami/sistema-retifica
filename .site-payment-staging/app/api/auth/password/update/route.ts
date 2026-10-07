import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Este link de recuperação é inválido ou expirou." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const password = String(body.password ?? "");
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: "A senha deve ter entre 8 e 72 caracteres." },
        { status: 400 },
      );
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    return NextResponse.json({ updated: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível atualizar a senha." },
      { status: 400 },
    );
  }
}
