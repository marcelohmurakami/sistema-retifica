import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function responseStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/jwt|session|autentica|not logged|refresh token/i.test(message)) return 401;
  if (/horário|horario|conflito|prazo|disponível|disponivel/i.test(message)) return 409;
  return 400;
}

async function context(request: NextRequest) {
  const site = await getPublicSiteForRequest(request);
  if (!site) throw new Error("Empresa não encontrada para este domínio.");
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Sessão não autenticada.");
  return { site, supabase };
}

export async function GET(request: NextRequest) {
  try {
    const { site, supabase } = await context(request);
    const { data, error } = await supabase.rpc("obter_area_cliente_site", {
      p_id_empresa: site.empresa.id,
    });
    if (error) throw error;
    return NextResponse.json({ account: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível carregar sua conta." },
      { status: responseStatus(error) },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { site, supabase } = await context(request);
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    let result: { data: unknown; error: { message: string } | null };

    if (action === "perfil") {
      result = await supabase.rpc("atualizar_dados_cliente_site", {
        p_id_empresa: site.empresa.id,
        p_nome: String(body.name ?? ""),
        p_telefone: String(body.phone ?? ""),
        p_data_nascimento: body.birthDate ? String(body.birthDate) : null,
        p_canal_preferido: body.preferredChannel ? String(body.preferredChannel) : null,
      });
    } else if (action === "preferencias") {
      result = await supabase.rpc("atualizar_preferencias_cliente_site", {
        p_id_empresa: site.empresa.id,
        p_whatsapp: body.whatsapp === true,
        p_email: body.email === true,
      });
    } else if (["confirmar", "cancelar"].includes(action)) {
      const bookingId = Number(body.bookingId);
      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return NextResponse.json({ error: "Agendamento inválido." }, { status: 400 });
      }
      result = await supabase.rpc("alterar_agendamento_cliente_site", {
        p_id_empresa: site.empresa.id,
        p_id_agendamento: bookingId,
        p_acao: action,
        p_motivo: body.reason ? String(body.reason) : null,
      });
    } else if (action === "reagendar") {
      const bookingId = Number(body.bookingId);
      const professionalId = Number(body.professionalId);
      const start = String(body.start ?? "");
      if (!Number.isInteger(bookingId) || bookingId <= 0 || !Number.isInteger(professionalId) || professionalId <= 0 || !Number.isFinite(Date.parse(start))) {
        return NextResponse.json({ error: "Agendamento, profissional ou horário inválido." }, { status: 400 });
      }
      result = await supabase.rpc("reagendar_agendamento_cliente_site", {
        p_id_empresa: site.empresa.id,
        p_id_agendamento: bookingId,
        p_id_funcionario: professionalId,
        p_inicio: start,
      });
    } else {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    if (result.error) throw result.error;
    return NextResponse.json({ account: result.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível salvar a alteração." },
      { status: responseStatus(error) },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { site, supabase } = await context(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { data, error } = await supabase.rpc("solicitar_exclusao_dados_site", {
      p_id_empresa: site.empresa.id,
      p_motivo: body.reason ? String(body.reason) : null,
    });
    if (error) throw error;
    return NextResponse.json({ account: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível registrar a solicitação." },
      { status: responseStatus(error) },
    );
  }
}
