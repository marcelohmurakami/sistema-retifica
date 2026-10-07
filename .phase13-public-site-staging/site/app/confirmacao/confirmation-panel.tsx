"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicBooking } from "@/lib/supabase/site";

export function ConfirmationPanel({ companyName, location }: { companyName: string; location: string }) {
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/site/my-booking", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(
            payload.error || "Não foi possível carregar a reserva.",
          );
        setBooking(payload.booking as PublicBooking);
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar a reserva.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function change(action: "confirmar" | "cancelar") {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/site/my-booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason:
            action === "cancelar"
              ? "Cancelado pelo cliente na página de confirmação."
              : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Não foi possível alterar a reserva.");
      setBooking(payload.booking as PublicBooking);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível alterar a reserva.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="confirmation-card">
        <span className="confirmation-icon">
          <Sparkles size={27} />
        </span>
        <h1>Consultando sua reserva…</h1>
        <p>Buscando os dados diretamente no Supabase.</p>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="confirmation-card result">
        <span className="confirmation-icon cancelled">
          <X size={34} />
        </span>
        <h1>Reserva não encontrada.</h1>
        <p>
          {error ||
            "Faça um agendamento neste dispositivo para acessar a confirmação."}
        </p>
        <Link href="/agendar" className="button">
          Agendar horário <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  if (booking.status === "confirmado" || booking.status === "cancelado") {
    const confirmed = booking.status === "confirmado";
    return (
      <section className="confirmation-card result">
        <span
          className={
            confirmed ? "confirmation-icon" : "confirmation-icon cancelled"
          }
        >
          {confirmed ? <CheckCircle2 size={34} /> : <X size={34} />}
        </span>
        <p className="eyebrow">
          <span /> {confirmed ? "presença confirmada" : "agendamento cancelado"}
        </p>
        <h1>
          {confirmed
            ? `Tudo certo, ${booking.cliente.nome.split(" ")[0]}!`
            : "Cancelamento concluído."}
        </h1>
        <p>
          {confirmed
            ? `Sua confirmação já está registrada na agenda do ${companyName}.`
            : "O cancelamento já foi registrado no sistema."}
        </p>
        <Link href="/minha-conta" className="button">
          Acessar minha área <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  const start = new Date(booking.inicio);
  const signalPending = booking.sinal_status === "pendente";
  return (
    <section className="confirmation-card">
      <span className="confirmation-icon">
        <Sparkles size={27} />
      </span>
      <p className="eyebrow">
        <span /> dados em tempo real
      </p>
      <h1>
        Podemos confirmar
        <br />
        seu momento?
      </h1>
      <p>
        Olá, {booking.cliente.nome.split(" ")[0]}! Esta reserva foi carregada
        diretamente do Supabase.
      </p>
      <div className="confirmation-details">
        <div>
          <CalendarDays size={19} />
          <span>
            <small>DATA</small>
            <strong>
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(
                start,
              )}
            </strong>
          </span>
        </div>
        <div>
          <Clock3 size={19} />
          <span>
            <small>HORÁRIO</small>
            <strong>
              {new Intl.DateTimeFormat("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(start)}{" "}
              · {booking.servico.duracao_minutos} min
            </strong>
          </span>
        </div>
        {location && <div>
          <MapPin size={19} />
          <span>
            <small>LOCAL</small>
            <strong>{location}</strong>
          </span>
        </div>}
      </div>
      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}
      <div className="confirmation-actions">
        <button
          className="button"
          disabled={saving || signalPending}
          onClick={() => change("confirmar")}
        >
          <Check size={17} />{" "}
          {signalPending ? "Aguardando pagamento do sinal" : "Sim, estarei lá"}
        </button>
        <Link href="/minha-conta" className="outline-action">
          <RotateCcw size={16} /> Preciso reagendar
        </Link>
        <button
          className="plain-danger"
          disabled={saving}
          onClick={() => change("cancelar")}
        >
          Cancelar agendamento
        </button>
      </div>
      <small className="confirmation-help">
        A identificação desta reserva fica em um cookie privado deste
        dispositivo.
      </small>
    </section>
  );
}
