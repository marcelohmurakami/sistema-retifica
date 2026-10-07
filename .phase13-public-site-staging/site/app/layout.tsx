import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRequestPublicSite } from "@/lib/supabase/request-site";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
function baseUrl(domain?: string) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return domain === "localhost" || domain === "127.0.0.1" ? "http://localhost:3000" : `https://${domain || "localhost:3000"}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getRequestPublicSite();
  if (!data) return { title: "Empresa não encontrada", robots: { index: false, follow: false } };
  const { site } = data;
  const title = site.titulo_seo || site.nome_publico;
  const description = site.descricao_seo || site.descricao_hero || `Agendamento online de ${site.nome_publico}.`;
  const image = site.imagem_compartilhamento_url || "/og.png";
  return {
    metadataBase: new URL(baseUrl(site.dominio)),
    title: { default: title, template: `%s | ${site.nome_publico}` }, description,
    keywords: site.palavras_chave, authors: [{ name: site.nome_publico }], creator: site.nome_publico,
    category: "beauty", alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "pt_BR", url: "/", siteName: site.nome_publico, title, description, images: [{ url: image, width: 1200, height: 630, alt: site.nome_publico }] },
    twitter: { card: "summary_large_image", title, description, images: [image] }, robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#6f3341" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const data = await getRequestPublicSite();
  return <html lang="pt-BR" className={geist.variable}><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a>{data && <SiteHeader name={data.site.nome_publico} showProfessionals={data.site.mostrar_profissionais && data.profissionais.length > 0} />}{children}{data && <SiteFooter data={data} />}</body></html>;
}
