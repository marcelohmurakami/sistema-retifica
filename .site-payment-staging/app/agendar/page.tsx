import type { Metadata } from "next";
import { BookingWizard } from "./booking-wizard";
import { getPublicCatalog } from "@/lib/supabase/site";
import { getRequestPublicSite } from "@/lib/supabase/request-site";
import { notFound } from "next/navigation";
import { getAuthenticatedCustomerAccount } from "@/lib/supabase/customer-session";

export const metadata: Metadata = {
  title: "Agendamento online",
  description:
    "Escolha serviço, profissional, data e horário em poucos minutos.",
  alternates: { canonical: "/agendar" },
};

export const dynamic = "force-dynamic";

type BookingPageProps = {
  searchParams: Promise<{ servico?: string; profissional?: string }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const [site, params] = await Promise.all([
    getRequestPublicSite(),
    searchParams,
  ]);
  if (!site) notFound();
  const [catalog, account] = await Promise.all([
    getPublicCatalog(site.empresa.id),
    getAuthenticatedCustomerAccount(site.empresa.id),
  ]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: catalog.empresa.fuso_horario,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <main id="conteudo" className="booking-page">
      <div className="booking-intro">
        <p className="eyebrow">
          <span /> agendamento online
        </p>
        <h1>Reserve seu momento.</h1>
        <p>
          Escolha com calma. Você verá todos os detalhes antes de confirmar.
        </p>
      </div>
      <BookingWizard
        catalog={catalog}
        today={today}
        locationLabel={[site.unidade?.bairro, site.unidade?.cidade]
          .filter(Boolean)
          .join(" · ")}
        initialServiceId={params.servico ? Number(params.servico) : undefined}
        initialProfessionalId={
          params.profissional ? Number(params.profissional) : undefined
        }
        authenticatedCustomer={account ? {
          name: account.cliente.nome,
          phone: account.cliente.telefone ?? "",
          email: account.cliente.email ?? "",
          reminderWhatsapp: account.preferencias.whatsapp,
          reminderEmail: account.preferencias.email,
        } : null}
      />
    </main>
  );
}
