import type { Metadata } from "next";
import { ClientArea } from "./client-area";
import { getRequestPublicSite } from "@/lib/supabase/request-site";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Área do cliente",
  description: "Consulte, confirme, remarque ou cancele seus agendamentos.",
  robots: { index: false, follow: false },
};

export default async function ClientPage() {
  const site = await getRequestPublicSite();
  if (!site) notFound();
  const location = [site.unidade?.bairro, site.unidade?.cidade].filter(Boolean).join(" · ");
  return (
    <main id="conteudo">
      <ClientArea
        location={location}
        siteName={site.site.nome_publico}
        whatsapp={site.site.whatsapp}
      />
    </main>
  );
}
