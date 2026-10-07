"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type {
  AvailabilitySlot,
  PublicBooking,
  PublicCatalog,
} from "@/lib/supabase/site";
import { CreateAccountCard } from "@/components/create-account-card";
import { MercadoPagoPix } from "@/components/mercado-pago-pix";

type DateOption = {
  iso: string;
  day: string;
  date: string;
  month: string;
  longLabel: string;
};
type Props = {
  catalog: PublicCatalog;
  today: string;
  locationLabel: string;
  initialServiceId?: number;
  initialProfessionalId?: number;
  authenticatedCustomer?: {
    name: string;
    phone: string;
    email: string;
    reminderWhatsapp: boolean;
    reminderEmail: boolean;
  } | null;
};

function money(value: number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function buildDates(today: string): DateOption[] {
  const [year, month, day] = today.split("-").map(Number);
  const result: DateOption[] = [];
  for (let offset = 0; offset < 18 && result.length < 14; offset += 1) {
    const value = new Date(Date.UTC(year, month - 1, day + offset, 12));
    if (value.getUTCDay() === 0) continue;
    result.push({
      iso: value.toISOString().slice(0, 10),
      day: new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        timeZone: "UTC",
      })
        .format(value)
        .replace(".", "")
        .toUpperCase(),
      date: String(value.getUTCDate()).padStart(2, "0"),
      month: new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        timeZone: "UTC",
      })
        .format(value)
        .replace(".", "")
        .toUpperCase(),
      longLabel: new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        timeZone: "UTC",
      }).format(value),
    });
  }
  return result;
}

function calculateSignal(service: PublicCatalog["servicos"][number]) {
  if (!service.exige_sinal || !service.sinal_valor) return 0;
  return service.sinal_tipo === "percentual"
    ? (Number(service.preco) * Number(service.sinal_valor)) / 100
    : Math.min(Number(service.preco), Number(service.sinal_valor));
}

