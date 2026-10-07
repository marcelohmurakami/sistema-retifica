import type { MetadataRoute } from "next";
import { getRequestPublicSite } from "@/lib/supabase/request-site";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const data = await getRequestPublicSite();
  const name = data?.site.nome_publico ?? "Agendamento online";
  return { name, short_name: name.slice(0, 20), description: data?.site.descricao_seo ?? `Agendamento online de ${name}.`, start_url: "/", display: "standalone", background_color: "#fbf8f4", theme_color: "#6f3341", lang: "pt-BR" };
}
