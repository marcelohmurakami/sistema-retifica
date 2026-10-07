"use client";

import { CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

export function PasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("As senhas não são iguais.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/password/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível atualizar a senha.");
      }
      setUpdated(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Não foi possível atualizar a senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <span className="auth-icon">
          {updated ? <CheckCircle2 size={25} /> : <LockKeyhole size={25} />}
        </span>
        <p className="auth-eyebrow">ACESSO SEGURO</p>
        <h1>
          {updated ? "Senha criada" : "Crie sua"}
          <br />
          <em>{updated ? "com sucesso." : "nova senha."}</em>
        </h1>

        {updated ? (
          <>
            <p className="auth-copy">Sua senha foi atualizada. Você já pode entrar na área do cliente.</p>
            <a className="button auth-primary-link" href="/minha-conta">
              Ir para minha conta
            </a>
          </>
        ) : (
          <>
            <p className="auth-copy">Use pelo menos 8 caracteres e não reutilize a senha de outro serviço.</p>
            {error && <div className="booking-error" role="alert">{error}</div>}
            <form className="auth-form" onSubmit={updatePassword}>
              <label>
                Nova senha
                <input
                  autoComplete="new-password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                />
              </label>
              <label>
                Confirmar nova senha
                <input
                  autoComplete="new-password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="Digite a senha novamente"
                />
              </label>
              <button className="button" disabled={saving || password.length < 8}>
                {saving ? <><LoaderCircle className="spin" size={16} /> Salvando…</> : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}

        <div className="auth-security">
          <ShieldCheck size={17} />
          <span>Sua senha é protegida pelo Supabase Auth e não fica armazenada no site.</span>
        </div>
      </section>
    </div>
  );
}
