"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AvailabilitySlot } from "@/lib/supabase/site";
import type { CustomerAccount, CustomerBooking } from "@/lib/customer-account";

type Section = "proximos" | "historico" | "pagamentos" | "perfil";
type Modal = { type: "reagendar" | "cancelar"; bookingId: number } | null;

function money(value: number | null) {
  return value == null
    ? "—"
    : Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function nextDateIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function bookingStatus(booking: CustomerBooking) {
  const labels: Record<string, string> = {
    aguardando_confirmacao: "Aguardando confirmação",
    aguardando_pagamento: "Sinal pendente",
    confirmado: "Confirmado",
    em_atendimento: "Em atendimento",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
    no_show: "Não compareceu",
  };
  return labels[booking.status] ?? booking.status.replaceAll("_", " ");
}

function BookingCard({
  booking,
  location,
  saving,
  onAction,
}: {
  booking: CustomerBooking;
  location: string;
  saving: boolean;
  onAction: (type: "confirmar" | "reagendar" | "cancelar", booking: CustomerBooking) => void;
}) {
  const start = new Date(booking.inicio);
  const isConfirmed = booking.status === "confirmado";
  const place = [booking.unidade.nome, booking.unidade.bairro, booking.unidade.cidade]
    .filter(Boolean)
    .join(" · ") || location;

  return (
    <article className="appointment-card account-appointment">
      <div className="appointment-date">
        <small>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(start).replace(".", "").toUpperCase()}</small>
        <strong>{String(start.getDate()).padStart(2, "0")}</strong>
        <span>{new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(start).replace(".", "").toUpperCase()}</span>
      </div>
      <div className="appointment-content">
        <div className="appointment-title-row">
          <div><p>AGENDAMENTO {booking.codigo}</p><h3>{booking.servico.nome}</h3></div>
          <span className={isConfirmed ? "status confirmed" : "status"}>{bookingStatus(booking)}</span>
        </div>
        <div className="appointment-meta">
          <span><UserRound size={15} /> com {booking.profissional.nome}</span>
          <span><Clock3 size={15} /> {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(start)} · {booking.servico.duracao_minutos} min</span>
          <span><MapPin size={15} /> {place}</span>
        </div>
        <div className="appointment-paid">
          <CreditCard size={15} />
          <span>{booking.sinal_status === "pendente" ? "Sinal pendente" : booking.sinal_status === "pago" ? "Sinal pago" : "Sem sinal obrigatório"}</span>
          <strong>{money(booking.sinal_valor)}</strong>
        </div>
      </div>
      <div className="appointment-actions">
        {booking.pode_confirmar && (
          <button className="button" disabled={saving} onClick={() => onAction("confirmar", booking)}>
            <Check size={16} /> Confirmar presença
          </button>
        )}
        {isConfirmed && <span className="confirmed-label"><CheckCircle2 size={15} /> Presença confirmada</span>}
        <button disabled={!booking.pode_reagendar || saving} onClick={() => onAction("reagendar", booking)}><RotateCcw size={15} /> Reagendar</button>
        <button className="danger-link" disabled={!booking.pode_cancelar || saving} onClick={() => onAction("cancelar", booking)}><X size={15} /> Cancelar</button>
        {!booking.pode_cancelar && !["cancelado", "finalizado", "no_show", "em_atendimento"].includes(booking.status) && (
          <small className="deadline-note">Prazo online encerrado. Fale com a recepção.</small>
        )}
      </div>
    </article>
  );
}

