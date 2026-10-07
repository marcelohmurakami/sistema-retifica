"use client";

import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  LoaderCircle,
  QrCode,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicPixPayment } from "@/lib/payments/types";
import {
  isPixExpired,
  isPixProviderTerminal,
  pixTerminalErrorMessage,
  pixStatusErrorMessage,
} from "@/lib/payments/pix-presentation";

type Props = {
  bookingId?: number;
  autoStart?: boolean;
  compact?: boolean;
  onPaid?: () => void;
  onExpired?: () => void;
};

function money(value: number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function remainingLabel(expiresAt: string, now: number) {
  if (now === 0) return "30:00";
  const totalSeconds = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - now) / 1000),
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MercadoPagoPix({
  bookingId,
  autoStart = true,
  compact = false,
  onPaid,
  onExpired,
}: Props) {
  const [payment, setPayment] = useState<PublicPixPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(autoStart);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const paidNotified = useRef(false);
  const expiredNotified = useRef(false);

  const endpoint = bookingId
    ? `/api/site/payments/mercado-pago?bookingId=${bookingId}`
    : "/api/site/payments/mercado-pago";

  const requestPayment = useCallback(
    async (method: "GET" | "POST") => {
      const response = await fetch(endpoint, {
        method,
        headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
        body: method === "POST" ? JSON.stringify({ bookingId }) : undefined,
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        payment?: PublicPixPayment | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível consultar o Pix.");
      }
      if (payload.payment) {
        setPayment(payload.payment);
        setNow(Date.now());
      }
      setError("");
      return payload.payment ?? null;
    },
    [bookingId, endpoint],
  );

  const start = useCallback(async () => {
    setStarted(true);
    setLoading(true);
    setError("");
    try {
      await requestPayment("POST");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível gerar o Pix.",
      );
    } finally {
      setLoading(false);
    }
  }, [requestPayment]);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await requestPayment("GET");
    } catch (requestError) {
      setError(pixStatusErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [requestPayment]);

  useEffect(() => {
    if (!autoStart) return;
    const timer = window.setTimeout(() => void start(), 0);
    return () => window.clearTimeout(timer);
  }, [autoStart, start]);

  useEffect(() => {
    if (!payment || payment.paid || isPixProviderTerminal(payment)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [payment]);

  useEffect(() => {
    if (!payment || payment.paid || isPixProviderTerminal(payment)) return;
    const poll = window.setInterval(() => {
      void requestPayment("GET").catch((requestError) => {
        setError(pixStatusErrorMessage(requestError));
      });
    }, 5000);
    return () => window.clearInterval(poll);
  }, [payment, requestPayment]);

  useEffect(() => {
    if (!payment?.paid || paidNotified.current) return;
    paidNotified.current = true;
    onPaid?.();
  }, [onPaid, payment?.paid]);

  const expired = payment ? isPixExpired(payment, now) : false;
  const terminalError = payment ? pixTerminalErrorMessage(payment) : null;

  useEffect(() => {
    if (!expired || expiredNotified.current) return;
    expiredNotified.current = true;
    onExpired?.();
  }, [expired, onExpired]);

  async function copyPix() {
    if (!payment?.pixCopyPaste) return;
    await navigator.clipboard.writeText(payment.pixCopyPaste);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  if (!started) {
    return (
      <button type="button" className="pix-start-button" onClick={() => void start()}>
        <QrCode size={18} /> Pagar sinal com Pix
      </button>
    );
  }

  if (loading && !payment) {
    return (
      <section className={`pix-payment-card${compact ? " compact" : ""}`} aria-live="polite">
        <LoaderCircle className="spin" size={28} />
        <div>
          <strong>Gerando seu Pix seguro…</strong>
          <p>O valor é calculado novamente no servidor.</p>
        </div>
      </section>
    );
  }

  if (error && !payment) {
    return (
      <section className={`pix-payment-card error${compact ? " compact" : ""}`} role="alert">
        <div>
          <strong>Não foi possível gerar o Pix.</strong>
          <p>{error}</p>
        </div>
        <button type="button" onClick={() => void start()}>
          <RefreshCcw size={15} /> Tentar novamente
        </button>
      </section>
    );
  }

  if (!payment) return null;

  if (payment.paid) {
    return (
      <section className={`pix-payment-card paid${compact ? " compact" : ""}`} aria-live="polite">
        <CheckCircle2 size={32} />
        <div>
          <strong>Sinal recebido!</strong>
          <p>Seu agendamento foi confirmado automaticamente.</p>
        </div>
      </section>
    );
  }

  if (expired) {
    return (
      <section className={`pix-payment-card expired${compact ? " compact" : ""}`} role="alert">
        <Clock3 size={29} />
        <div>
          <strong>O prazo deste Pix terminou.</strong>
          <p>
            Não tente pagar este código. Estamos confirmando o vencimento com o
            Mercado Pago antes de liberar o horário com segurança.
          </p>
          {error && <p className="pix-inline-error">{error}</p>}
        </div>
        <button type="button" onClick={() => void refreshStatus()} disabled={loading}>
          <RefreshCcw className={loading ? "spin" : undefined} size={15} />
          {loading ? "Atualizando…" : "Atualizar situação"}
        </button>
      </section>
    );
  }

  if (terminalError) {
    return (
      <section className={`pix-payment-card error${compact ? " compact" : ""}`} role="alert">
        <div>
          <strong>O Pix não pode mais ser utilizado.</strong>
          <p>{terminalError}</p>
          {error && <p className="pix-inline-error">{error}</p>}
        </div>
        <button type="button" onClick={() => void refreshStatus()} disabled={loading}>
          <RefreshCcw className={loading ? "spin" : undefined} size={15} />
          {loading ? "Atualizando…" : "Atualizar situação"}
        </button>
      </section>
    );
  }

  return (
    <section className={`pix-payment-card${compact ? " compact" : ""}`} aria-live="polite">
      <div className="pix-payment-heading">
        <span><ShieldCheck size={19} /></span>
        <div>
          <small>PAGAMENTO SEGURO</small>
          <strong>Pague o sinal de {money(payment.amount)}</strong>
        </div>
        <span className="pix-countdown"><Clock3 size={14} /> {remainingLabel(payment.expiresAt, now)}</span>
      </div>

      <div className="pix-payment-body">
        {payment.qrCodeBase64 ? (
          <div className="pix-qr-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${payment.qrCodeBase64}`}
              width={210}
              height={210}
              alt="QR Code Pix para pagamento do sinal"
            />
          </div>
        ) : (
          <div className="pix-qr-frame placeholder"><QrCode size={92} /></div>
        )}
        <div className="pix-payment-instructions">
          <strong>Abra o aplicativo do seu banco</strong>
          <ol>
            <li>Escolha pagar com Pix.</li>
            <li>Escaneie o QR Code ou copie o código.</li>
            <li>Aguarde a confirmação automática.</li>
          </ol>
          {payment.pixCopyPaste && (
            <button type="button" className="pix-copy-button" onClick={() => void copyPix()}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Código copiado" : "Copiar código Pix"}
            </button>
          )}
          {payment.ticketUrl && (
            <a href={payment.ticketUrl} target="_blank" rel="noreferrer" className="pix-ticket-link">
              Abrir instruções do pagamento <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
      <small className="pix-payment-footnote">
        Você não precisa ter conta no Mercado Pago. A confirmação pode levar alguns segundos.
      </small>
      {error && (
        <div className="pix-inline-error" role="alert">
          {error}
          <button type="button" onClick={() => void refreshStatus()} disabled={loading}>
            <RefreshCcw className={loading ? "spin" : undefined} size={14} />
            {loading ? "Atualizando…" : "Tentar novamente"}
          </button>
        </div>
      )}
    </section>
  );
}
