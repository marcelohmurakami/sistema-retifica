"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";

type AccountState = "form" | "sending" | "email-sent" | "ready" | "existing";

export function CreateAccountCard({ email }: { email: string | null }) {
  const [accountEmail, setAccountEmail] = useState(email ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [state, setState] = useState<AccountState>("form");
  const [error, setError] = useState("");

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError("As senhas informadas não são iguais.");
      return;
    }

    setState("sending");
    try {
      const response = await fetch("/api/auth/password/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accountEmail,
          password,
          passwordConfirmation,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.code === "ACCOUNT_EXISTS") {
          setState("existing");
          return;
        }
        throw new Error(payload.error || "Não foi possível criar sua conta.");
      }
      setState(payload.authenticated ? "ready" : "email-sent");
    } catch (requestError) {
      setState("form");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível criar sua conta.",
      );
    }
  }

  if (!email) {
    return (
      <aside className="booking-account" aria-label="Área do cliente">
        <div className="booking-account-heading">
          <span><LockKeyhole size={20} /></span>
          <div>
            <strong>Quer acessar sua reserva depois?</strong>
            <small>Peça ao salão para cadastrar um e-mail válido nesta reserva.</small>
          </div>
        </div>
      </aside>
    );
  }

  if (state === "email-sent") {
    return (
      <aside className="booking-account account-result" aria-live="polite">
        <MailCheck size={28} />
        <strong>Agora confirme seu e-mail</strong>
        <p>
          Enviamos um link para <b>{accountEmail}</b>. Ao clicar, sua conta será ativada
          e esta reserva aparecerá na área do cliente.
        </p>
        <small>O agendamento já está salvo mesmo antes da confirmação da conta.</small>
      </aside>
    );
  }

  if (state === "ready") {
    return (
      <aside className="booking-account account-result" aria-live="polite">
        <CheckCircle2 size={28} />
        <strong>Sua conta está pronta</strong>
        <p>Esta reserva já está vinculada ao seu acesso.</p>
        <Link href="/minha-conta" className="button">
          Abrir minha área <ArrowRight size={16} />
        </Link>
      </aside>
    );
  }

  if (state === "existing") {
    return (
      <aside className="booking-account account-result" aria-live="polite">
        <LockKeyhole size={28} />
        <strong>Você já possui uma conta</strong>
        <p>Entre com sua senha. Se não lembrar, use “Esqueci minha senha” na tela de acesso.</p>
        <Link href="/minha-conta" className="button">
          Entrar na minha conta <ArrowRight size={16} />
        </Link>
      </aside>
    );
  }

  return (
    <aside className="booking-account" aria-label="Criar área do cliente">
      <div className="booking-account-heading">
        <span><LockKeyhole size={20} /></span>
        <div>
          <strong>Crie sua área do cliente</strong>
          <small>É opcional e sua reserva já está garantida.</small>
        </div>
      </div>
      <p className="booking-account-copy">
        Defina uma senha para ver seus horários, pagamentos e lembretes, além de
        confirmar, cancelar ou reagendar quando permitido.
      </p>
      <form onSubmit={createAccount}>
        <label className="account-email-field">
          E-mail da reserva
          <input
            required
            type="email"
            autoComplete="email"
            value={accountEmail}
            onChange={(event) => setAccountEmail(event.target.value)}
          />
          <small>Confira ou corrija antes de criar a conta.</small>
        </label>
        <label>
          Crie uma senha
          <input
            required
            type="password"
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          Confirme a senha
          <input
            required
            type="password"
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            placeholder="Digite a senha novamente"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />
        </label>
        {error && <p className="booking-error" role="alert">{error}</p>}
        <button className="button" type="submit" disabled={state === "sending"}>
          {state === "sending" ? (
            <><LoaderCircle className="spin" size={16} /> Criando conta…</>
          ) : (
            <>Criar conta com senha <ArrowRight size={16} /></>
          )}
        </button>
      </form>
      <small className="booking-account-security">
        <ShieldCheck size={14} /> Você confirmará o e-mail antes de acessar seus dados.
      </small>
    </aside>
  );
}
