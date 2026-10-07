import type { MetadataRoute } from "next";
import { getRequestPublicSite } from "@/lib/supabase/request-site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const data = await getRequestPublicSite();
  if (!data) return { rules: { userAgent: "*", disallow: "/" } };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${data.site.dominio}`;
  return { rules: { userAgent: "*", allow: "/", disallow: ["/minha-conta/", "/confirmacao/"] }, sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl };
}
