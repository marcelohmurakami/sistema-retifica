import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteForRequest } from "@/lib/supabase/request-site";
import { createServerSupabase } from "@/lib/supabase/server";
import { updatePublicBookingEmail } from "@/lib/supabase/site";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class RegistrationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code?: string,
  ) {
    super(message);
  }
}

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function registrationError(error: { message?: string; status?: number }) {
  const message = error.message ?? "";
  if (error.status === 429 || /rate.?limit|too many requests|email rate/i.test(message)) {
    return new RegistrationError(
      "O limite temporário de e-mails do Supabase foi atingido. Seu agendamento está salvo; tente criar a conta mais tarde.",
      429,
      "EMAIL_RATE_LIMIT",
    );
  }
  if (/already registered|already exists|user already/i.test(message)) {
    return new RegistrationError(
      "Este e-mail já possui uma conta. Entre com sua senha ou use a recuperação de acesso.",
      409,
      "ACCOUNT_EXISTS",
    );
  }
  if (/password/i.test(message)) {
    return new RegistrationError(
      "A senha não atende aos requisitos de segurança. Use pelo menos 8 caracteres.",
      400,
      "WEAK_PASSWORD",
    );
  }
  return new RegistrationError("Não foi possível criar sua conta agora. Tente novamente em instantes.");
}

export async function POST(request: NextRequest) {
  try {
    const site = await getPublicSiteForRequest(request);
    if (!site) {
      throw new RegistrationError("Empresa não encontrada para este domínio.", 404);
    }

    const token = request.cookies.get("site_booking_token")?.value ?? "";
    if (!uuidPattern.test(token)) {
      throw new RegistrationError(
        "Faça um agendamento neste dispositivo antes de criar sua conta.",
        403,
        "BOOKING_REQUIRED",
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const requestedEmail = String(body.email ?? "").trim().toLowerCase();
    if (!validEmail(requestedEmail)) {
      throw new RegistrationError("Informe um e-mail válido.");
    }

    const booking = await updatePublicBookingEmail(token, requestedEmail);
    if (booking.empresa.id !== site.empresa.id) {
      throw new RegistrationError("A reserva não pertence a esta empresa.", 403);
    }

    const email = booking.cliente.email?.trim().toLowerCase() ?? "";
    if (!validEmail(email)) {
      throw new RegistrationError(
        "Esta reserva não possui um e-mail válido. Fale com o salão para atualizar seus dados.",
        400,
      );
    }

    const password = String(body.password ?? "");
    const passwordConfirmation = String(body.passwordConfirmation ?? "");
    if (password.length < 8 || password.length > 72) {
      throw new RegistrationError("Crie uma senha entre 8 e 72 caracteres.");
    }
    if (password !== passwordConfirmation) {
      throw new RegistrationError("As senhas informadas não são iguais.");
    }

    const supabase = await createServerSupabase();
    const { data: currentUser } = await supabase.auth.getUser();

    if (currentUser.user) {
      if (currentUser.user.email?.toLowerCase() !== email) {
        throw new RegistrationError(
          "Você já está conectado com outro e-mail. Saia dessa conta antes de continuar.",
          409,
          "DIFFERENT_ACCOUNT",
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw registrationError(updateError);

      const { error: linkError } = await supabase.rpc("vincular_cliente_site", {
        p_token: token,
      });
      if (linkError) {
        throw new RegistrationError("A senha foi salva, mas não foi possível vincular a reserva à sua área.", 500);
      }

      return NextResponse.json({ authenticated: true, email });
    }

    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const origin = configuredUrl || new URL(request.url).origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: { nome: booking.cliente.nome },
      },
    });

    if (error) throw registrationError(error);
    if (data.user?.identities?.length === 0) {
      throw new RegistrationError(
        "Este e-mail já possui uma conta. Entre com sua senha ou use a recuperação de acesso.",
        409,
        "ACCOUNT_EXISTS",
      );
    }

    if (data.session) {
      const { error: linkError } = await supabase.rpc("vincular_cliente_site", {
        p_token: token,
      });
      if (linkError) {
        throw new RegistrationError("A conta foi criada, mas não foi possível vincular a reserva à sua área.", 500);
      }
      return NextResponse.json({ authenticated: true, email });
    }

    return NextResponse.json({
      authenticated: false,
      confirmationRequired: true,
      email,
      message: "Enviamos um link para confirmar seu e-mail e ativar sua conta.",
    });
  } catch (error) {
    const knownError = error instanceof RegistrationError
      ? error
      : new RegistrationError("Não foi possível criar sua conta agora. Tente novamente em instantes.");
    if (!(error instanceof RegistrationError)) {
      console.error("Falha ao criar conta após agendamento:", error);
    }
    return NextResponse.json(
      { error: knownError.message, code: knownError.code },
      { status: knownError.status },
    );
  }
}