export function ClientArea({ location, siteName, whatsapp }: { location: string; siteName: string; whatsapp: string | null }) {
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [section, setSection] = useState<Section>("proximos");
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(nextDateIso);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [profile, setProfile] = useState({ name: "", phone: "", birthDate: "", preferredChannel: "whatsapp" });

  const selectedBooking = useMemo(
    () => account?.agendamentos.find((booking) => booking.id === modal?.bookingId) ?? null,
    [account, modal],
  );
  const upcoming = useMemo(() => (account?.agendamentos ?? []).filter((booking) =>
    new Date(booking.inicio).getTime() >= Date.now() && !["cancelado", "finalizado", "no_show"].includes(booking.status)), [account]);
  const history = useMemo(() => (account?.agendamentos ?? []).filter((booking) =>
    !upcoming.some((item) => item.id === booking.id)), [account, upcoming]);
  const paymentRows = useMemo(() => (account?.agendamentos ?? []).flatMap((booking) =>
    booking.pagamentos.length
      ? booking.pagamentos.map((payment) => ({ ...payment, booking }))
      : [{ id: -booking.id, valor: booking.sinal_valor ?? booking.valor_total, status: booking.pagamento_status, tipo: booking.sinal_valor ? "sinal" : "agendamento", data_pagamento: booking.inicio, provedor: null, referencia: null, booking }]), [account]);

  async function loadAccount() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/site/account", { cache: "no-store" });
      const payload = await response.json();
      if (response.status === 401) {
        setAuthenticated(false);
        setAccount(null);
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar sua conta.");
      const nextAccount = payload.account as CustomerAccount;
      setAccount(nextAccount);
      setAuthenticated(true);
      setProfile({
        name: nextAccount.cliente.nome,
        phone: nextAccount.cliente.telefone ?? "",
        birthDate: nextAccount.cliente.data_nascimento ?? "",
        preferredChannel: nextAccount.cliente.canal_preferido ?? "whatsapp",
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar sua conta.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAccount(); }, []);

  useEffect(() => {
    if (modal?.type !== "reagendar" || !selectedBooking) return;
    let active = true;
    const params = new URLSearchParams({
      date: rescheduleDate,
      serviceId: String(selectedBooking.servico.id),
      professionalId: String(selectedBooking.profissional.id),
    });
    setLoadingSlots(true);
    fetch(`/api/site/availability?${params}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível consultar os horários.");
        if (active) setSlots((payload.slots as AvailabilitySlot[]).slice(0, 12));
      })
      .catch((requestError) => {
        if (active) {
          setSlots([]);
          setNotice(requestError instanceof Error ? requestError.message : "Não foi possível consultar os horários.");
        }
      })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [modal, rescheduleDate, selectedBooking]);

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar o acesso.");
      setOtpSent(true);
      setNotice(payload.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível enviar o acesso.");
    } finally { setSaving(false); }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível validar o código.");
      setNotice("Acesso confirmado com segurança.");
      await loadAccount();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível validar o código.");
    } finally { setSaving(false); }
  }

  async function mutateAccount(method: "PATCH" | "DELETE", body: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/site/account", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar a alteração.");
      setAccount(payload.account as CustomerAccount);
      setModal(null);
      setNotice(successMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível salvar a alteração.");
    } finally { setSaving(false); }
  }

  async function logout() {
    setSaving(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setAccount(null);
    setAuthenticated(false);
    setOtpSent(false);
    setOtp("");
    setSaving(false);
  }

  if (loading && authenticated === null) {
    return <div className="client-page"><div className="empty-appointment"><LoaderCircle className="spin" size={34} /><p>Protegendo e carregando sua conta…</p></div></div>;
  }

  if (!authenticated || !account) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <span className="auth-icon"><LockKeyhole size={25} /></span>
          <p className="auth-eyebrow">ÁREA EXCLUSIVA · {siteName}</p>
          <h1>Seus cuidados,<br /><em>sempre por perto.</em></h1>
          <p className="auth-copy">Acesse sem senha. Enviaremos um código e um link seguro para o e-mail usado no seu cadastro.</p>
          {notice && <div className="auth-notice"><CheckCircle2 size={17} /> {notice}</div>}
          {error && <div className="booking-error" role="alert">{error}</div>}
          {!otpSent ? (
            <form className="auth-form" onSubmit={requestOtp}>
              <label>E-mail do cadastro<input autoComplete="email" inputMode="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" /></label>
              <button className="button" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={16} /> Enviando…</> : <>Receber acesso <ArrowRight size={16} /></>}</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={verifyOtp}>
              <label>Código recebido<input className="otp-input" autoComplete="one-time-code" inputMode="numeric" required minLength={6} maxLength={8} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="000000" /></label>
              <button className="button" disabled={saving || otp.length < 6}>{saving ? "Validando…" : "Entrar na minha conta"}</button>
              <button type="button" className="text-button" onClick={() => { setOtpSent(false); setOtp(""); setNotice(""); }}>Usar outro e-mail</button>
            </form>
          )}
          <div className="auth-security"><ShieldCheck size={17} /><span>O código expira rapidamente e seus dados continuam protegidos pelas regras de acesso do Supabase.</span></div>
        </section>
        <aside className="auth-aside"><Sparkles size={22} /><p>Depois do acesso você poderá confirmar, reagendar e acompanhar todos os seus pagamentos em um só lugar.</p></aside>
      </div>
    );
  }

  const firstName = account.cliente.nome.split(" ")[0];
  const initials = account.cliente.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;

  return (
    <div className="client-page">
      <div className="client-topbar">
        <div><p>Olá, {firstName}! <span>✦</span></p><h1>Seu momento, organizado.</h1></div>
        <span className="demo-pill"><ShieldCheck size={12} /> CONTA PROTEGIDA</span>
      </div>

      {notice && <div className="notice" role="status"><CheckCircle2 size={18} /> {notice}<button onClick={() => setNotice("")} aria-label="Fechar aviso"><X size={16} /></button></div>}
      {error && <div className="account-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Fechar erro"><X size={16} /></button></div>}

      <div className="client-grid">
        <section className="client-main">
          {section === "proximos" && (
            <>
              <div className="dashboard-heading"><div><span><CalendarDays size={18} /></span><div><p>PRÓXIMOS AGENDAMENTOS</p><h2>{upcoming.length ? `${upcoming.length} cuidado${upcoming.length > 1 ? "s" : ""} reservado${upcoming.length > 1 ? "s" : ""}` : "Sua agenda está livre"}</h2></div></div></div>
              {upcoming.length ? upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} location={location} saving={saving} onAction={(type, item) => type === "confirmar" ? void mutateAccount("PATCH", { action: type, bookingId: item.id }, "Presença confirmada.") : setModal({ type, bookingId: item.id })} />) : <div className="empty-appointment"><CalendarPlus size={34} /><p>Que tal reservar um novo momento para você?</p><Link href="/agendar" className="button">Novo agendamento <ArrowRight size={15} /></Link></div>}

              <section className="reminder-settings">
                <div className="dashboard-heading"><div><span><BellRing size={18} /></span><div><p>LEMBRETES AUTOMÁTICOS</p><h2>Como você quer ser lembrado?</h2></div></div></div>
                <div className="reminder-grid">
                  <div><MessageCircle size={18} /><p><strong>WhatsApp</strong><small>{account.preferencias.whatsapp ? "Ativado" : "Desativado"}</small></p><button aria-label="Alternar lembretes por WhatsApp" className={account.preferencias.whatsapp ? "toggle on" : "toggle"} disabled={saving} onClick={() => void mutateAccount("PATCH", { action: "preferencias", whatsapp: !account.preferencias.whatsapp, email: account.preferencias.email }, "Preferências de lembrete atualizadas.")}><span /></button></div>
                  <div><Mail size={18} /><p><strong>E-mail</strong><small>{account.preferencias.email ? "Ativado" : "Desativado"}</small></p><button aria-label="Alternar lembretes por e-mail" className={account.preferencias.email ? "toggle on" : "toggle"} disabled={saving} onClick={() => void mutateAccount("PATCH", { action: "preferencias", whatsapp: account.preferencias.whatsapp, email: !account.preferencias.email }, "Preferências de lembrete atualizadas.")}><span /></button></div>
                </div>
                <small className="reminder-footnote">Lembretes programados para {account.preferencias.antecedencias_minutos.map((minutes) => minutes >= 1440 ? `${minutes / 1440} dia` : `${minutes / 60}h`).join(" e ")} antes.</small>
              </section>
            </>
          )}

          {section === "historico" && (
            <section className="account-panel"><div className="dashboard-heading"><div><span><History size={18} /></span><div><p>HISTÓRICO</p><h2>Todos os seus momentos</h2></div></div></div><div className="history-list">{history.length ? history.map((booking) => <div key={booking.id}><span><strong>{booking.servico.nome}</strong><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(booking.inicio))} · {booking.profissional.nome}</small></span><span className={booking.status === "cancelado" ? "history-status cancelled" : "history-status"}>{bookingStatus(booking)}</span></div>) : <p className="panel-empty">Você ainda não possui agendamentos no histórico.</p>}</div></section>
          )}

          {section === "pagamentos" && (
            <section className="account-panel"><div className="dashboard-heading"><div><span><CreditCard size={18} /></span><div><p>PAGAMENTOS E SINAIS</p><h2>Transparência em cada reserva</h2></div></div></div><div className="payment-list">{paymentRows.length ? paymentRows.map((row) => <div key={`${row.booking.id}-${row.id}`}><span className="payment-icon"><CreditCard size={17} /></span><span><strong>{row.booking.servico.nome} · {row.tipo === "sinal" ? "Sinal" : "Pagamento"}</strong><small>{row.booking.codigo} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(row.data_pagamento))}</small></span><span><strong>{money(row.valor)}</strong><small>{row.status.replaceAll("_", " ")}</small></span></div>) : <p className="panel-empty">Nenhum pagamento ou sinal registrado.</p>}</div></section>
          )}

          {section === "perfil" && (
            <section className="account-panel"><div className="dashboard-heading"><div><span><UserRound size={18} /></span><div><p>DADOS PESSOAIS</p><h2>Seu cadastro</h2></div></div></div><form className="profile-form" onSubmit={(event) => { event.preventDefault(); void mutateAccount("PATCH", { action: "perfil", ...profile }, "Dados pessoais atualizados."); }}><label>Nome completo<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label>E-mail verificado<input value={account.cliente.email ?? ""} readOnly /></label><label>Telefone / WhatsApp<input required value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><label>Data de nascimento<input type="date" value={profile.birthDate} onChange={(event) => setProfile({ ...profile, birthDate: event.target.value })} /></label><label className="full-field">Canal preferido<select value={profile.preferredChannel} onChange={(event) => setProfile({ ...profile, preferredChannel: event.target.value })}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="sms">SMS</option><option value="telefone">Telefone</option></select></label><div className="profile-actions"><button className="button" disabled={saving}>{saving ? "Salvando…" : "Salvar meus dados"}</button></div></form><div className="privacy-zone"><div><Trash2 size={18} /><span><strong>Exclusão dos meus dados</strong><small>Registraremos sua solicitação para análise conforme obrigações legais e financeiras.</small></span></div>{account.solicitacao_exclusao && ["pendente", "em_analise"].includes(account.solicitacao_exclusao.status) ? <span className="privacy-pending">Solicitação {account.solicitacao_exclusao.status.replace("_", " ")}</span> : <button disabled={saving} onClick={() => { if (window.confirm("Deseja registrar a solicitação de exclusão dos seus dados?")) void mutateAccount("DELETE", { reason: "Solicitado pelo cliente na área autenticada." }, "Solicitação de exclusão registrada."); }}>Solicitar exclusão</button>}</div></section>
          )}
        </section>

        <aside className="client-sidebar">
          <div className="profile-card"><span>{initials}</span><div><strong>{account.cliente.nome}</strong><small>{account.cliente.email}</small></div><button onClick={logout} disabled={saving} aria-label="Sair da conta"><LogOut size={17} /></button></div>
          <nav className="account-nav" aria-label="Área do cliente">
            <button className={section === "proximos" ? "active" : ""} onClick={() => setSection("proximos")}><CalendarDays size={18} /><span><strong>Próximos</strong><small>Confirme ou reagende</small></span><ArrowRight size={16} /></button>
            <button className={section === "historico" ? "active" : ""} onClick={() => setSection("historico")}><History size={18} /><span><strong>Histórico</strong><small>Atendimentos anteriores</small></span><ArrowRight size={16} /></button>
            <button className={section === "pagamentos" ? "active" : ""} onClick={() => setSection("pagamentos")}><CreditCard size={18} /><span><strong>Pagamentos</strong><small>Sinais e transações</small></span><ArrowRight size={16} /></button>
            <button className={section === "perfil" ? "active" : ""} onClick={() => setSection("perfil")}><UserRound size={18} /><span><strong>Meus dados</strong><small>Cadastro e privacidade</small></span><ArrowRight size={16} /></button>
            <Link href="/agendar"><CalendarPlus size={18} /><span><strong>Novo agendamento</strong><small>Reserve outro cuidado</small></span><ArrowRight size={16} /></Link>
          </nav>
          <div className="support-card"><p>Precisa de ajuda?</p><span>Fale com a recepção do {siteName}.</span>{whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer">Chamar atendimento <ArrowRight size={14} /></a>}</div>
        </aside>
      </div>

      {modal && selectedBooking && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}>
          <div className="action-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Fechar"><X size={18} /></button>
            {modal.type === "reagendar" ? (
              <><span className="modal-icon"><RotateCcw size={23} /></span><p>REAGENDAR</p><h2 id="modal-title">Escolha um novo horário</h2><label>Nova data<input type="date" min={nextDateIso()} value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} /></label><div className="reschedule-options">{loadingSlots && <span>Consultando a agenda real…</span>}{!loadingSlots && slots.map((slot) => <button key={slot.inicio} disabled={saving} onClick={() => void mutateAccount("PATCH", { action: "reagendar", bookingId: selectedBooking.id, professionalId: slot.id_funcionario, start: slot.inicio }, "Agendamento reagendado.")}><CalendarDays size={16} /> {slot.horario}<ArrowRight size={15} /></button>)}{!loadingSlots && !slots.length && <span>Nenhum horário livre nesta data.</span>}</div></>
            ) : (
              <><span className="modal-icon warning"><X size={23} /></span><p>CANCELAR AGENDAMENTO</p><h2 id="modal-title">Tem certeza?</h2><span>{selectedBooking.politica.texto_publico || "O cancelamento será registrado imediatamente na agenda."}</span><div className="modal-actions"><button className="back-button" onClick={() => setModal(null)}>Manter horário</button><button className="cancel-button" disabled={saving} onClick={() => void mutateAccount("PATCH", { action: "cancelar", bookingId: selectedBooking.id, reason: "Cancelado pelo cliente na área autenticada." }, "Agendamento cancelado.")}>{saving ? "Cancelando…" : "Sim, cancelar"}</button></div></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
