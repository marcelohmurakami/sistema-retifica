import type { Metadata } from "next";
import { ConfirmationPanel } from "./confirmation-panel";
import { getRequestPublicSite } from "@/lib/supabase/request-site";
import { notFound } from "next/navigation";
import { getAuthenticatedCustomerAccount } from "@/lib/supabase/customer-session";

export const metadata: Metadata = {
  title: "Confirme seu horário",
  description: "Confirme sua presença ou escolha outro horário.",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage() {
  const site = await getRequestPublicSite();
  if (!site) notFound();
  const account = await getAuthenticatedCustomerAccount(site.empresa.id);
  const location = site.unidade ? [[site.unidade.endereco, site.unidade.numero].filter(Boolean).join(", "), site.unidade.bairro].filter(Boolean).join(" · ") : "";
  return <main id="conteudo" className="confirmation-page"><ConfirmationPanel companyName={site.site.nome_publico} location={location} authenticated={Boolean(account)} /></main>;
}