export function BookingWizard({
  catalog,
  today,
  locationLabel,
  initialServiceId,
  initialProfessionalId,
  authenticatedCustomer,
}: Props) {
  const dates = useMemo(() => buildDates(today), [today]);
  const defaultService =
    catalog.servicos.find((item) => item.id === initialServiceId) ??
    catalog.servicos[0];
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(defaultService?.id ?? 0);
  const [professionalId, setProfessionalId] = useState(
    initialProfessionalId ? String(initialProfessionalId) : "any",
  );
  const [date, setDate] = useState(dates[0]?.iso ?? today);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [reminders, setReminders] = useState({
    whatsapp: authenticatedCustomer?.reminderWhatsapp ?? true,
    email: authenticatedCustomer?.reminderEmail ?? true,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [form, setForm] = useState({
    name: authenticatedCustomer?.name ?? "",
    phone: authenticatedCustomer?.phone ?? "",
    email: authenticatedCustomer?.email ?? "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [finished, setFinished] = useState<PublicBooking | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const service =
    catalog.servicos.find((item) => item.id === serviceId) ??
    catalog.servicos[0];
  const eligibleProfessionals = catalog.profissionais.filter((person) =>
    person.servicos.includes(service?.id ?? 0),
  );
  const effectiveProfessionalId =
    professionalId !== "any" &&
    eligibleProfessionals.some((item) => String(item.id) === professionalId)
      ? professionalId
      : "any";
  const selectedDate = dates.find((item) => item.iso === date) ?? dates[0];
  const actualProfessionalId =
    selectedSlot?.id_funcionario ??
    (effectiveProfessionalId !== "any"
      ? Number(effectiveProfessionalId)
      : undefined);
  const professional = catalog.profissionais.find(
    (item) => item.id === actualProfessionalId,
  );
  const signal = service ? calculateSignal(service) : 0;
  const isReturningCustomer = Boolean(authenticatedCustomer);
  const steps = isReturningCustomer
    ? [
        { id: 1, label: "Serviço" },
        { id: 2, label: "Horário" },
        { id: 4, label: "Confirmação" },
      ]
    : [
        { id: 1, label: "Serviço" },
        { id: 2, label: "Horário" },
        { id: 3, label: "Seus dados" },
        { id: 4, label: "Confirmação" },
      ];
  const stepPosition = steps.findIndex((item) => item.id === step) + 1;
  const reminderLabel = [
    reminders.whatsapp ? "WhatsApp" : "",
    reminders.email ? "e-mail" : "",
  ].filter(Boolean).join(" e ") || "sem lembretes ativos";

  useEffect(() => {
    if (!service?.id || !date) return;
    const controller = new AbortController();
    async function loadSlots() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setLoadingSlots(true);
      setSlotError("");
      setSelectedSlot(null);
      const params = new URLSearchParams({
        date,
        serviceId: String(service.id),
      });
      if (effectiveProfessionalId !== "any")
        params.set("professionalId", effectiveProfessionalId);
      try {
        const response = await fetch(`/api/site/availability?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(
            payload.error || "Não foi possível consultar os horários.",
          );
        const available = payload.slots as AvailabilitySlot[];
        if (effectiveProfessionalId === "any") {
          const firstByTime = new Map<string, AvailabilitySlot>();
          available.forEach((slot) => {
            if (!firstByTime.has(slot.horario))
              firstByTime.set(slot.horario, slot);
          });
          setSlots(Array.from(firstByTime.values()));
        } else {
          setSlots(available);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setSlots([]);
          setSlotError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    }
    void loadSlots();

    return () => controller.abort();
  }, [date, effectiveProfessionalId, service?.id]);

  function next(event?: FormEvent) {
    event?.preventDefault();
    setStep((current) =>
      isReturningCustomer && current === 2 ? 4 : Math.min(current + 1, 4),
    );
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  function back() {
    setStep((current) =>
      isReturningCustomer && current === 4 ? 2 : Math.max(current - 1, 1),
    );
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  async function confirmBooking() {
    if (!service || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError("");
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/site/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          serviceId: service.id,
          professionalId: selectedSlot.id_funcionario,
          start: selectedSlot.inicio,
          reminderWhatsapp: reminders.whatsapp,
          reminderEmail: reminders.email,
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Não foi possível criar a reserva.");
      setFinished(payload.booking as PublicBooking);
      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a reserva.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!service) {
    return (
      <section className="booking-success">
        <h2>Catálogo indisponível</h2>
        <p>Nenhum serviço online foi encontrado para esta empresa.</p>
      </section>
    );
  }

  if (finished) {
    const start = new Date(finished.inicio);
    const awaitingPayment = finished.sinal_status === "pendente";
    return (
      <section className="booking-success" aria-live="polite">
        <div className="success-icon">
          <CheckCircle2 size={38} />
        </div>
        <p className="eyebrow">
          <span /> reserva registrada no sistema
        </p>
        <h2>{awaitingPayment ? "Falta apenas o sinal" : "Seu momento está confirmado!"}</h2>
        <p>
          {awaitingPayment
            ? `O horário está reservado por 30 minutos. Pague o sinal para confirmar no ${catalog.empresa.nome}.`
            : `Pagamento identificado e agendamento confirmado no ${catalog.empresa.nome}.`}
        </p>
        <div className="success-ticket">
          <span>AGENDAMENTO #{finished.codigo}</span>
          <div>
            <CalendarDays size={20} />
            <p>
              <strong>
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "full",
                  timeStyle: "short",
                }).format(start)}
              </strong>
              <small>
                {finished.servico.nome} com {finished.profissional.nome}
              </small>
            </p>
          </div>
          <div>
            <BellRing size={20} />
            <p>
              <strong>Lembretes registrados</strong>
              <small>Preferências salvas com a reserva</small>
            </p>
          </div>
        </div>
        {awaitingPayment && (
          <MercadoPagoPix
            onPaid={() =>
              setFinished((current) =>
                current
                  ? { ...current, sinal_status: "pago", status: "confirmado" }
                  : current,
              )
            }
          />
        )}
        {!isReturningCustomer && (
          <CreateAccountCard email={finished.cliente.email} />
        )}
        <div className="success-actions">
          <Link href="/minha-conta" className="button">
            Ir para minha área <ArrowRight size={16} />
          </Link>
          <Link href="/" className="text-link">
            Voltar ao início
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="booking-shell">
      <section className="booking-main">
        <div
          className={isReturningCustomer ? "stepper returning" : "stepper"}
          aria-label={`Etapa ${stepPosition} de ${steps.length}`}
        >
          {steps.map(
            (item, index) => (
              <div
                className={stepPosition >= index + 1 ? "step active" : "step"}
                key={item.id}
              >
                <span>
                  {stepPosition > index + 1 ? <Check size={13} /> : index + 1}
                </span>
                <small>{item.label}</small>
              </div>
            ),
          )}
        </div>

        {step === 1 && (
          <div className="booking-step">
            <div className="step-heading">
              <span>
                <Sparkles size={18} />
              </span>
              <div>
                <p>ETAPA 1 DE {steps.length}</p>
                <h2>O que vamos cuidar hoje?</h2>
              </div>
            </div>
            <div className="option-list">
              {catalog.servicos.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={
                    serviceId === item.id
                      ? "option-card selected"
                      : "option-card"
                  }
                  onClick={() => setServiceId(item.id)}
                >
                  <span className="radio-dot" />
                  <span>
                    <strong>{item.nome}</strong>
                    <small>
                      {item.descricao || "Atendimento personalizado"}
                    </small>
                  </span>
                  <span className="option-price">
                    <strong>{money(item.preco)}</strong>
                    <small>{item.duracao_minutos} min</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="step-footer">
              <span />
              <button type="button" className="button" onClick={() => next()}>
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="booking-step">
            <div className="step-heading">
              <span>
                <CalendarDays size={18} />
              </span>
              <div>
                <p>ETAPA 2 DE {steps.length}</p>
                <h2>Com quem e quando?</h2>
              </div>
            </div>
            <h3 className="field-title">Escolha a especialista</h3>
            <div className="professional-options">
              <button
                type="button"
                className={
                  effectiveProfessionalId === "any"
                    ? "pro-option selected"
                    : "pro-option"
                }
                onClick={() => setProfessionalId("any")}
              >
                <span>✦</span>
                <strong>Primeiro disponível</strong>
                <small>Melhor encaixe</small>
              </button>
              {eligibleProfessionals.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={
                    professionalId === String(item.id)
                      ? "pro-option selected"
                      : "pro-option"
                  }
                  onClick={() => setProfessionalId(String(item.id))}
                >
                  <span>
                    {item.nome
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <strong>{item.nome}</strong>
                  <small>{item.cargo}</small>
                </button>
              ))}
            </div>
            <h3 className="field-title">Escolha o dia</h3>
            <div className="date-options">
              {dates.map((item) => (
                <button
                  type="button"
                  key={item.iso}
                  className={
                    date === item.iso ? "date-option selected" : "date-option"
                  }
                  onClick={() => setDate(item.iso)}
                >
                  <small>{item.day}</small>
                  <strong>{item.date}</strong>
                  <span>{item.month}</span>
                </button>
              ))}
            </div>
            <h3 className="field-title">Horários disponíveis</h3>
            <div className="time-options" aria-busy={loadingSlots}>
              {loadingSlots && <p>Consultando a agenda em tempo real…</p>}
              {!loadingSlots &&
                slots.map((item) => (
                  <button
                    type="button"
                    key={`${item.id_funcionario}-${item.inicio}`}
                    className={
                      selectedSlot?.inicio === item.inicio &&
                      selectedSlot.id_funcionario === item.id_funcionario
                        ? "selected"
                        : ""
                    }
                    onClick={() => setSelectedSlot(item)}
                    title={item.nome_funcionario}
                  >
                    {item.horario}
                  </button>
                ))}
              {!loadingSlots && !slots.length && !slotError && (
                <p>Nenhum horário livre nesta data.</p>
              )}
            </div>
            {slotError && (
              <p className="booking-error" role="alert">
                {slotError}
              </p>
            )}
            <div className="step-footer">
              <button type="button" className="back-button" onClick={back}>
                <ArrowLeft size={15} /> Voltar
              </button>
              <button
                type="button"
                className="button"
                disabled={!selectedSlot}
                onClick={() => next()}
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && !isReturningCustomer && (
          <form className="booking-step" onSubmit={next}>
            <div className="step-heading">
              <span>
                <UserRound size={18} />
              </span>
              <div>
                <p>ETAPA 3 DE {steps.length}</p>
                <h2>Como podemos falar com você?</h2>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Nome completo
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Seu nome"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>
              <label>
                WhatsApp
                <input
                  required
                  type="tel"
                  placeholder="(11) 99999-9999"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </label>
              <label className="full-field">
                E-mail
                <input
                  required
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>
              <label className="full-field">
                Observações <span>(opcional)</span>
                <textarea
                  maxLength={1000}
                  placeholder="Conte algo que devemos saber para preparar seu atendimento."
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="reminder-box">
              <div>
                <BellRing size={20} />
                <p>
                  <strong>Lembretes automáticos</strong>
                  <small>Registre como quer ser lembrada.</small>
                </p>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={reminders.whatsapp}
                  onChange={(event) =>
                    setReminders({
                      ...reminders,
                      whatsapp: event.target.checked,
                    })
                  }
                />
                <MessageCircle size={16} /> WhatsApp
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={reminders.email}
                  onChange={(event) =>
                    setReminders({ ...reminders, email: event.target.checked })
                  }
                />
                <Mail size={16} /> E-mail
              </label>
            </div>
            <label className="terms-check">
              <input
                required
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
              /> Concordo com a política de
              agendamento e cancelamento.
            </label>
            <div className="step-footer">
              <button type="button" className="back-button" onClick={back}>
                <ArrowLeft size={15} /> Voltar
              </button>
              <button className="button" type="submit">
                Revisar reserva <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {step === 4 && selectedSlot && (
          <div className="booking-step">
            <div className="step-heading">
              <span>
                <CreditCard size={18} />
              </span>
              <div>
                <p>ETAPA {stepPosition} DE {steps.length}</p>
                <h2>Confirme sua reserva.</h2>
              </div>
            </div>
            <div className="signal-info">
              <ShieldCheck size={21} />
              <p>
                <strong>
                  {signal
                    ? "Sinal configurado no sistema"
                    : "Reserva sem sinal"}
                </strong>
                <small>
                  {signal
                    ? "Depois de reservar, você receberá um QR Code Pix. O valor será abatido do serviço."
                    : "Este serviço não exige pagamento antecipado."}
                </small>
              </p>
              <strong>{signal ? money(signal) : "Sem sinal"}</strong>
            </div>
            {signal > 0 && (
              <div className="pix-demo">
                <CreditCard size={46} />
                <div>
                  <p>O Pix será gerado com segurança após a reserva.</p>
                  <strong>CONFIRMAÇÃO AUTOMÁTICA PELO MERCADO PAGO</strong>
                </div>
              </div>
            )}
            <div className="secure-note">
              <LockKeyhole size={14} /> {isReturningCustomer
                ? `Os dados de ${authenticatedCustomer?.name.split(/\s+/)[0]} foram preenchidos automaticamente pela conta.`
                : "A reserva será gravada no Supabase. Dados de cartão não são solicitados neste teste."}
            </div>
            {isReturningCustomer && (
              <>
                <div className="returning-customer-note">
                  <UserRound size={16} />
                  <span>
                    <strong>Dados e lembretes preenchidos pela sua conta</strong>
                    <small>
                      {form.email} · {reminderLabel}
                    </small>
                  </span>
                </div>
                <label className="terms-check returning-terms">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                  />
                  Concordo com a política de agendamento e cancelamento.
                </label>
              </>
            )}
            {submitError && (
              <p className="booking-error" role="alert">
                {submitError}
              </p>
            )}
            <div className="step-footer">
              <button type="button" className="back-button" onClick={back}>
                <ArrowLeft size={15} /> Voltar
              </button>
              <button
                type="button"
                className="button"
                disabled={submitting || !termsAccepted}
                onClick={confirmBooking}
              >
                {submitting
                  ? "Registrando…"
                  : signal > 0
                    ? "Reservar e pagar sinal"
                    : "Confirmar reserva"}
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="booking-summary">
        <p className="summary-label">RESUMO DA RESERVA</p>
        <div className="summary-brand">
          <span>M</span>
          <div>
            <strong>{catalog.empresa.nome}</strong>
            <small>{locationLabel || "Atendimento presencial"}</small>
          </div>
        </div>
        <dl>
          <div>
            <dt>
              <Sparkles size={16} /> Serviço
            </dt>
            <dd>
              {service.nome}
              <small>{service.duracao_minutos} min</small>
            </dd>
          </div>
          <div>
            <dt>
              <UserRound size={16} /> Especialista
            </dt>
            <dd>
              {professional?.nome ?? "Primeiro disponível"}
              <small>{professional?.cargo ?? "Melhor encaixe"}</small>
            </dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={16} /> Data e hora
            </dt>
            <dd>
              {selectedDate?.longLabel ?? date}
              <small>{selectedSlot?.horario ?? "Escolha um horário"}</small>
            </dd>
          </div>
        </dl>
        <div className="summary-total">
          <span>Valor do serviço</span>
          <strong>{money(service.preco)}</strong>
          <small>
            {signal
              ? `Sinal configurado: ${money(signal)}`
              : "Sem sinal antecipado"}
          </small>
        </div>
        <p className="summary-help">
          <Clock3 size={15} /> Horários consultados diretamente na agenda do
          Supabase.
        </p>
      </aside>
    </div>
  );
}
